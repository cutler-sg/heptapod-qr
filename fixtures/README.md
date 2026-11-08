# Fixtures

- `golden.json`: app version 1 source/artist SVG bytes for the four requested texts plus non-reversible decoration. No automatic regeneration during tests. For an intentional renderer change, bump the render version, inspect source/derivative diffs and update these deliberately.
- `upstream-entries.jsonl.gz`: unchanged committed hash corpus from the pinned upstream commit (2,097 entries); MIT license in `vendor/heptapod-ink/LICENSE` applies.
- `legacy-v2.svg`: first committed SVG from upstream `corpus/legacy-v2.jsonl.gz`, retained as an explicit unsupported-format fixture. Same MIT notice applies.

Original upstream core source SHA-256: `1ebab3bb59ed0f68c31b84f19459f9d2121dcd6168213be5c87d506b54d61f6d`. Verify with `sha256sum vendor/heptapod-ink/core.js`.
