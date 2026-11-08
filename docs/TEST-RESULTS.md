# Verification results

Run on 8 November 2026, Linux, Bun 1.3.14, TypeScript 5.9.3, Chromium 145 via Playwright 1.58.2. Upstream suite used Node v24.18.0.

| Scope | Actual result | Evidence |
| --- | --- | --- |
| Pinned upstream build + test suite | 33 passed, 0 failed | `evidence/upstream-tests.txt` |
| Application codec / rendering / geometry tests | 28 passed, 0 failed; 4,689 assertions | `evidence/app-tests.txt` |
| Upstream hash corpus | 2,097 entries checked, including empty rejection; source hashes and round trips match | `tests/codec.test.ts`, `fixtures/upstream-entries.jsonl.gz` |
| Browser workflows from a local file URL, offline context | 12 grouped checks passed | `evidence/browser-tests.json`, `evidence/browser-tests.txt` |
| Runtime network/privacy | 0 HTTP(S) requests, 0 page errors, no localStorage entries | Same browser evidence |
| TypeScript | `bun run typecheck` passed | Command rerun after final changes |
| Biome | `bun run check` passed without warnings | Command rerun after final changes |
| Example generation | Four complete export sets, 48 source and 48 artist seed variants, comparison and decorative sample | `evidence/examples.txt`, `examples/` |
| Desktop / mobile inspection | 1440 px and 390 px screenshots inspected; mobile has no horizontal overflow | `evidence/screenshots/` |
| Print sheet | 90 mm image: 340.15625 CSS px; 50 mm bar: 188.96875 CSS px, both within 0.1 px of 96 px/in conversion; A4 PDF scale=1 | Browser evidence, `examples/Michael/print-at-100-percent.pdf` |
| PNG | 2126 × 2126 px at 90 mm, pHYs 23,622 pixels/metre (600 dpi rounded), valid browser decoding | Browser workflow checks |

## Tested encoding guarantees

- Exact Michael and michael are distinct; all four requested examples round-trip through their source SVGs across all twelve seeds.
- UTF-8 fallback, emoji, CJK, combining characters, explicit NFC, punctuation, leading/trailing whitespace, tabs/newlines and whitespace-only values are tested. Empty input, malformed surrogates, byte-limit excess, invalid settings and incompatible versions fail.
- Source remains decodable with no plaintext metadata; a deliberately incorrect optional metadata field does not supply the decoded text. Low-level packing/rendering agrees with the core.
- Root physical dimensions, symmetric padding and baked rotations preserve source decoding. Legacy v2 and deliberately damaged geometry fail.
- Same input/settings/seed/version produces identical SVG; golden source and derivative bytes are checked separately. Project export/import reproduces both byte-for-byte.
- Artist paths preserve ordered mark classes and all mandatory tendrils. Their changed point counts are deliberately rejected by the original decoder. This is an artistic derivative, not a new supported geometry codec.
- Decorative art is deterministic, has no source export/checksum claim, and is labelled non-reversible.

## Tested geometry and browser boundaries

Deliberately failing fixtures cover narrow structural sections, narrow terminal tips, clipping, near-touching gaps, contact, overlap, containment, self-intersection and narrow exterior channels. Intentional ring/tendril joins are exempt only within a bounded circle; a near miss elsewhere on the same pair still fails. Four-decimal-coordinate rounding tolerance is explicit.

The default 90 mm Michael artist study, seed 42, has a measured minimum structural section of approximately 1.169 mm, terminal minimum 0.817 mm, and screened gap 0.932 mm. Its ink bounds are approximately 71.0 × 62.5 mm. It has no flagged structural violations under the default 0.8 mm width/gap settings. These are geometry observations, not tattoo suitability or healing claims. Other phrases/seeds/settings can produce warnings; exports do not silently remove marks to make them pass.

Browser checks exercise modes, explicit etymology choice, reset/undo, variant selection, project save/load, case preservation, source/artist comparison, transparency, physical controls, every export, source decode, and hostile SVG/JSON rejection. Generated previews are image data URLs. Imported SVG never enters the DOM; unknown/active elements, transforms and unsupported attributes are rejected. Zod rebuilds project data and derived IR is checked against recomputation.

## Review and resolved findings

An independent reviewer inspected source, screenshots and evidence and reran the 28 application tests successfully. It found two bounded export issues: PNG lacked a physical-density chunk, and the privacy notice omitted plaintext comparison files. The implementation now inserts/replaces a valid 600 dpi pHYs chunk and explicitly identifies project, manifest and comparison sheets as containing text. The final browser run checks the PNG density. The reviewer did not independently rerun the browser suite or physical printing; the fixes were verified locally.

The design scanner's static warnings are recorded in `evidence/design-detector.json`. Its missing-image and flat-type findings arise from generated image URLs and separately bundled CSS. Required encoding caveats triggered its prose heuristic. System-local typography is intentional for the offline tool. Screenshots confirm the actual rendering.

## Not confirmed

- A physical printer or tattoo on skin was not tested. Browser CSS/PDF scale does not calibrate a printer.
- Geometric screening is not an exhaustive medial-axis proof of every feature width/channel. Widths use authored cross-sections; self-channel screening is sampled and conservative. Original circular spatter is approximated by a polygon for screening. Collision warnings can remain, and scale suggestions cannot fix intersections.
- No optical/image/photo decoder exists. The core parser reads ordered serialized paths and ignores styling. CRC-16 does not authenticate or cryptographically protect input.
- Browser compatibility beyond the tested Chromium/Linux combination, screen-reader behavior, skin aging and artist modifications are unverified.
- SVG byte determinism is pinned by goldens. PDF byte identity across browser versions is not claimed; bundled example creation/modification dates are normalized without changing byte offsets.
- Alternatives were inspected at reference level only. No Torus or Python generator runtime/round-trip certification is claimed.
