# Contributing

Heptapod QR is a static, offline TypeScript application. Install Bun and the locked development dependencies, then the pinned browser used by verification:

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run verify
```

Dependency and browser installation require network access. The built application runs from a local file without a server. `bun run build` produces `dist/index.html`; `bun run showcase` rebuilds the offline gallery and `bun run test:showcase` checks it. See [architecture](docs/ARCHITECTURE.md) and [compatibility](docs/COMPATIBILITY.md) before changing geometry, imports or saved formats.

Keep changes focused and include checks for changed behavior. Preserve exact input, deterministic output, strict import validation, offline operation and required license notices. Never commit private photographs, entered personal data or credentials. Project, manifest and comparison exports contain plaintext; encoded source geometry also reveals its payload to a compatible decoder.

`fixtures/golden.json` records exact source and artist SVG bytes. The upstream corpus has 2,097 entries. Do not refresh goldens automatically to make failures pass. Explain intentional rendering changes, bump the renderer version when required, inspect the visual and compatibility consequences, and explicitly review updated fixtures. A passing test suite does not approve a change automatically.

A proposed upstream update must follow [the release procedure](docs/RELEASING.md). Optical decoding, tattoo longevity and physical printer calibration are not established capabilities; documentation and contributions must keep those boundaries explicit.

README artwork is built from committed example SVGs and a screenshot of the current app. After `bun run build`, run `bun scripts/readme-assets.ts` to regenerate `docs/assets/`. It uses the pinned Playwright Chromium browser offline and leaves the codec and example geometry untouched. Review generated images alongside README copy; their previews are not true-scale print templates.
