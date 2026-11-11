import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { version } from "../package.json";

const run = (args: string[]) => execFileSync(process.execPath, args, { stdio: "inherit" });
const hash = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
const prefix = `heptapod-qr-${version}`;
const archive = resolve(`release/${prefix}.zip`);
run(["run", "release"]);
const first = await readFile(archive);
run(["run", "release"]);
assert(first.equals(await readFile(archive)), "Repeated release ZIPs differ");
assert.equal(await readFile("release/SHA256SUMS", "utf8"), `${hash(first)}  ${prefix}.zip\n`);
const entries = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n");
assert.equal(new Set(entries).size, entries.length);
for (const entry of entries) {
  assert(entry.startsWith(`${prefix}/`) && !entry.split("/").includes(".."));
  assert(!/(^|\/)(\.git|\.env[^/]*|secrets|node_modules|experiments|evidence)(\/|$)/.test(entry));
  assert(!/\.(jpe?g|npz|npy|py)$/i.test(entry));
}
const extracted = await mkdtemp(join(tmpdir(), "heptapod-qr-unpacked-"));
execFileSync("unzip", ["-q", archive, "-d", extracted]);
const root = join(extracted, prefix);
const checksums = (await readFile(join(root, "SHA256SUMS"), "utf8")).trim().split("\n");
assert.equal(checksums.length, entries.length - 1);
for (const line of checksums) {
  const match = /^([a-f0-9]{64}) {2}(.+)$/.exec(line);
  assert(match);
  assert(entries.includes(`${prefix}/${match[2]}`));
  assert.equal(hash(await readFile(join(root, match[2]))), match[1], match[2]);
}
const release = JSON.parse(await readFile(join(root, "RELEASE.json"), "utf8"));
assert.equal(release.version, version);
assert.equal(release.appSha256, hash(await readFile(join(root, "index.html"))));
for (const license of ["LICENSE", "vendor/heptapod-ink/LICENSE", "vendor/licenses/zod-MIT.txt"])
  assert(entries.includes(`${prefix}/${license}`));
run(["scripts/browser-test.ts", join(root, "index.html")]);
run(["scripts/check-showcase.ts", join(root, "examples/showcase.html")]);
console.log(
  `PASS deterministic ZIP, ${entries.length} safe entries, all checksums/notices, unpacked app and gallery offline`,
);
