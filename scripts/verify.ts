import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = (script: string) =>
  execFileSync(process.execPath, ["run", script], { stdio: "inherit" });

for (const script of ["typecheck", "check", "test", "build"]) run(script);
const first = readFileSync("dist/index.html");
run("build");
assert(first.equals(readFileSync("dist/index.html")), "Standalone build is not deterministic");
console.log("PASS byte-identical standalone builds");
run("showcase");
for (const script of ["test:browser", "test:showcase"]) run(script);
