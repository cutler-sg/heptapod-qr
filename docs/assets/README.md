# README artwork

Run `bun run build`, then `bun scripts/readme-assets.ts` from the repository root. The generator uses the existing pinned Playwright dependency and its Chromium installation, offline. PNGs are committed so GitHub can display them without running code or resolving SVG fonts.

- `hero.png`: preserved source for “Who is like God?”, seed 46, with the project name and introduction.
- `studies.png`: preserved sources for that phrase, seeds 42–53.
- `source-and-study.png`: the same phrase and seed 46 as encoded source and artist study.
- `workbench.png`: the current built application at 1440 × 1100, showing the default Michael study.

Artwork is embedded from the original SVGs without altering their coordinates. Typography uses the same system serif/sans-serif families as the workbench. Image bytes can vary across operating systems and font installations; repeat builds are checked on the current Linux/Chromium environment. These images are presentation previews, not physical templates, encoded-source exports or promises of tattoo readability.
