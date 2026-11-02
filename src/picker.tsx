import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";
import { useTerminalDimensions } from "@opentui/solid";
import { usePlugin } from "@opencode/plugin/tui";
import type { InputRenderable } from "@opentui/core";
import type { CodeBlock } from "./blocks.js";
import { copyToClipboard } from "./clipboard.js";
import { codePreview, displayText, filterBlocks, moveSelection, visibleSlice } from "./selection.js";
import { pickerLayout, tableColumns } from "./layout.js";

export function CodePicker(props: { blocks: readonly CodeBlock[] }) {
  const context = usePlugin();
  const dimensions = useTerminalDimensions();
  const [query, setQuery] = createSignal("");
  const [selected, setSelected] = createSignal(0);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [contentWidth, setContentWidth] = createSignal(0);
  const columns = tableColumns(props.blocks);
  const layout = createMemo(() => pickerLayout(contentWidth(), dimensions().height));
  const theme = () => context.theme.surface("dialog");
  const matches = createMemo(() => filterBlocks(props.blocks, query()));
  const current = createMemo(() => matches()[selected()]);
  const slice = createMemo(() => visibleSlice(selected(), matches().length, layout().pageSize));
  let input: InputRenderable | undefined;
  let alive = true;
  onCleanup(() => { alive = false; });

  async function copy() {
    const block = current();
    if (!block || busy()) return;
    setBusy(true);
    setError("");
    try {
      await copyToClipboard(block.body);
      if (!alive) return;
      context.ui.dialog.clear();
      context.ui.toast.show({
        title: "Code copied",
        message: `${displayText(block.language)} · ${block.lineCount} ${block.lineCount === 1 ? "line" : "lines"}`,
        variant: "success",
      });
    } catch (cause) {
      if (!alive) return;
      const message = displayText(cause instanceof Error ? cause.message : String(cause));
      setError(message);
      context.ui.toast.show({ title: "Could not copy code", message, variant: "error" });
    } finally {
      if (alive) setBusy(false);
    }
  }

  context.keymap.layer(() => ({
    // The host owns the dialog input mode. This focused layer is disposed
    // with the picker and must remain reachable in that host-owned mode.
    mode: "global",
    target: () => input,
    priority: 100,
    commands: [
      { bind: "up", run: () => { if (!busy()) setSelected((value) => moveSelection(value, -1, matches().length)); } },
      { bind: "down", run: () => { if (!busy()) setSelected((value) => moveSelection(value, 1, matches().length)); } },
      { bind: "return", run: copy },
      { bind: "escape", run: () => context.ui.dialog.clear() },
    ],
  }));

  return (
    <box paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1} gap={1}>
      <box flexDirection="row" gap={2} height={1}>
        <text fg={theme().text.base} attributes={1}>Copy code</text>
        <text fg={theme().text.muted} flexGrow={1} wrapMode="none">{props.blocks.length} blocks · newest first</text>
        <text fg={theme().text.muted} onMouseUp={(event) => { if (event.button === 0) context.ui.dialog.clear(); }}>×</text>
      </box>
      <input
        ref={input}
        focused
        placeholder="Search language, code, or turn…"
        onInput={(value) => { setQuery(value); setSelected(0); setError(""); }}
      />
      <box
        onSizeChange={function () { setContentWidth(this.width); }}
        flexDirection={layout().sideBySide ? "row" : "column"}
        gap={1}
      >
        <box width={layout().sideBySide ? layout().listWidth : "100%"} flexShrink={0} overflow="hidden">
          <box flexDirection="row" height={1} gap={1} paddingLeft={1} paddingRight={1}>
            <text width={1}> </text>
            <text fg={theme().text.muted} width={columns.language} flexShrink={0}>Language</text>
            <text fg={theme().text.muted} width={columns.lines + 6} flexShrink={0}>Lines</text>
            <text fg={theme().text.muted} width={columns.turn + 5} flexShrink={0}>Turn</text>
          </box>
          <text height={1} wrapMode="none">{slice().start > 0 ? `↑ ${slice().start} more above` : " "}</text>
          <For each={matches().slice(slice().start, slice().end)}>
            {(block, index) => {
              const active = () => slice().start + index() === selected();
              const foreground = () => active() ? theme().text.action.primary.selected : theme().text.base;
              return (
                <box
                  flexDirection="row" height={1} gap={1} overflow="hidden"
                  paddingLeft={1} paddingRight={1}
                  backgroundColor={active() ? theme().background.action.primary.selected : undefined}
                  onMouseUp={(event) => { if (event.button === 0 && !busy()) setSelected(slice().start + index()); }}
                >
                  <text fg={foreground()} width={1} flexShrink={0}>{active() ? "›" : " "}</text>
                  <text fg={foreground()} width={columns.language} flexShrink={0} wrapMode="none" attributes={active() ? 1 : 0}>
                    {displayText(block.language)}
                  </text>
                  <text fg={foreground()} width={columns.lines + 6} flexShrink={0} wrapMode="none">{`${String(block.lineCount).padStart(columns.lines)} lines`}</text>
                  <text fg={foreground()} width={columns.turn + 5} flexShrink={0} wrapMode="none">{`turn ${String(block.turn).padStart(columns.turn)}`}</text>
                </box>
              );
            }}
          </For>
          <Show when={matches().length === 0}><text>No matching blocks.</text></Show>
          <text height={1} wrapMode="none">{slice().end < matches().length ? `↓ ${matches().length - slice().end} more below` : " "}</text>
        </box>
        <box
          flexGrow={1}
          minWidth={0}
          border={layout().sideBySide ? ["left"] : ["top"]}
          borderColor={theme().border.base}
          paddingLeft={layout().sideBySide ? 2 : 0}
          paddingTop={layout().sideBySide ? 0 : 1}
          overflow="hidden"
        >
          <Show when={current()} fallback={<text>Select a block to preview.</text>}>
            {(block) => (
              <box>
                <text fg={theme().text.muted} height={1} wrapMode="none">Preview · first {Math.min(5, block().lineCount)} of {block().lineCount} lines</text>
                <For each={codePreview(block())}>
                  {(line, index) => <text height={1} wrapMode="none">{`${index() + 1} │ ${line}`}</text>}
                </For>
                <Show when={block().lineCount === 0}><text>(empty block)</text></Show>
              </box>
            )}
          </Show>
        </box>
      </box>
      <Show when={error()}><text maxHeight={3}>{error()}</text></Show>
      <box flexDirection={layout().sideBySide ? "row" : "column-reverse"} gap={1}>
        <box width={layout().sideBySide ? layout().listWidth : "100%"} flexShrink={0} flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1}>
          <text><span style={{ fg: theme().text.base }}>↑↓</span><span style={{ fg: theme().text.muted }}> Move</span></text>
          <text onMouseUp={(event) => { if (event.button === 0) void copy(); }}>
            <span style={{ bg: theme().background.action.secondary.base, fg: theme().text.base }}> Enter </span>
            <span style={{ fg: current() && !busy() ? theme().text.base : theme().text.muted }}>{busy() ? " Copying…" : " Copy"}</span>
          </text>
          <text onMouseUp={(event) => { if (event.button === 0) context.ui.dialog.clear(); }}>
            <span style={{ bg: theme().background.action.secondary.base, fg: theme().text.base }}> Esc </span>
            <span style={{ fg: theme().text.muted }}> Cancel</span>
          </text>
        </box>
        <Show when={current()}>
          {(block) => <text paddingLeft={layout().sideBySide ? 3 : 0} fg={theme().text.muted} flexGrow={1}>
            {block().lineCount > 5 ? `${block().lineCount - 5} more ${block().lineCount === 6 ? "line" : "lines"} included when copying` : "Copies the entire block"}
          </text>}
        </Show>
      </box>
    </box>
  );
}
