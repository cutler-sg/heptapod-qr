# Preparing and publishing a release

The current target is **Heptapod QR / `heptapod-qr` 0.1.0**. Source is published at [cutler-sg/heptapod-qr](https://github.com/cutler-sg/heptapod-qr), with `main` as the default branch. Release packaging remains local; creating a tag or publishing a release requires explicit authorization. Check [the actual workflow runs](https://github.com/cutler-sg/heptapod-qr/actions/workflows/verify.yml) for remote CI status rather than inferring it from the configuration or local results.

## Fresh checkout

Use Bun 1.3.14, the committed lockfile, and Info-ZIP `zip`/`unzip` (the packaging tools). The verified packaging environment is Linux; equal bytes across different ZIP implementations are not promised. From a fresh checkout:

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run verify
bun run release
bun run test:release
```

The dependency/browser installation steps need network access. The application and produced archive operate offline. `verify` covers type/lint checks, unit tests, deterministic build checks, browser workflows and showcase checks. `test:release` compares two ZIP builds, checks entries and checksums, then runs the browser workflows against the unpacked app and gallery offline. `bun run showcase` regenerates the gallery; `bun run test:showcase` checks it independently. Record actual outcomes and environment; do not relabel old evidence as a current run.

## Inspect the artifact

The release command writes `release/heptapod-qr-0.1.0.zip` and `release/SHA256SUMS`. Packaging uses an explicit allowlist and deterministic archive metadata. Confirm checksums and compare repeated builds:

```sh
cd release
sha256sum -c SHA256SUMS
```

Extract the ZIP into a new directory, open the enclosed `heptapod-qr-0.1.0/` folder and open its `index.html` directly with networking disabled. Inspect source decoding, gallery and selected exports. Confirm the archive contains the intended documentation, license/notices, artist checklist and selected examples. It must not contain Python research tooling, private photographs, credentials, dependency trees or unrelated working files. Review plaintext example/project/manifest content deliberately. Source SVG is reversible despite having no plaintext metadata.

Review the complete diff, compatibility identifiers, notices and changelog. Keep detailed source-only audit/research documents in the repository; links to those documents need not imply that the full research tree ships in the archive. A passing physical-screening report is not tattoo suitability certification.

## Updating the upstream pin

1. Select an explicit upstream commit and inspect its license, history, core decoder/encoder and extras changes. Never update from a floating CDN or assume an npm version identifies a geometry format.
2. Compare the vendored files against that checkout and record any local modifications in `vendor/heptapod-ink/PROVENANCE.md`; preserve full license notices.
3. Run the upstream tests and corpus, then application verification. Examine source round trips, artist changes and exact-byte goldens; do not refresh fixtures automatically.
4. Determine schema/codec/renderer compatibility separately from product versioning. Explain intentional changes in the changelog and compatibility record, including any rejected legacy formats.
5. Regenerate examples and release artifacts, inspect them, and record actual results before proposing publication.

## Publication gate

The public source repository and [private vulnerability-reporting route](../SECURITY.md) were established on 15 November 2026 with user authorization. Before publishing a release, verify remote CI and confirm license/notices, public example consent, version and final checksums. Tags and release publication remain manual authorized actions; there is no automatic publishing step in local release preparation.
