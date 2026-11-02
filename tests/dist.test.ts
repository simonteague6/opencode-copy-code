import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("dist/ matches a fresh compile of src/", () => {
  const fresh = mkdtempSync(join(tmpdir(), "copy-code-dist-"));
  try {
    execFileSync(process.execPath, ["scripts/compile.mjs", fresh], { stdio: "pipe" });
    const committed = readdirSync("dist").sort();
    assert.deepEqual(committed, readdirSync(fresh).sort(), "run `npm run compile` and commit dist/");
    for (const file of committed) {
      assert.equal(
        readFileSync(join("dist", file), "utf8"),
        readFileSync(join(fresh, file), "utf8"),
        `dist/${file} is stale; run \`npm run compile\` and commit dist/`,
      );
    }
  } finally {
    rmSync(fresh, { recursive: true, force: true });
  }
});
