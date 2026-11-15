# Security

Heptapod QR runs locally without accounts, telemetry, network APIs or persistent browser storage. Inputs remain in memory until explicitly exported. Imported SVG is parsed as a strict, bounded geometry subset and is never inserted into the document; project JSON is validated and reconstructed. See [architecture](docs/ARCHITECTURE.md) for the boundaries and [verification results](docs/TEST-RESULTS.md) for their tested scope.

Encoded geometry is not encryption. Source SVGs can reveal their text through the compatible decoder even without metadata. Project files, manifests and comparison sheets contain plaintext. Treat those files as sensitive when their input is sensitive. CRC-16 detects ordinary corruption; it does not authenticate artwork or protect against tampering.

## Reporting vulnerabilities

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/cutler-sg/heptapod-qr/security/advisories/new). Private reporting was enabled and verified through the repository API on 15 November 2026. Do not put sensitive vulnerability details into public issues.

Security fixes target the latest source on the repository's default branch. Version 0.1.0 is prepared locally; there is no published release or backport commitment. No response-time commitment is asserted.

The local checks exercise hostile SVG/JSON rejection and offline workflows. They do not establish a complete security audit, cross-browser coverage or security of arbitrary edited exports. The optional Python photo experiment is separate research and is excluded from the offline release archive.
