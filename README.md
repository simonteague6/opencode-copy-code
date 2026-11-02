# opencode-copy-code

Preview and copy fenced code blocks from assistant replies in the OpenCode V2 terminal UI.

Run **`/copy-code`** or **`/cc`**, choose a block, and press Enter. The picker lists blocks newest first and shows the selected block’s **first five lines** before you copy it.

## Load locally

Targets **OpenCode 2.2.5**, using its V2 TUI plugin API and OpenTUI 0.8.x. This is a TUI-only plugin, not a GUI or server plugin.

From this directory:

```sh
npm install
OPENCODE_CLI_CONFIG_CONTENT="{\"plugins\":[\"$PWD\"]}" opencode
```

This launches OpenCode with the plugin without changing your saved configuration. The inline `plugins` array replaces the configured CLI plugin array for that invocation.

To keep it enabled, append this absolute directory path to the existing `plugins` array in `~/.config/opencode/cli.json`:

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "plugins": ["/Users/simonteague/projects/opencode-copy-code"]
}
```

Preserve your other settings and plugin entries. OpenCode watches CLI configuration; use `/reload` if needed. No global configuration is modified by this project’s setup or tests.

## Use

1. Open a conversation with a completed assistant reply containing fenced code.
2. Run `/copy-code` or `/cc` (also available as **Copy code block** in the command palette).
3. Type to filter by language, first nonblank code line, or user-turn number.
4. Use **↑/↓** to select, **Enter** to copy, or **Escape** to cancel. Backspace edits the filter.

The centered picker shows up to eight entries, with fewer in short terminals. Language, line count, and turn number use aligned columns; the selected row uses your OpenCode theme’s selection colors. On wide terminals the list and preview sit side by side with a vertical divider; in narrow terminals the preview stacks below the list. The layout responds to resizing while open. The preview retains leading blank lines and shows up to five lines; long lines are clipped to the available width. A footer note indicates additional lines included when copying. The **entire block** is copied, not just the preview. You can also click a row to select it or click the styled Copy and Cancel controls.

Only completed assistant **text** is scanned. User text, reasoning, tool results, images, and incomplete streaming messages are ignored. Both backtick and tilde fences are supported; unmatched opening fences are ignored. Full history is paginated rather than limited to the TUI’s cached messages.

Copying excludes Markdown fences and preserves the body’s whitespace and line endings, including the newline before the closing fence. Empty and whitespace-only blocks remain selectable. Display-only sanitization prevents terminal control characters from being interpreted; it never modifies the copied body.

On failure, the picker remains open with an error and a notification. Press Enter to retry or Escape to cancel. A successful copy closes the picker and reports its language and line count.

## Clipboard backends

Clipboard commands execute **locally**, including when connected to a remote OpenCode server. Code is sent through standard input, never executed by a shell.

| Platform | Backend |
| --- | --- |
| macOS | `pbcopy` |
| Windows | `clip` (UTF-16LE input) |
| Linux | `wl-copy`, then `xclip -selection clipboard`, then `xsel --clipboard --input` |

On Linux, install a backend appropriate to your desktop session. Failures from all attempted backends are collected. Each command has a ten-second timeout. Unsupported platforms report an error.

## Development

```sh
npm run check
npm pack --dry-run
```

The unit suite covers fence parsing, exact body preservation, history pagination, completed-message scanning, filtering, navigation bounds, previews, and clipboard subprocess handling. It never writes to your system clipboard.

An optional macOS TUI integration test uses the installed `opencode`, Python 3, synthetic history, and a fake `pbcopy`:

```sh
python3 tests/tui-smoke.py
```

It checks live rendering, aligned columns, side-by-side and stacked layouts, terminal resizing, filtering, keyboard navigation, failed copy, retry, exact copied contents, slash-command registration, and cancellation. It makes no model requests and changes no saved CLI configuration. Live Windows and Linux clipboard integration has not been verified.

OpenTUI’s package declares Node ≥26.4 or Bun ≥1.3.14; OpenCode supplies its own TUI runtime. `npm install` may emit an engine warning on older Node versions. The installed OpenCode SDK dependency tree also currently reports upstream moderate-severity npm audit findings; they are not fixed by this plugin.

```text
src/tui.tsx        Slash-command registration and notifications
src/picker.tsx     Interactive dialog and selected-code preview
src/blocks.ts      Exact fenced-block parsing and history scanning
src/history.ts     Paginated OpenCode message retrieval
src/selection.ts   Filtering, navigation, and display-only formatting
src/layout.ts      Responsive layout and stable metadata column widths
src/clipboard.ts   Platform backends and stdin-based subprocess runner
tests/            Unit tests and optional live TUI fixture
```

Reference: [OpenCode V2 TUI plugins](https://opencode.ai/v2/docs/build/plugins/cli).
