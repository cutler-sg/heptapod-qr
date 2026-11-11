# Arrival Atelier implementation plan

## Acceptance criteria
A local-only TypeScript tool preserves exact case and whitespace, explicitly selects meaning text, generates 12 deterministic variants, separates geometric encoding from tattoo derivatives and decoration, measures final millimetre geometry, safely imports projects/SVGs, and exports source, stencil/reverse/transfer, PNG, print sheet, project and manifest. Four requested examples and a comparison sheet ship with source, licenses, tests and limitations. No remote repository or publication.

## Ordered work
- [x] Audit preferred upstream LICENSE, source, extras, tests, compressed golden corpus and history; run upstream tests and pin full commit.
- [x] Record audit, architecture and provenance; vendor only licensed codec/helpers and preserve notices.
- [x] Build versioned validated project/IR and bounded geometry-only import; verify upstream round trips before derivative rendering.
- [x] Build deterministic tattoo/decorative geometry and millimetre screening; retain mark classes, distinguish terminal taper and intentional joins.
- [x] Build offline editor: modes, payload disclosure, 12 seeds, dimensions/detail controls, compare, undo/reset and project import/export.
- [x] Add metadata-free SVG, reversed/explicit mirror, PNG, 100%-scale print sheet and hash manifests.
- [x] Run upstream/application/golden/geometry/browser/offline checks; inspect desktop/mobile together; fix findings.
- [x] Generate Michael, michael, Who is like God?, There is no linear time examples and comparison; document results and artist checklist.
- [x] Review full diff, commit all deliverables, leave clean local feature branch. No push/PR: no remote, explicitly local-only task.

## Rendering decision
Preserve the vendored v1 encoder and its ordered polygon coordinates in the source export, adding physical SVG dimensions and symmetric viewBox padding only. Tattoo paths are a new artist-facing rendering of the same slots, explicitly **artistic derivatives, not supported geometry encodings**. They preserve all slot classes but do not promise upstream decoding. Decoration uses a one-way text/seed hash. No plaintext is placed in artwork; project and manifest deliberately contain it.

## Follow-up: complete design showcase
- [x] Build a gallery of all 48 source/artist pairs plus the decorative study, with enlarged comparison and reversal/transfer treatments.
- [x] Verify offline images, gallery filters, selection and mobile sizing; display the gallery in the conversation.
- [x] Commit the reproducible gallery and standalone HTML on the existing local branch.

## Follow-up: experimental optical decoding
- [x] Implement a local image-only mark reader, separated from known-source matching and plaintext; document assumptions and search limits.
- [x] Verify checksum rejection and synthetic raster behavior; attempt the supplied photo and report actual success/failure and ambiguity.
- [x] Preserve reproducible analysis code and results without committing the private photograph; review and commit locally.

## Follow-up: Heptapod QR public-release preparation

Prepare public version 0.1.0 locally. No remote creation, push, tag, deployment, publication or contact. Keep the existing branch and preserve all saved-project, IR, manifest and rendering identifiers. Release artwork must retain existing geometry and golden fixtures.

- [ ] Apply Heptapod QR identity and 0.1.0 application version; verify existing saved projects and artwork remain compatible.
- [ ] Prepare README, contribution/security guidance, compatibility contract, release notes and upstream-update instructions.
- [ ] Audit tracked files and reachable Git history for private content, local paths and attribution; record evidence and unresolved publication decisions without rewriting history.
- [ ] Add pinned, read-only CI verification and a reproducible, allowlisted offline release ZIP with instructions, notices, selected examples and checksums.
- [ ] Run lint/types/tests, offline app/showcase checks, deterministic build/package checks and a fresh-checkout verification; regenerate branded examples.
- [ ] Review full diff, record actual results and commit locally with clean state. Publication remains a separate user-authorized action.
