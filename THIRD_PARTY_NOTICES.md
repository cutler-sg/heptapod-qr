# Third-party notices

## Runtime code included in the offline build

- **heptapod-ink** and selected **heptapod-ink-extras** helpers, copyright © 2026 Mads R. Havmand. MIT. Pinned source and modifications are recorded in `vendor/heptapod-ink/PROVENANCE.md`; complete notice in `vendor/heptapod-ink/LICENSE`.
- **Zod 4.3.6**, copyright © 2020 Colin McDonnell. MIT. Complete notice in `vendor/licenses/zod-MIT.txt`.

Both complete runtime license texts are also embedded as comments in the standalone HTML build. Generated vector geometry is procedural; it uses no traced film glyphs, film training set, Wolfram assets, Text2Logogram code, external images or AI-generated art.

## Build and test tools (not shipped in the browser runtime)

Bun drives the scripts. The lockfile pins esbuild (MIT), TypeScript (Apache-2.0), Biome (MIT/Apache-2.0), Playwright (Apache-2.0), and Bun/Node type declarations (MIT). Their packages retain their respective licenses in `node_modules`. Chromium is used only by local verification/example scripts and is not embedded in the app.
