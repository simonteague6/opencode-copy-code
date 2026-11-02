# opencode-copy-code

Preview and copy fenced code blocks from assistant replies in the OpenCode V2 terminal UI.

Run `/copy-code` (alias `/cc`), pick a block, and press Enter. The picker lists blocks newest first and previews the first five lines of the selected one. Only the exact block body is copied, without the Markdown fences.

> [!NOTE]
> This is a TUI plugin for OpenCode V2 (developed against 2.2.5).

## Features

- Lists fenced code blocks (backtick and tilde fences) from completed assistant messages, newest first
- Shows a five-line preview: side by side with a divider on wide terminals, stacked below the list on narrow ones, and it follows terminal resizes
- Filters by language, first nonblank code line, or user-turn number
- Works with the keyboard (Up/Down, Enter, Esc) and the mouse (click a row, Copy, or Cancel)
- Copies the body byte for byte, preserving whitespace and line endings
- Keeps the picker open with an error if the clipboard command fails, so you can retry
- Reads the full conversation history, not only the messages cached in the TUI
- No syntax highlighting

## Install

```sh
opencode plugin add github:simonteague6/opencode-copy-code
```

This installs the plugin from GitHub and adds it to your global OpenCode configuration. OpenCode picks it up from its watched configuration; run `/reload` if the command does not appear.

To pin a release, add a tag:

```sh
opencode plugin add github:simonteague6/opencode-copy-code#v0.2.0
```

Manage the plugin with:

```sh
opencode plugin list      # show installed plugins
opencode plugin check     # check package plugins for updates
opencode plugin update    # update package plugins
opencode plugin remove    # remove a plugin from the global configuration
```

## Usage

1. Open a conversation that has a completed assistant reply containing fenced code.
2. Run `/copy-code` or `/cc`. The command palette entry is **Copy code block**.
3. Type to filter by language, first nonblank code line, or turn number. Backspace edits the filter.
4. Press **Up/Down** to select, **Enter** to copy, or **Esc** to cancel. Clicking a row selects it; clicking **Copy** or **Cancel** works like the keys.

A few details:

- Only completed assistant text is scanned. User text, reasoning, tool results, images, and messages that are still streaming are ignored. Unmatched opening fences are ignored.
- The preview keeps leading blank lines and clips long lines to the available width. When a block is longer than five lines, a footer note says how many more lines are included when copying.
- Empty and whitespace-only blocks can still be selected.
- Terminal control characters are replaced in the display only. The copied text is never altered.
- On success the picker closes and a notification shows the language and line count. On failure the picker stays open with the error, and Enter retries.

## Clipboard backends

Clipboard commands run locally, even when OpenCode is connected to a remote server. The code goes to the command through standard input and is never run by a shell. Each command has a ten-second timeout.

| Platform | Backend |
| --- | --- |
| macOS | `pbcopy` |
| Windows | `clip` (UTF-16LE input) |
| Linux | `wl-copy`, then `xclip -selection clipboard`, then `xsel --clipboard --input` |

On Linux the first backend that succeeds wins. If all fail, the picker shows each backend's error. Install one that matches your desktop session. Other platforms report an unsupported-platform error.

> [!WARNING]
> Only the macOS backend has been tested against a live TUI. The Windows and Linux backends are covered by unit tests with a mocked subprocess runner but have not been tried on real systems.

## Development

You need Node.js and npm.

```sh
git clone https://github.com/simonteague6/opencode-copy-code.git
cd opencode-copy-code
npm install
npm run check
```

`npm run check` runs the TypeScript typecheck and the unit tests. The unit tests cover fence parsing, exact body preservation, history pagination, completed-message scanning, filtering, navigation, previews, layout, clipboard subprocess handling, and that `dist/` matches `src/`. They never touch your system clipboard.

The package exports `dist/tui.js`, the compiled output of `src/`. Installs from GitHub do not run a build, so `dist/` is committed. After changing `src/`, run `npm run compile` and commit the updated `dist/`.

To load a local clone, add its absolute path to the `plugins` array in `~/.config/opencode/cli.json`, keeping your other settings and plugin entries:

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "plugins": ["/path/to/opencode-copy-code"]
}
```

To try a clone for a single run without changing your saved configuration, set the config inline. This replaces the configured `plugins` array for that run only:

```sh
OPENCODE_CLI_CONFIG_CONTENT="{\"plugins\":[\"$PWD\"]}" opencode
```

On macOS, an optional live test drives the installed `opencode` in a pseudo-terminal with synthetic history and a fake `pbcopy`. It loads the plugin source, not `dist/`:

```sh
python3 tests/tui-smoke.py
```

It needs Python 3, makes no model requests, uses an inline CLI config, and leaves your saved configuration alone.

```text
src/tui.tsx          Slash command and palette registration, notifications
src/picker.tsx       Picker dialog and code preview
src/blocks.ts        Fenced-block parsing and history scanning
src/history.ts       Paginated message retrieval
src/selection.ts     Filtering, navigation, and display-only sanitizing
src/layout.ts        Responsive layout and column widths
src/clipboard.ts     Platform backends and stdin-based subprocess runner
dist/                Compiled plugin output (generated by npm run compile)
scripts/compile.mjs  Compiles src/ to dist/
tests/               Unit tests and the live TUI smoke test
```

The plugin follows the [OpenCode V2 TUI plugin API](https://opencode.ai/v2/docs/build/plugins/cli).
