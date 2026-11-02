import { spawn } from "node:child_process";
export function clipboardCommands(platform) {
  switch (platform) {
    case "darwin":
      return [{
        command: "pbcopy",
        args: []
      }];
    case "win32":
      return [{
        command: "clip",
        args: [],
        encoding: "utf16le"
      }];
    case "linux":
      return [{
        command: "wl-copy",
        args: []
      }, {
        command: "xclip",
        args: ["-selection", "clipboard"]
      }, {
        command: "xsel",
        args: ["--clipboard", "--input"]
      }];
    default:
      throw new Error(`Unsupported clipboard platform: ${platform}`);
  }
}
export const runClipboardCommand = (backend, body) => new Promise((resolve, reject) => {
  // No shell: code is data on stdin, never executable command text.
  const child = spawn(backend.command, backend.args, {
    stdio: ["pipe", "ignore", "pipe"],
    windowsHide: true
  });
  let stderr = "";
  let inputError;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill();
  }, 10_000);
  child.stderr.on("data", chunk => {
    stderr = (stderr + chunk.toString()).slice(-8192);
  });
  child.stdin.on("error", error => {
    inputError = error;
  });
  child.once("error", error => {
    clearTimeout(timer);
    reject(error);
  });
  child.once("close", (code, signal) => {
    clearTimeout(timer);
    if (timedOut) reject(new Error("Clipboard command timed out after 10 seconds"));else if (code !== 0) reject(new Error(stderr.trim() || `Exited with ${signal ? `signal ${signal}` : `code ${code}`}`));else if (inputError) reject(inputError);else resolve();
  });
  child.stdin.end(Buffer.from(body, backend.encoding ?? "utf8"));
});
export async function copyToClipboard(body, platform = process.platform, run = runClipboardCommand) {
  const errors = [];
  for (const backend of clipboardCommands(platform)) {
    try {
      await run(backend, body);
      return;
    } catch (error) {
      errors.push(`${backend.command}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join("\n"));
}
