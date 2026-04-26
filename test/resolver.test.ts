import { beforeEach, describe, expect, it } from "bun:test"
import { mergeConfig } from "../src/config.js"
import { __resetStoreForTests, clearSession, resolve } from "../src/resolver.js"
import type { Part } from "@opencode-ai/sdk"

function textPart(t: string): Part {
  return {
    id: "p1",
    sessionID: "sess1",
    messageID: "msg1",
    type: "text",
    text: t,
  }
}

const cfg = mergeConfig({})

beforeEach(() => {
  __resetStoreForTests()
})

const mFast = { providerID: "anthropic", modelID: "claude-3-5-haiku-20241022" }
const mPro = { providerID: "anthropic", modelID: "claude-opus-4-5-20250929" }
const mDefault = { providerID: "openai", modelID: "gpt-4o" }

describe("resolve", () => {
  it("strips @fast and returns configured model", () => {
    clearSession("S")
    const parts: Part[] = [textPart("@fast What is 2+2?")]
    const o = resolve("S", mDefault, parts, cfg)
    expect(o.kind).toBe("apply")
    if (o.kind !== "apply") {
      return
    }
    expect(o.model).toEqual(mFast)
    expect((o.parts[0] as Part & { type: "text" }).text).toBe("What is 2+2?")
  })

  it("reapplies stored model on a later message with no @ prefix", () => {
    clearSession("S2")
    resolve("S2", mDefault, [textPart("@pro refactor X")], cfg)
    const o = resolve("S2", mDefault, [textPart("Next line")], cfg)
    expect(o.kind).toBe("apply")
    if (o.kind !== "apply") {
      return
    }
    expect(o.model).toEqual(mPro)
    expect((o.parts[0] as Part & { type: "text" }).text).toBe("Next line")
  })

  it("does not match unknown @keys and leaves a passthrough of none (no store)", () => {
    clearSession("S3")
    const o = resolve("S3", mDefault, [textPart("@unknown hello")], cfg)
    expect(o.kind).toBe("none")
  })

  it("@reset clears stickiness and strips the token", () => {
    clearSession("S4")
    resolve("S4", mDefault, [textPart("@fast hi")], cfg)
    const o = resolve("S4", mDefault, [textPart("@reset continue")], cfg)
    expect(o.kind).toBe("revert")
    if (o.kind !== "revert") {
      return
    }
    expect((o.parts[0] as Part & { type: "text" }).text).toBe("continue")
    const o2 = resolve("S4", mDefault, [textPart("after")], cfg)
    expect(o2.kind).toBe("none")
  })
})

describe("session cleanup", () => {
  it("clearSession removes sticky state", () => {
    const sid = "SID"
    resolve(sid, mDefault, [textPart("@fast a")], cfg)
    const o1 = resolve(sid, mDefault, [textPart("b")], cfg)
    expect(o1.kind).toBe("apply")
    clearSession(sid)
    const o2 = resolve(sid, mDefault, [textPart("b")], cfg)
    expect(o2.kind).toBe("none")
  })
})
