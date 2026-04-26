# Contributing

## Setup

```bash
git clone https://github.com/MSR806/opencode-model-router.git
cd opencode-model-router
bun install
```

## Development

```bash
bun run build   # compile src/ → dist/
bun test        # run unit tests
```

## Testing locally with OpenCode

Add to `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugin": [
    [
      "file:///path/to/opencode-model-router/dist/index.js",
      {
        "debug": true,
        "keys": {
          "fast": "provider/model-id",
          "deep": "provider/model-id"
        }
      }
    ]
  ]
}
```

Restart OpenCode after every `bun run build`.

## Pull Requests

- Keep changes focused and small.
- Add or update tests in `test/` for any logic change.
- Run `bun test && bun run build` before opening a PR.
- Describe what the change does and why in the PR description.
