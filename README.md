# opencode-model-router

OpenCode plugin: prefix a user message with a short `sigil` + key (default `@fast`, `@pro`) to pick which provider/model OpenCode should use for that turn. The tag is removed before the text is sent to the model. The chosen model is remembered for the rest of the session until you use `@reset` or change the key again.

## Install

**From the published package** (after you publish to npm, or with `bun add` to a monorepo):

Add to `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "opencode-model-router",
      {
        "sigil": "@",
        "debug": false,
        "keys": {
          "fast": {
            "providerID": "anthropic",
            "modelID": "claude-3-5-haiku-20241022"
          },
          "pro": {
            "providerID": "anthropic",
            "modelID": "claude-opus-4-5-20250929"
          }
        }
      }
    ]
  ]
}
```

`plugin` accepts either a string package name, or a tuple `["name", { options }]` (see the OpenCode v2 `Config` type: `plugin` is an array of `string | [string, object]`). Options are passed as the second argument to the plugin.

**From a local build** while developing this repo:

```jsonc
{
  "plugin": [
    [
      "file:///absolute/path/to/opencode-model-router/dist/index.js",
      { "debug": true }
    ]
  ]
}
```

Use an absolute `file://` URL. Restart OpenCode after changing the config.

## Usage

- `@fast explain what a PRNG is` — use the `fast` model, strip the prefix, keep using it on later turns.
- `Just the question, no prefix` — if you already chose a key earlier in the session, the same model is applied again (no need to repeat `@fast` every time).
- `@pro refactor this module` — switch to the `pro` model for the session.
- `@reset` — clear the sticky choice for this session; the next turn follows OpenCode’s default model again. The word `@reset` is stripped from the message.

Keys must be at least 2 characters, `[a-zA-Z0-9_]{2,32}` immediately after the sigil, followed by optional whitespace, then the rest of your message.

## Built-in keys

- **`reset`**: always recognized (no need to add it to `keys`). Clears in-memory session routing and restores the default model for that message.
- All other names come only from your `keys` object.

## Develop

```bash
bun install
bun run build   # emits dist/
bun test
```

## License

MIT
