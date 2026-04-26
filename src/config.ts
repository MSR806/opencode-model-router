import type { ModelRef } from "./types.js"

export type RouterConfig = {
  /**
   * Prefix before the key, e.g. "@" for `@fast`.
   * Must be a non-alphanumeric start so keys stay unambiguous.
   */
  sigil: string
  /** If true, log routing decisions via OpenCode's structured logger */
  debug: boolean
  /**
   * Map of key name (lowercase) → model. Keys are matched case-insensitively after the sigil.
   * Optional built-in: `reset` — clears sticky session model and reverts to OpenCode's default for this call.
   */
  keys: Record<string, ModelRef>
}

export const defaultConfig: RouterConfig = {
  sigil: "@",
  debug: false,
  keys: {
    fast: { providerID: "anthropic", modelID: "claude-3-5-haiku-20241022" },
    pro: { providerID: "anthropic", modelID: "claude-opus-4-5-20250929" },
  },
}

const RESET = "reset"

export function isResetKey(key: string): boolean {
  return key.toLowerCase() === RESET
}

export function mergeConfig(raw: unknown): RouterConfig {
  if (!raw || typeof raw !== "object") {
    return { ...defaultConfig, keys: { ...defaultConfig.keys } }
  }
  const o = raw as Record<string, unknown>
  return {
    sigil: typeof o.sigil === "string" && o.sigil.length > 0 ? o.sigil : defaultConfig.sigil,
    debug: o.debug === true,
    keys: {
      ...defaultConfig.keys,
      ...(isRecord(o.keys) ? (o.keys as Record<string, ModelRef>) : {}),
    },
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x)
}
