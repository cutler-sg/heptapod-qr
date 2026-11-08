# Arrival Atelier implementation plan

## Acceptance criteria
A local-only TypeScript tool preserves exact case and whitespace, explicitly selects meaning text, generates 12 deterministic variants, separates geometric encoding from tattoo derivatives and decoration, measures final millimetre geometry, safely imports projects/SVGs, and exports source, stencil/reverse/transfer, PNG, print sheet, project and manifest. Four requested examples and a comparison sheet ship with source, licenses, tests and limitations. No remote repository or publication.

## Ordered work
- [x] Audit preferred upstream LICENSE, source, extras, tests, compressed golden corpus and history; run upstream tests and pin full commit.
- [ ] Record audit, architecture and provenance; vendor only licensed codec/helpers and preserve notices.
- [ ] Build versioned validated project/IR and bounded geometry-only import; verify upstream round trips before derivative rendering.
- [ ] Build deterministic tattoo/decorative geometry and millimetre screening; retain mark classes, distinguish terminal taper and intentional joins.
- [ ] Build offline editor: modes, payload disclosure, 12 seeds, dimensions/detail controls, compare, undo/reset and project import/export.
- [ ] Add metadata-free SVG, reversed/explicit mirror, PNG, 100%-scale print sheet and hash manifests.
- [ ] Run upstream/application/golden/geometry/browser/offline checks; inspect desktop/mobile together; fix findings.
- [ ] Generate Michael, michael, Who is like God?, There is no linear time examples and comparison; document results and artist checklist.
- [ ] Review full diff, commit all deliverables, leave clean local feature branch. No push/PR: no remote, explicitly local-only task.

## Rendering decision
Preserve the vendored v1 encoder and its ordered polygon coordinates in the source export, adding physical SVG dimensions and symmetric viewBox padding only. Tattoo paths are a new artist-facing rendering of the same slots, explicitly **artistic derivatives, not supported geometry encodings**. They preserve all slot classes but do not promise upstream decoding. Decoration uses a one-way text/seed hash. No plaintext is placed in artwork; project and manifest deliberately contain it.
