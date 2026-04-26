# Changelog

## 0.1.0 — 2026-04-27

Initial release.

- `chat.message` hook intercepts every user message
- `@key` token anywhere in the message switches the session to the configured `provider/model`
- The token is stripped before the message reaches the LLM
- Chosen model is sticky for the session — no need to repeat the key on every turn
- `@reset` clears the sticky choice for the session
- All model keys are user-configured in `opencode.json` — no built-in defaults
- `debug: true` option logs routing decisions to the OpenCode log
