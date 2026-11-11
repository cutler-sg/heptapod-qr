# Local publication review — 11 November 2026

This is preparation evidence, not permission to publish. No remote, public repository, tag, deployment or maintainer contact was created. Public application version is 0.1.0; existing serialized formats and artwork bytes stay unchanged.

## Scope and findings

An independent read-only review examined the initial 210 tracked files (approximately 10.6 MB), reachable Git object paths, commit identities, license/provenance files and bounded credential-prefix/private-key patterns across all reachable commits. At the start there were five commits; the bounded scan also covered the first release-plan commit. No matching credential/private-key patterns or protected credential filenames were found. This is not an exhaustive secret scan or ownership/legal clearance.

- The uploaded tattoo photograph and image-analysis pixel arrays are not tracked and do not appear in the reachable filename inventory. The source repository intentionally retains three photo-result JSONs containing a SHA-256 fingerprint of the private input. This can identify the same photograph but is not the photograph. The offline ZIP excludes the entire experiment and all evidence files.
- Known example names and phrases are intentional public-release candidates. Saved projects and manifests reveal their payloads. Source SVG geometry is also reversible; removing plaintext metadata does not anonymize it.
- Generated comparison/showcase HTML and a design-detector report contained absolute workstation paths. Current files now use relative paths. Older commits still contain the historical paths.
- Git history contains an author email that is not a GitHub noreply address. The review does not print that address. Commit identity/configuration was not changed and history was not rewritten.
- Zod's summary notice year was corrected to match its preserved 2025 license text. Upstream fixture and optional Python adaptation attribution is now also visible in the top-level notices; the Python script contains direct attribution.
- The large standalone showcase is an intentional generated HTML asset, not an unexplained dump. Its images are local procedural SVGs. Current browser evidence contains the app and example artwork, not the tattoo photograph.

A broader email-content helper stalled on an embedded-SVG HTML file and was stopped with the user's explicit consent. The completed bounded scan is the evidence used above; no claim is made that the stalled scan passed. Protected credential files were not read. Binary metadata and every historical screenshot were not exhaustively inspected.

## Before publication

The user must authorize the public repository/release separately. In that review, explicitly decide whether to publish the existing history (including author email and old workstation paths), or prepare a separate sanitized initial snapshot. Do not rewrite or discard history automatically. Confirm whether the photo-input fingerprint should remain in the public research record. No tattoo photograph is included by default.

Enable and verify a private vulnerability-reporting route when the repository exists, then update SECURITY.md. Run the committed CI remotely before claiming remote CI success. Select the exact prepared ZIP and checksums for publication; the release builder uses an explicit file allowlist and never copies the whole working directory.

These decisions do not block local preparation, validation or review of the offline artifact.
