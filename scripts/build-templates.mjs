// Packs every folder in templates/ into an uploadable ZIP in templates/dist/.
// Each folder holds template.json plus any image files it names.
//   npm run templates:build
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { zipSync } from "fflate";

const root = join(process.cwd(), "templates");
const out = join(root, "dist");
mkdirSync(out, { recursive: true });

for (const name of readdirSync(root)) {
  const dir = join(root, name);
  if (name === "dist" || !statSync(dir).isDirectory()) continue;
  const files = {};
  for (const file of readdirSync(dir)) {
    files[file] = new Uint8Array(readFileSync(join(dir, file)));
  }
  if (!files["template.json"]) {
    console.warn(`skipped ${name}: no template.json`);
    continue;
  }
  JSON.parse(Buffer.from(files["template.json"]).toString("utf8")); // fail loudly on broken JSON
  writeFileSync(join(out, `${name}.zip`), zipSync(files, { level: 9 }));
  console.log(`templates/dist/${name}.zip`);
}
