# Repository presentation

## Acceptance criteria

GitHub uses `main` as its default branch and has an informative description and relevant topics. The README leads with actual project artwork, explains the source/artist distinction visually, and gives a working source-build path before detailed technical material. Images render on GitHub in light and dark themes and fit mobile widths. Preserve the current application, codec, rendering bytes and safety boundaries. Ship one reviewed PR against `main`.

## Work

- [x] Inspect the live GitHub repository and README in the shared browser; confirm the missing metadata and existing image sizing.
- [x] Rename the remote default branch to `main`, branch from it, and fill in the repository description and topics.
- [x] Generate a banner, twelve-seed contact sheet, source/artist comparison and current workbench screenshot from actual project assets.
- [x] Rework README hierarchy and onboarding; retain detailed usage and limitations in linked documentation.
- [x] Check asset reproducibility, links, types/lint and existing verification. All four PNG hashes matched across repeated generation; 26 local documentation links resolved; `bun run verify` passed all 29 tests, deterministic builds and offline browser/gallery checks.
- [ ] Inspect the actual GitHub rendering on desktop and mobile, including theme behavior.
- [ ] Review the full diff, commit, push and open a PR against `main`.

## Design and scope

Use the shipped warm paper, black ink and restrained olive palette. Large serif lettering and the real logogram carry the banner; comparison and contact-sheet graphics explain the tool rather than inventing decoration. These are repository presentation assets, not approval of any unchosen app mockup. GitHub metadata and branch naming are live settings; README changes land through the PR. No tagged release, deployment or merge is included.

The mechanical design detector reported one warning for Arial in the asset generator. Retain the shipped app's system sans-serif family for these documentation graphics rather than adding a font dependency. The generator runs offline and adds no runtime dependency.
