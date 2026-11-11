import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { version } from "../package.json";

const [html, css, coreLicense, zodLicense, compiled] = await Promise.all([
  readFile("src/index.html", "utf8"),
  readFile("src/style.css", "utf8"),
  readFile("vendor/heptapod-ink/LICENSE", "utf8"),
  readFile("vendor/licenses/zod-MIT.txt", "utf8"),
  build({
    entryPoints: ["src/app.ts"],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2022",
    minify: true,
    legalComments: "inline",
  }),
]);
const js = compiled.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const hash = createHash("sha256").update(js).digest("base64");
const csp = `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
await mkdir("dist", { recursive: true });
await writeFile(
  "dist/index.html",
  html
    .replace("<!-- VERSION -->", version)
    .replace("<!-- CSP -->", `<meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace("<!-- STYLE -->", `<style>${css}</style>`)
    .replace(
      "<!-- SCRIPT -->",
      () =>
        `<!-- Runtime licenses: heptapod-ink / extras\n${coreLicense}\nZod\n${zodLicense}\n--><script>${js}</script>`,
    ),
);
console.log("Built dist/index.html — standalone, offline, no server required.");
