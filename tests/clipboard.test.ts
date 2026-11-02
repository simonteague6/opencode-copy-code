import assert from "node:assert/strict";
import { test } from "node:test";
import { clipboardCommands, copyToClipboard, runClipboardCommand } from "../src/clipboard.js";

test("platform backends and Linux fallback order", () => {
  assert.equal(clipboardCommands("darwin")[0].command, "pbcopy");
  assert.deepEqual(clipboardCommands("win32"), [{ command: "clip", args: [], encoding: "utf16le" }]);
  assert.deepEqual(clipboardCommands("linux"), [
    { command: "wl-copy", args: [] },
    { command: "xclip", args: ["-selection", "clipboard"] },
    { command: "xsel", args: ["--clipboard", "--input"] },
  ]);
});

test("copies exact body and stops on first successful backend", async () => {
  const attempts: string[] = [];
  const body = "\t hi  \r\n\n$(do-not-execute)\n";
  await copyToClipboard(body, "linux", async ({ command }, actual) => {
    attempts.push(command);
    assert.equal(actual, body);
    if (command === "wl-copy") throw new Error("not installed");
  });
  assert.deepEqual(attempts, ["wl-copy", "xclip"]);
});

test("reports every Linux backend failure", async () => {
  await assert.rejects(copyToClipboard("", "linux", async ({ command }) => { throw new Error(`${command} failed`); }),
    /wl-copy: wl-copy failed\nxclip: xclip failed\nxsel: xsel failed/);
});

test("handles non-Error backend failures and unsupported platforms", async () => {
  await assert.rejects(copyToClipboard("", "darwin", async () => { throw "missing"; }), /pbcopy: missing/);
  await assert.rejects(copyToClipboard("", "freebsd"), /Unsupported clipboard platform/);
});

test("runner sends exact UTF-8 stdin, including Unicode, empty body and CRLF", async () => {
  for (const body of ["", "\n", "\tλ 🎸\r\n  \n$(exit 1)\n"]) {
    await runClipboardCommand({ command: process.execPath, args: ["-e", `
      const chunks = [];
      process.stdin.on('data', chunk => chunks.push(chunk));
      process.stdin.on('end', () => {
        const actual = Buffer.concat(chunks);
        if (!actual.equals(Buffer.from(${JSON.stringify(body)}, 'utf8'))) process.exit(1);
      });
    `] }, body);
  }
});

test("runner supports UTF-16LE input for Windows clip", async () => {
  const body = "λ 🎸\r\n";
  await runClipboardCommand({ command: process.execPath, encoding: "utf16le", args: ["-e", `
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      if (Buffer.concat(chunks).toString('utf16le') !== ${JSON.stringify(body)}) process.exit(1);
    });
  `] }, body);
});

test("runner rejects a nonzero exit and captures stderr", async () => {
  await assert.rejects(runClipboardCommand({ command: process.execPath, args: ["-e", "console.error('clipboard denied'); process.exit(9)"] }, ""), /clipboard denied/);
});

test("runner handles missing executables without unhandled stdin errors", async () => {
  await assert.rejects(runClipboardCommand({ command: "/nonexistent-copy-code-backend", args: [] }, "x".repeat(100_000)), /ENOENT/);
});
