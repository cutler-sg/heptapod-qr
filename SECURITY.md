# Security

Heptapod QR runs locally without accounts, telemetry, network APIs or persistent browser storage. Inputs remain in memory until explicitly exported. Imported SVG is parsed as a strict, bounded geometry subset and is never inserted into the document; project JSON is validated and reconstructed. See [architecture](docs/ARCHITECTURE.md) for the boundaries and [verification results](docs/TEST-RESULTS.md) for their tested scope.

Encoded geometry is not encryption. Source SVGs can reveal their text through the compatible decoder even without metadata. Project files, manifests and comparison sheets contain plaintext. Treat those files as sensitive when their input is sensitive. CRC-16 detects ordinary corruption; it does not authenticate artwork or protect against tampering.

## Reporting readiness

This release is prepared locally. There is currently no public repository or verified private vulnerability-reporting route, and this document does not claim that a reporting service is available. Do not put sensitive vulnerability details into public issues.

**Publication gate:** before publishing a repository or release, enable GitHub private vulnerability reporting and verify that its reporting route is accessible. Then update this document with the actual verified route and a realistic supported-version policy. No security contact address, response commitment or support window is asserted here.

The local checks exercise hostile SVG/JSON rejection and offline workflows. They do not establish a complete security audit, cross-browser coverage or security of arbitrary edited exports. The optional Python photo experiment is separate research and is excluded from the offline release archive.
