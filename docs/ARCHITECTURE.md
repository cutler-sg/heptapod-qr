# Architecture and boundaries

A static TypeScript browser application builds to one HTML file with bundled JS/CSS. Open it directly from disk after installation/build; no local or remote server is required. No backend, persistent browser storage, telemetry, external font, image, network API, account or AI exists. CSP blocks connections and active imported content. Inputs live in memory until the user explicitly saves a project/manifest.

`model.ts` validates settings with Zod, preserves original input, selects explicit spelling/phrase/decorative mode, applies only chosen normalization (default none), rejects malformed UTF-16 and limits payload to 128 UTF-8 bytes. Case and whitespace are never folded or trimmed. Project JSON is versioned, bounded and reconstructed through the same validator; derived fields must match recomputation.

`codec.ts` adapts vendored v1 helpers and verifies every source round trip. The IR records original/selected/normalized input, mode, codec/render versions, ordered digits and mark classes, CRC, orientation convention, style seed, physical dimensions and constraints. Decorative mode uses deterministic hash-derived marks and has no reversible payload or CRC claim.

`render.ts` makes editable filled polygon paths in millimetres. Slot swelling classes and required tendril presence survive seeds. Changes to ring width, sampling and tapered ends mean these artist-facing files deliberately have no supported geometry decoder. Decorations do not carry essential information; no filter, blur or gray shading is essential. All control values are recorded separately in the manifest; artwork contains no plaintext metadata or volatile dates.

`geometry.ts` screens final filled polygons, with structural cross-sections separated from narrow terminal taper, pairwise separation/collisions, clipping and nonlocal self-intersections. Intended tendril/ring joins are spatially bounded, not blanket exemptions. Findings and limitations must be reviewed by an artist. A passing numerical check is not a healing, longevity or safety guarantee.

`exports.ts` keeps source, derivative, reversal, transfer, PNG, project, print sheet and manifest separately named. Reversal exchanges ink and substrate; mirroring is opt-in for transfers and never changes the final artwork silently. SHA-256 is calculated over the exact UTF-8 SVG bytes. A separate manifest contains input and provenance; stripping metadata does not anonymize reversible encoded geometry.

Imported SVG is never placed into the DOM. A bounded strict subset parser rejects active elements, external resources, transforms, unexpected attributes and unsupported path syntax, then hands reconstructed geometry to the upstream decoder. Import is a decode operation, not artwork loading. JSON objects are rebuilt from schemas; unknown versions and modified derived IR fail explicitly. Generated previews are SVG image blobs, never imported markup.
