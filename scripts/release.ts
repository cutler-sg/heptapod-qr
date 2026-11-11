import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { name, version } from "../package.json";
import { CODEC_VERSION, RENDER_VERSION, UPSTREAM_COMMIT } from "../src/model";

// A positive allowlist prevents private inputs, experiments and build caches from shipping.
const files = new Map<string, Uint8Array>();
const add = async (source: string, destination = source) => {
  assert(!files.has(destination), `Duplicate archive entry: ${destination}`);
  files.set(destination, await readFile(source));
};
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
assert.equal(name, "heptapod-qr");
assert.match(version, /^\d+\.\d+\.\d+$/);
execFileSync(process.execPath, ["run", "build"], { stdio: "inherit" });
await add("dist/index.html", "index.html");
for (const path of [
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "CHANGELOG.md",
  "SECURITY.md",
  "docs/ARTIST-CHECKLIST.md",
  "docs/COMPATIBILITY.md",
  "docs/ARCHITECTURE.md",
  "docs/UPSTREAM-AUDIT.md",
  "docs/TEST-RESULTS.md",
  "docs/RELEASING.md",
  "vendor/heptapod-ink/LICENSE",
  "vendor/heptapod-ink/PROVENANCE.md",
  "vendor/licenses/zod-MIT.txt",
  "examples/comparison.html",
  "examples/showcase.html",
  "examples/decorative-Michael.svg",
  "examples/decorative-project.json",
  "examples/who-is-like-god/variants/seed-46-source.svg",
  "examples/who-is-like-god/variants/seed-46-artist.svg",
])
  await add(path);
for (const family of ["Michael", "michael", "who-is-like-god", "there-is-no-linear-time"])
  for (const file of [
    "encoded-source-v1.svg",
    "artist-stencil.svg",
    "reversed.svg",
    "MIRRORED-TRANSFER.svg",
    "project.json",
    "manifest.json",
    "print-at-100-percent.html",
    "preview-600dpi.png",
  ])
    await add(`examples/${family}/${file}`);

files.set(
  "READ-ME-FIRST.txt",
  Buffer.from(`Heptapod QR ${version}
Make your own alien QR code.

Unzip this entire folder, then open index.html in a modern desktop browser.
No installation, account, server or internet connection is required to use it.
The app keeps your text in memory. Save project before closing or reloading.
Open examples/showcase.html for all 49 studies and source/artist comparisons.

"QR" is an analogy. Ordinary QR scanners do not read these designs. Source
SVGs use the MIT heptapod-ink restored v1 geometry codec. Artist derivatives,
decoration and tattoo photographs have no supported decoder. This is original
Arrival-inspired fan work, not an authentic Heptapod B translation.

Select exact spelling, explicitly choose a meaning phrase, or use non-reversible
decoration. Case and whitespace are preserved. NFC normalization is opt-in.
Select a seed, compare source and artist views, and save your project JSON.
Use Decode a preserved source SVG under How the marks work for source imports.

Take the source SVG, artist SVG, project and docs/ARTIST-CHECKLIST.md to your
artist. Open a print-at-100-percent.html sheet and print at 100% / Actual size,
disable Fit to page and headers/footers, and measure its 50 mm scale bar.
Your browser can save the print sheet as PDF. Previews are not print templates.
Geometry warnings require review; line widths do not guarantee tattoo healing.

Examples intentionally contain Michael and the documented phrases. Your own
projects/manifests/comparisons contain your text. Reversible SVG is not encryption.
The private tattoo photo and experimental Python reader are not in this archive.

See THIRD_PARTY_NOTICES.md and vendor/ for complete bundled runtime licenses.
RELEASE.json records versions; SHA256SUMS covers every other archive file.
This local artifact does not establish a published release or hosted support route.
`),
);
const app = files.get("index.html");
assert(app);
files.set(
  "RELEASE.json",
  Buffer.from(
    `${JSON.stringify(
      {
        name,
        version,
        codecVersion: CODEC_VERSION,
        renderVersion: RENDER_VERSION,
        upstreamCommit: UPSTREAM_COMMIT,
        appSha256: hash(app),
        archivePolicy:
          "Explicit allowlist; fixed timestamps and permissions; no private photo or research traces",
      },
      null,
      2,
    )}\n`,
  ),
);
files.set(
  "SHA256SUMS",
  Buffer.from(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([path, data]) => `${hash(data)}  ${path}\n`)
      .join(""),
  ),
);

const stage = await mkdtemp(join(tmpdir(), "heptapod-qr-release-"));
const prefix = `${name}-${version}`;
const epoch = new Date("2000-01-01T00:00:00Z");
const entries = [...files.keys()].sort();
for (const path of entries) {
  const target = join(stage, prefix, path);
  await mkdir(dirname(target), { recursive: true });
  const data = files.get(path);
  assert(data);
  await writeFile(target, data);
  await chmod(target, 0o644);
  await utimes(target, epoch, epoch);
}
const archive = join(stage, `${prefix}.zip`);
// Info-ZIP -X removes host-specific extra fields; explicit sorted entries exclude directories.
execFileSync("zip", ["-X", "-q", archive, "-@"], {
  cwd: stage,
  env: { ...process.env, TZ: "UTC" },
  input: `${entries.map((path) => `${prefix}/${path}`).join("\n")}\n`,
});
await mkdir("release", { recursive: true });
const bytes = await readFile(archive);
await writeFile(`release/${prefix}.zip`, bytes);
await writeFile("release/SHA256SUMS", `${hash(bytes)}  ${prefix}.zip\n`);
console.log(
  `Prepared release/${prefix}.zip (${files.size} files, ${bytes.length} bytes). Nothing published.`,
);
