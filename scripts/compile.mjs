// Compiles src/ to dist/ so `opencode plugin add` installs run without a build step.
// OpenCode skips its Solid transform for files under node_modules, so the output is plain JS.
// Usage: node scripts/compile.mjs [outDir]
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformFileSync } from "@babel/core";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const srcDir = join(root, "src");
const outDir = resolve(process.argv[2] ?? join(root, "dist"));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(srcDir).sort()) {
  const ext = extname(file);
  if (ext !== ".ts" && ext !== ".tsx") continue;
  const result = transformFileSync(join(srcDir, file), {
    babelrc: false,
    configFile: false,
    presets: [
      ["babel-preset-solid", { moduleName: "@opentui/solid", generate: "universal" }],
      ["@babel/preset-typescript", { allowDeclareFields: true }],
    ],
  });
  writeFileSync(join(outDir, `${basename(file, ext)}.js`), `${result.code}\n`);
}
