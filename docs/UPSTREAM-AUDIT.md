# Upstream audit — 8 November 2026

## Decision
Adopt the MIT heptapod-ink **restored geometry format v1**, vendored from Tangled commit `34817c6f925a85ece2c80599148b70d96de578696bf4bb86e9cc8f0a8c12c49e`. This repository uses a 64-hex Git object ID. Package version is **0.1.3**; extras version is **0.1.4**. Those version labels are not a format discriminator.

Source: https://tangled.org/mads.havmand.eu/heptapod-ink

## Evidence inspected
Cloned full history (28 commits), read LICENSE, README, core encoder/decoder/declarations, extras packing/parser/renderer, test files, corpus generator, compressed golden corpus and legacy fixtures. The license is MIT, copyright 2026 Mads R. Havmand; preserved in `vendor/heptapod-ink/LICENSE`.

History: initial release `2e96e36` was 0.1.1; `be7d9a8` introduced smaller v2 geometry; `c50e9ad` is tagged v0.1.2; `428d856` changed v2 smoothing; **`acf6dd2` restored v1**; then `e4d0d8d` released package 0.1.3, `de6a04f` extras 0.1.4, and the pinned HEAD changed only demo CDN fallbacks. The README calls the abandoned experiment “0.1.2/0.1.3”, but the actual v0.1.3 Git tag follows the restoration. It is therefore unsafe to infer format from that prose or package version. We did not establish what every historical npm 0.1.3 download contained. We use the audited commit and verified geometry, never npm latest or a CDN.

## Actual test run
Node v24.18.0; `npm ci --ignore-scripts`, `npm run build`, `npm test` in the pinned checkout: **33 tests passed, 0 failed**, 21.73 seconds. Full output: `evidence/upstream-tests.txt`. Includes 1,200 random round trips, 600 generated comparisons with the installed published 0.1.1 alias, seeded variations, rotation, packing/helpers, legacy rejection and exact SHA-256 golden matching. Corpus has 2,097 entries (including one empty rejection), plus preserved legacy v1 and v2 SVG fixtures. Build dependencies were downloaded for this audit only. The finished tool performs no such downloads.

## Exact format
Text is packed in a compact alphabet if every character is supported; otherwise UTF-8 bytes are packed in base 257. A mode bit and CRC-16/CCITT (initial 0xffff, polynomial 0x1021) are added. Decimal digits, least significant first, form slots, padded to at least ten. `digit % 5` means no/small-out/large-out/small-in/large-in swelling; `digit >= 5` adds a mandatory outward tendril.

V1 ring has `2 × (29 + 8N)` ordered points, outer run followed by reversed inner run. Tendrils have exactly 122 points. Reading begins at the stroke's first point by the gap, proceeding clockwise in SVG coordinates. Width thresholds are 20/38 source units; midline offset determines in/out. V2's different ring count fails explicitly. CRC detects ordinary corruption; it is not authentication or error correction.

The decoder reads serialized coordinates and ignores transforms, fill, clipping, filters and masks. It can decode hidden or visually distorted geometry. This is **serialized path-geometry decoding**, not computer vision or proof that a displayed glyph is readable. No plaintext metadata is needed. Changing polygon order/count, absolute coordinates, stroke widths or tendril structure can break it. The app's strict source import rejects transforms and active content rather than trusting ignored presentation instructions.

## Adoption boundaries
`core.js` is byte-for-byte upstream `src/index.js`; its declarations are copied. `packing.js` and `parse.js` have only the bare module import redirected to local `./core.js`; `render.js` is copied unchanged. The extras renderer is tested through the interface but not used as a promise that arbitrary renderer controls preserve decoding. No film assets, tracing, training data, unlicensed Text2Logogram, or Wolfram assets are used.

Source exports retain original paths/circles, disable cosmetic filters, set physical millimetre dimensions, and symmetrically pad the viewBox without moving its centre. Optional rotation is baked into coordinates and round-trip checked. The tattoo renderer draws new filled vector outlines from the slot classes and labels the result an artistic derivative, unsupported by the original decoder. All mandatory tendrils stay present; decorative count controls only additional tendrils. No arbitrary artist edit, photograph, skin or aged tattoo is claimed decodable.

## Alternatives (reference-level inspection only)
[StevenGeller/torus](https://github.com/StevenGeller/torus) presents an MIT Rust implementation with an invented linguistic system and SVG/PNG output. [FlxB2/arrival_logograms](https://github.com/FlxB2/arrival_logograms) presents an MIT Python decorative generator. Neither was adopted or copied; no full runtime/codec audit is claimed for them. Heptapod-ink supplies the required small local geometry decoder and exercised golden corpus, so switching stacks was unnecessary. Any metadata retrieval in alternatives must not be equated to visible geometry decoding.

## Etymology and honesty
[Behind the Name: Michael](https://www.behindthename.com/name/michael) identifies the traditional etymology as “who is like God?”. The UI offers “Who is like God?” only through an explicit action. “Protector” is not presented as its literal etymology. No verified canonical Michael glyph or complete film-name grammar is established; Ian/Louise examples are not used to derive it.
