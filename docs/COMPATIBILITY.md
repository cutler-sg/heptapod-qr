# Compatibility

Heptapod QR 0.1.0 is the public product/package name. Existing internal identifiers remain unchanged:

| Boundary | Identifier or pin |
| --- | --- |
| Saved project | `arrival-atelier-project/1` |
| Provenance manifest | `arrival-atelier-manifest/1` |
| Intermediate representation | `atelier-ir/1` |
| Artist renderer | `atelier/1` |
| Source geometry | heptapod-ink restored format v1 |
| Upstream commit | `34817c6f925a85ece2c80599148b70d96de578696bf4bb86e9cc8f0a8c12c49e` |
| Audited upstream labels | core 0.1.3; extras 0.1.4 |

Product version and codec/renderer/schema versions serve different purposes. Renaming the product does not rewrite stored records or change the geometry codec. Unknown saved versions and inconsistent derived fields are rejected; there is no implicit migration promise.

The selected upstream core is vendored and byte-pinned. On 11 November 2026, the currently published npm 0.1.3 core was independently checked against the pinned checkout and matched byte-for-byte. This is evidence about that checked artifact, not a guarantee about every historical package download. Package labels alone do not distinguish the abandoned v2 geometry from restored v1; see the [upstream audit](UPSTREAM-AUDIT.md) and [provenance](../vendor/heptapod-ink/PROVENANCE.md).

The supported decoder reads serialized ordered SVG paths with CRC-16. Source exports retain the required geometry, bake rotation into coordinates and check the round trip. Unsupported transforms, active content and arbitrary SVG are rejected on import. Artist derivatives, decorative art, photographs and edited or tattooed geometry have no supported decoding guarantee. Neither format is a canonical film-language translation.

## Interoperability contract

- Every supported encoded source export must decode to its exact payload using the unmodified pinned upstream decoder, with no plaintext metadata required.
- Upstream v1 files in the app's accepted SVG subset must decode through `decodeSourceSvg`. This is intentionally narrower than the upstream parser: black paths/circles, one SVG document, expected path syntax, and no transforms, scripts, foreign objects, styles, external resources or unexpected attributes. Import limits and validation are in `src/import-svg.ts` in the source repository.
- The committed upstream corpus gates canonical encoder bytes and round trips. Existing saved examples gate old project import and reproduction; artist goldens gate the independent renderer. The product rename must not refresh either set of SVG goldens.
- Unsupported v2 geometry, corrupt payloads and unknown saved versions must fail explicitly. No decoder is selected by package version alone.
- No compatibility promise extends to the modified artist geometry, arbitrary vector-editor rewrites, raster images or tattoos. The frozen source and project remain the reproducible record.

SVG determinism is pinned by exact-byte goldens and the upstream corpus. Projects and manifests contain no timestamps. PNG output is deterministic for the pinned renderer/runtime; PDF byte identity across browsers is not promised. The recorded browser evidence covers Chromium on Linux. Other browsers, screen readers and physical printer calibration remain unverified; see [test results](TEST-RESULTS.md).

Review codec, schema, rendering and export changes as compatibility changes. Do not replace the vendored source using a floating package version or CDN. Follow the explicit update checks in [releasing](RELEASING.md).
