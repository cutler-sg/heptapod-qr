# Workbench guide

Detailed input, export and geometry contracts for [Heptapod QR](../README.md). For installation, start with the [quick start](../README.md#quick-start).

## Using the workbench

1. Choose exact spelling (default `Michael`), an explicitly entered/selected meaning phrase, or non-reversible decorative art. The traditional etymology option is “Who is like God?”, cited to [Behind the Name](https://www.behindthename.com/name/michael). Selecting the mode does **not** silently choose that phrase.
2. Inspect selected input and payload. Quotes/escapes expose spaces, newlines and tabs. Case and whitespace are never changed. Default Unicode normalization is **none**; NFC is an explicit option. Invalid UTF-16, empty input and payloads over **128 UTF-8 bytes** are rejected. Whitespace-only input is allowed and remains visible as an escaped string.
3. Choose one of twelve reproducible consecutive seeds. Seed changes retain the encoded digit/mark classes. Save project records the **selected** seed; loading makes that seed the start of a fresh twelve-study grid.
4. Compare **Encoded source** and **Artist study**. All source variants round-trip through the pinned decoder. Source and derivative have separate print-scale screening reports. Width is the square **canvas** size in mm, including margins; the report gives actual ink bounds.
5. Adjust physical controls and ornaments. Mandatory data-tendril count is fixed by the payload. Extra count, density and reduction affect only ornament. The source is preserved separately and ignores artist linework controls. Warnings never cause automatic truncation or dropped data.
6. Export files for the artist, together with the review checklist. Undo restores prior states and variant choices; reset returns to Michael and seed 42. Project import is validated and rejects inconsistent derived data. SVG import is decode-only for the supported source subset, never arbitrary SVG display.

## What survives

The audited heptapod-ink source is pinned to commit `34817c6f925a85ece2c80599148b70d96de578696bf4bb86e9cc8f0a8c12c49e` (a 64-hex Git object ID). Package 0.1.3 identifies **restored geometry format v1** at that commit. The README's abandoned “0.1.2/0.1.3” wording does not reliably identify the format; see the [audit](UPSTREAM-AUDIT.md).

The source decoder reads serialized, ordered path coordinates and a CRC. It does not recover plaintext metadata, read a photograph or prove visible artwork is intact. The core ignores transforms and styling; the app therefore rejects these on import. Source exports retain the original polygons, disable cosmetic filters, add physical dimensions/padding, and bake rotation into coordinates with a fresh round-trip check.

The artist study retains slot classes but changes widths, curves and point counts. It is an **artistic derivative without supported geometry decoding**. Decorative mode has no reversible text payload at all. Artist edits, a photograph, tattooing and skin aging have no machine-decoding guarantee. Geometry encoding is not encryption: removing metadata does not make the source anonymous.

## Exports and examples

- Preserved v1 source SVG, physical dimensions in mm; metadata-free.
- Editable artist/stencil SVG made from filled vector paths; metadata-free.
- Reversed SVG: white design shapes on a black field, exchanging ink and negative space.
- Explicitly named **MIRRORED TRANSFER** SVG: horizontal reflection, separate from final orientation.
- PNG preview: 600 dpi with a pHYs physical-density chunk (90 mm → 2,126 × 2,126 px). Use the scale-bar print sheet to verify actual printing.
- True-scale A4 HTML print sheet with a 50 mm bar. Print at **100% / Actual size**, disable fit-to-page and browser headers/footers. Save as PDF using the browser if wanted. Examples include pre-rendered A4 PDFs.
- Project JSON and separate provenance manifest with original/normalized text, mode, seed, dimensions/settings, versions, upstream commit and exact SVG SHA-256 hashes. These and comparison sheets contain private input; filenames omit entered names in app exports.
- Comparison sheet showing spelling, chosen meaning and decoration, with source and artist columns. Its images are comparison-sized, not print templates.

`examples/` contains Michael, michael, Who is like God?, and There is no linear time. Each has twelve source/artist pairs and the complete selected-seed export set. The last is an original encoding of English text, not a reconstruction of a film glyph. Open `examples/comparison.html` or its PDF.

## Limitations

Physical screening uses polygon intersections/distances and authored cross-sections; it is conservative and is not a complete medial-axis/minimum-feature proof. Narrow channels can be missed between samples, and intentional attachment neighbourhoods are exempt. Numerical minima concern designed geometry, not healing, longevity or safety. Shorter tendrils can fit entirely within a join region. Scaling estimates cannot repair crossings, and may exceed the application's 180 mm canvas limit. An artist must decide whether to enlarge, simplify or abandon a study.

SVG bytes, projects and manifests contain no timestamps. SVG/PNG generation is deterministic for a pinned renderer/runtime. Print geometry is fixed, but browser-generated PDF containers may include browser-specific fonts, compression and dates; PDF byte identity is not promised. The bundled PDF examples normalize creation/modification dates. Browser verification was Chromium on Linux; other engines and physical printer calibration remain unverified.
