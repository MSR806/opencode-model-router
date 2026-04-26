import type { Plugin } from "@opencode-ai/plugin"
import { mergeConfig } from "./config.js"
import { clearSession, resolve } from "./resolver.js"

const plugin: Plugin = async (ctx, options) => {
  const cfg = mergeConfig(options)
  return {
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        clearSession(event.properties.info.id)
      }
    },
    "chat.message": async (input, output) => {
      const out = resolve(input.sessionID, input.model, output.parts, cfg)
      if (out.kind === "none") {
        return
      }
      if (out.kind === "revert") {
        output.parts.splice(0, output.parts.length, ...out.parts)
        if (input.model) {
          output.message.model = input.model
        }
        if (cfg.debug) {
          await ctx.client.app.log({
            body: {
              service: "opencode-model-router",
              level: "info",
              message: "opencode-model-router: @reset — sticky routing cleared; using default model for this call",
              extra: { sessionID: input.sessionID },
            },
          })
        }
        return
      }
      output.parts.splice(0, output.parts.length, ...out.parts)
      output.message.model = out.model
      if (cfg.debug) {
        await ctx.client.app.log({
          body: {
            service: "opencode-model-router",
            level: "info",
            message: `opencode-model-router: using ${out.model.providerID}/${out.model.modelID} (${out.detail})`,
            extra: { sessionID: input.sessionID },
          },
        })
      }
    },
  }
}

export default plugin
export { plugin as opencodeModelRouter }
