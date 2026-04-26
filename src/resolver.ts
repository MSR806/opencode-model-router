import type { Part } from "@opencode-ai/sdk"
import type { ModelRef } from "./types.js"
import { isResetKey, type RouterConfig } from "./config.js"

const sessionStore = new Map<string, ModelRef>()

export function clearSession(sessionID: string): void {
  sessionStore.delete(sessionID)
}

/** Test helper — clears in-memory store between tests */
export function __resetStoreForTests(): void {
  sessionStore.clear()
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function lookupKey(keys: Record<string, ModelRef>, raw: string): ModelRef | "reset" | undefined {
  const lower = raw.toLowerCase()
  if (isResetKey(lower)) {
    // Allow reset without adding to `keys` — always recognized after sigil
    return "reset"
  }
  for (const [name, ref] of Object.entries(keys)) {
    if (name.toLowerCase() === lower) {
      return ref
    }
  }
  return undefined
}

function stripFromFirstTextPart(parts: Part[], consumed: number): Part[] {
  if (consumed === 0) {
    return parts
  }
  const out: Part[] = []
  let didStrip = false
  for (const p of parts) {
    if (!didStrip && p.type === "text") {
      out.push({ ...p, text: p.text.slice(consumed) })
      didStrip = true
    } else {
      out.push(p)
    }
  }
  return out
}

export type ResolveOutcome =
  | { kind: "none" } // Do not modify hook output
  | {
      kind: "apply"
      model: ModelRef
      parts: Part[]
      detail: string
    }
  | {
      kind: "revert"
      parts: Part[]
      detail: string
    }

/**
 * - On `@key` with a configured mapping: store model, strip prefix, return model to set.
 * - On `@reset`: clear stored model, strip prefix, caller should set message.model to input.model.
 * - On `@unknown`: leave message unchanged (no strip).
 * - On message without a leading key: re-apply stored model if any; parts unchanged.
 */
export function resolve(
  sessionID: string,
  defaultModel: { providerID: string; modelID: string } | undefined,
  parts: Part[],
  cfg: RouterConfig,
): ResolveOutcome {
  const first = parts.find((p): p is Part & { type: "text" } => p.type === "text")
  if (!first) {
    return applyOrPassthroughFromStore(sessionID, defaultModel, parts, cfg, "no text part")
  }

  const sigil = cfg.sigil
  if (!first.text.startsWith(sigil)) {
    return applyOrPassthroughFromStore(sessionID, defaultModel, parts, cfg, "no sigil")
  }

  const re = new RegExp(`^${escapeRe(sigil)}([a-zA-Z0-9_]{2,32})\\s*`)
  const m = first.text.match(re)
  if (!m) {
    // Starts with sigil but not our key pattern — do not treat as a switch (e.g. "@ mention")
    return { kind: "none" }
  }

  const rawKey = m[1]
  const found = lookupKey(cfg.keys, rawKey)
  if (found === undefined) {
    return { kind: "none" }
  }

  const consumed = m[0].length

  if (found === "reset") {
    clearSession(sessionID)
    return {
      kind: "revert",
      parts: stripFromFirstTextPart(parts, consumed),
      detail: "reset",
    }
  }

  sessionStore.set(sessionID, found)
  return {
    kind: "apply",
    model: found,
    parts: stripFromFirstTextPart(parts, consumed),
    detail: `key ${rawKey.toLowerCase()}`,
  }
}

function applyOrPassthroughFromStore(
  sessionID: string,
  defaultModel: { providerID: string; modelID: string } | undefined,
  parts: Part[],
  _cfg: RouterConfig,
  _reason: string,
): ResolveOutcome {
  const stored = sessionStore.get(sessionID)
  if (!stored) {
    return { kind: "none" }
  }
  // Sticky: same model for subsequent turns
  if (defaultModel && stored.providerID === defaultModel.providerID && stored.modelID === defaultModel.modelID) {
    return { kind: "none" }
  }
  return {
    kind: "apply",
    model: stored,
    parts,
    detail: "sticky reapply",
  }
}
