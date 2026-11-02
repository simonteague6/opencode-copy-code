import { effect as _$effect } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";
import { useTerminalDimensions } from "@opentui/solid";
import { usePlugin } from "@opencode/plugin/tui";
import { copyToClipboard } from "./clipboard.js";
import { codePreview, displayText, filterBlocks, moveSelection, visibleSlice } from "./selection.js";
import { pickerLayout, tableColumns } from "./layout.js";
export function CodePicker(props) {
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
  let input;
  let alive = true;
  onCleanup(() => {
    alive = false;
  });
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
        variant: "success"
      });
    } catch (cause) {
      if (!alive) return;
      const message = displayText(cause instanceof Error ? cause.message : String(cause));
      setError(message);
      context.ui.toast.show({
        title: "Could not copy code",
        message,
        variant: "error"
      });
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
    commands: [{
      bind: "up",
      run: () => {
        if (!busy()) setSelected(value => moveSelection(value, -1, matches().length));
      }
    }, {
      bind: "down",
      run: () => {
        if (!busy()) setSelected(value => moveSelection(value, 1, matches().length));
      }
    }, {
      bind: "return",
      run: copy
    }, {
      bind: "escape",
      run: () => context.ui.dialog.clear()
    }]
  }));
  return (() => {
    var _el$ = _$createElement("box"),
      _el$2 = _$createElement("box"),
      _el$3 = _$createElement("text"),
      _el$5 = _$createElement("text"),
      _el$6 = _$createTextNode(` blocks · newest first`),
      _el$7 = _$createElement("text"),
      _el$9 = _$createElement("input"),
      _el$0 = _$createElement("box"),
      _el$1 = _$createElement("box"),
      _el$10 = _$createElement("box"),
      _el$11 = _$createElement("text"),
      _el$13 = _$createElement("text"),
      _el$15 = _$createElement("text"),
      _el$17 = _$createElement("text"),
      _el$19 = _$createElement("text"),
      _el$22 = _$createElement("text"),
      _el$23 = _$createElement("box"),
      _el$25 = _$createElement("box"),
      _el$26 = _$createElement("box"),
      _el$27 = _$createElement("text"),
      _el$28 = _$createElement("span"),
      _el$30 = _$createElement("span"),
      _el$32 = _$createElement("text"),
      _el$33 = _$createElement("span"),
      _el$35 = _$createElement("span"),
      _el$36 = _$createElement("text"),
      _el$37 = _$createElement("span"),
      _el$39 = _$createElement("span");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$9);
    _$insertNode(_el$, _el$0);
    _$insertNode(_el$, _el$25);
    _$setProp(_el$, "paddingLeft", 2);
    _$setProp(_el$, "paddingRight", 2);
    _$setProp(_el$, "paddingTop", 1);
    _$setProp(_el$, "paddingBottom", 1);
    _$setProp(_el$, "gap", 1);
    _$insertNode(_el$2, _el$3);
    _$insertNode(_el$2, _el$5);
    _$insertNode(_el$2, _el$7);
    _$setProp(_el$2, "flexDirection", "row");
    _$setProp(_el$2, "gap", 2);
    _$setProp(_el$2, "height", 1);
    _$insertNode(_el$3, _$createTextNode(`Copy code`));
    _$setProp(_el$3, "attributes", 1);
    _$insertNode(_el$5, _el$6);
    _$setProp(_el$5, "flexGrow", 1);
    _$setProp(_el$5, "wrapMode", "none");
    _$insert(_el$5, () => props.blocks.length, _el$6);
    _$insertNode(_el$7, _$createTextNode(`×`));
    _$setProp(_el$7, "onMouseUp", event => {
      if (event.button === 0) context.ui.dialog.clear();
    });
    var _ref$ = input;
    typeof _ref$ === "function" ? _$use(_ref$, _el$9) : input = _el$9;
    _$setProp(_el$9, "focused", true);
    _$setProp(_el$9, "placeholder", "Search language, code, or turn…");
    _$setProp(_el$9, "onInput", value => {
      setQuery(value);
      setSelected(0);
      setError("");
    });
    _$insertNode(_el$0, _el$1);
    _$insertNode(_el$0, _el$23);
    _$setProp(_el$0, "onSizeChange", function () {
      setContentWidth(this.width);
    });
    _$setProp(_el$0, "gap", 1);
    _$insertNode(_el$1, _el$10);
    _$insertNode(_el$1, _el$19);
    _$insertNode(_el$1, _el$22);
    _$setProp(_el$1, "flexShrink", 0);
    _$setProp(_el$1, "overflow", "hidden");
    _$insertNode(_el$10, _el$11);
    _$insertNode(_el$10, _el$13);
    _$insertNode(_el$10, _el$15);
    _$insertNode(_el$10, _el$17);
    _$setProp(_el$10, "flexDirection", "row");
    _$setProp(_el$10, "height", 1);
    _$setProp(_el$10, "gap", 1);
    _$setProp(_el$10, "paddingLeft", 1);
    _$setProp(_el$10, "paddingRight", 1);
    _$insertNode(_el$11, _$createTextNode(` `));
    _$setProp(_el$11, "width", 1);
    _$insertNode(_el$13, _$createTextNode(`Language`));
    _$setProp(_el$13, "flexShrink", 0);
    _$insertNode(_el$15, _$createTextNode(`Lines`));
    _$setProp(_el$15, "flexShrink", 0);
    _$insertNode(_el$17, _$createTextNode(`Turn`));
    _$setProp(_el$17, "flexShrink", 0);
    _$setProp(_el$19, "height", 1);
    _$setProp(_el$19, "wrapMode", "none");
    _$insert(_el$19, (() => {
      var _c$ = _$memo(() => slice().start > 0);
      return () => _c$() ? `↑ ${slice().start} more above` : " ";
    })());
    _$insert(_el$1, _$createComponent(For, {
      get each() {
        return matches().slice(slice().start, slice().end);
      },
      children: (block, index) => {
        const active = () => slice().start + index() === selected();
        const foreground = () => active() ? theme().text.action.primary.selected : theme().text.base;
        return (() => {
          var _el$41 = _$createElement("box"),
            _el$42 = _$createElement("text"),
            _el$43 = _$createElement("text"),
            _el$44 = _$createElement("text"),
            _el$45 = _$createElement("text");
          _$insertNode(_el$41, _el$42);
          _$insertNode(_el$41, _el$43);
          _$insertNode(_el$41, _el$44);
          _$insertNode(_el$41, _el$45);
          _$setProp(_el$41, "flexDirection", "row");
          _$setProp(_el$41, "height", 1);
          _$setProp(_el$41, "gap", 1);
          _$setProp(_el$41, "overflow", "hidden");
          _$setProp(_el$41, "paddingLeft", 1);
          _$setProp(_el$41, "paddingRight", 1);
          _$setProp(_el$41, "onMouseUp", event => {
            if (event.button === 0 && !busy()) setSelected(slice().start + index());
          });
          _$setProp(_el$42, "width", 1);
          _$setProp(_el$42, "flexShrink", 0);
          _$insert(_el$42, () => active() ? "›" : " ");
          _$setProp(_el$43, "flexShrink", 0);
          _$setProp(_el$43, "wrapMode", "none");
          _$insert(_el$43, () => displayText(block.language));
          _$setProp(_el$44, "flexShrink", 0);
          _$setProp(_el$44, "wrapMode", "none");
          _$insert(_el$44, () => `${String(block.lineCount).padStart(columns.lines)} lines`);
          _$setProp(_el$45, "flexShrink", 0);
          _$setProp(_el$45, "wrapMode", "none");
          _$insert(_el$45, () => `turn ${String(block.turn).padStart(columns.turn)}`);
          _$effect(_p$ => {
            var _v$22 = active() ? theme().background.action.primary.selected : undefined,
              _v$23 = foreground(),
              _v$24 = foreground(),
              _v$25 = columns.language,
              _v$26 = active() ? 1 : 0,
              _v$27 = foreground(),
              _v$28 = columns.lines + 6,
              _v$29 = foreground(),
              _v$30 = columns.turn + 5;
            _v$22 !== _p$.e && (_p$.e = _$setProp(_el$41, "backgroundColor", _v$22, _p$.e));
            _v$23 !== _p$.t && (_p$.t = _$setProp(_el$42, "fg", _v$23, _p$.t));
            _v$24 !== _p$.a && (_p$.a = _$setProp(_el$43, "fg", _v$24, _p$.a));
            _v$25 !== _p$.o && (_p$.o = _$setProp(_el$43, "width", _v$25, _p$.o));
            _v$26 !== _p$.i && (_p$.i = _$setProp(_el$43, "attributes", _v$26, _p$.i));
            _v$27 !== _p$.n && (_p$.n = _$setProp(_el$44, "fg", _v$27, _p$.n));
            _v$28 !== _p$.s && (_p$.s = _$setProp(_el$44, "width", _v$28, _p$.s));
            _v$29 !== _p$.h && (_p$.h = _$setProp(_el$45, "fg", _v$29, _p$.h));
            _v$30 !== _p$.r && (_p$.r = _$setProp(_el$45, "width", _v$30, _p$.r));
            return _p$;
          }, {
            e: undefined,
            t: undefined,
            a: undefined,
            o: undefined,
            i: undefined,
            n: undefined,
            s: undefined,
            h: undefined,
            r: undefined
          });
          return _el$41;
        })();
      }
    }), _el$22);
    _$insert(_el$1, _$createComponent(Show, {
      get when() {
        return matches().length === 0;
      },
      get children() {
        var _el$20 = _$createElement("text");
        _$insertNode(_el$20, _$createTextNode(`No matching blocks.`));
        return _el$20;
      }
    }), _el$22);
    _$setProp(_el$22, "height", 1);
    _$setProp(_el$22, "wrapMode", "none");
    _$insert(_el$22, (() => {
      var _c$2 = _$memo(() => slice().end < matches().length);
      return () => _c$2() ? `↓ ${matches().length - slice().end} more below` : " ";
    })());
    _$setProp(_el$23, "flexGrow", 1);
    _$setProp(_el$23, "minWidth", 0);
    _$setProp(_el$23, "overflow", "hidden");
    _$insert(_el$23, _$createComponent(Show, {
      get when() {
        return current();
      },
      get fallback() {
        return (() => {
          var _el$46 = _$createElement("text");
          _$insertNode(_el$46, _$createTextNode(`Select a block to preview.`));
          return _el$46;
        })();
      },
      children: block => (() => {
        var _el$48 = _$createElement("box"),
          _el$49 = _$createElement("text"),
          _el$50 = _$createTextNode(`Preview · first `),
          _el$51 = _$createTextNode(` of `),
          _el$52 = _$createTextNode(` lines`);
        _$insertNode(_el$48, _el$49);
        _$insertNode(_el$49, _el$50);
        _$insertNode(_el$49, _el$51);
        _$insertNode(_el$49, _el$52);
        _$setProp(_el$49, "height", 1);
        _$setProp(_el$49, "wrapMode", "none");
        _$insert(_el$49, () => Math.min(5, block().lineCount), _el$51);
        _$insert(_el$49, () => block().lineCount, _el$52);
        _$insert(_el$48, _$createComponent(For, {
          get each() {
            return codePreview(block());
          },
          children: (line, index) => (() => {
            var _el$55 = _$createElement("text");
            _$setProp(_el$55, "height", 1);
            _$setProp(_el$55, "wrapMode", "none");
            _$insert(_el$55, () => `${index() + 1} │ ${line}`);
            return _el$55;
          })()
        }), null);
        _$insert(_el$48, _$createComponent(Show, {
          get when() {
            return block().lineCount === 0;
          },
          get children() {
            var _el$53 = _$createElement("text");
            _$insertNode(_el$53, _$createTextNode(`(empty block)`));
            return _el$53;
          }
        }), null);
        _$effect(_$p => _$setProp(_el$49, "fg", theme().text.muted, _$p));
        return _el$48;
      })()
    }));
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return error();
      },
      get children() {
        var _el$24 = _$createElement("text");
        _$setProp(_el$24, "maxHeight", 3);
        _$insert(_el$24, error);
        return _el$24;
      }
    }), _el$25);
    _$insertNode(_el$25, _el$26);
    _$setProp(_el$25, "gap", 1);
    _$insertNode(_el$26, _el$27);
    _$insertNode(_el$26, _el$32);
    _$insertNode(_el$26, _el$36);
    _$setProp(_el$26, "flexShrink", 0);
    _$setProp(_el$26, "flexDirection", "row");
    _$setProp(_el$26, "flexWrap", "wrap");
    _$setProp(_el$26, "columnGap", 2);
    _$setProp(_el$26, "rowGap", 1);
    _$insertNode(_el$27, _el$28);
    _$insertNode(_el$27, _el$30);
    _$insertNode(_el$28, _$createTextNode(`↑↓`));
    _$insertNode(_el$30, _$createTextNode(` Move`));
    _$insertNode(_el$32, _el$33);
    _$insertNode(_el$32, _el$35);
    _$setProp(_el$32, "onMouseUp", event => {
      if (event.button === 0) void copy();
    });
    _$insertNode(_el$33, _$createTextNode(` Enter `));
    _$insert(_el$35, () => busy() ? " Copying…" : " Copy");
    _$insertNode(_el$36, _el$37);
    _$insertNode(_el$36, _el$39);
    _$setProp(_el$36, "onMouseUp", event => {
      if (event.button === 0) context.ui.dialog.clear();
    });
    _$insertNode(_el$37, _$createTextNode(` Esc `));
    _$insertNode(_el$39, _$createTextNode(` Cancel`));
    _$insert(_el$25, _$createComponent(Show, {
      get when() {
        return current();
      },
      children: block => (() => {
        var _el$56 = _$createElement("text");
        _$setProp(_el$56, "flexGrow", 1);
        _$insert(_el$56, (() => {
          var _c$3 = _$memo(() => block().lineCount > 5);
          return () => _c$3() ? `${block().lineCount - 5} more ${block().lineCount === 6 ? "line" : "lines"} included when copying` : "Copies the entire block";
        })());
        _$effect(_p$ => {
          var _v$31 = layout().sideBySide ? 3 : 0,
            _v$32 = theme().text.muted;
          _v$31 !== _p$.e && (_p$.e = _$setProp(_el$56, "paddingLeft", _v$31, _p$.e));
          _v$32 !== _p$.t && (_p$.t = _$setProp(_el$56, "fg", _v$32, _p$.t));
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$56;
      })()
    }), null);
    _$effect(_p$ => {
      var _v$ = theme().text.base,
        _v$2 = theme().text.muted,
        _v$3 = theme().text.muted,
        _v$4 = layout().sideBySide ? "row" : "column",
        _v$5 = layout().sideBySide ? layout().listWidth : "100%",
        _v$6 = theme().text.muted,
        _v$7 = columns.language,
        _v$8 = theme().text.muted,
        _v$9 = columns.lines + 6,
        _v$0 = theme().text.muted,
        _v$1 = columns.turn + 5,
        _v$10 = layout().sideBySide ? ["left"] : ["top"],
        _v$11 = theme().border.base,
        _v$12 = layout().sideBySide ? 2 : 0,
        _v$13 = layout().sideBySide ? 0 : 1,
        _v$14 = layout().sideBySide ? "row" : "column-reverse",
        _v$15 = layout().sideBySide ? layout().listWidth : "100%",
        _v$16 = {
          fg: theme().text.base
        },
        _v$17 = {
          fg: theme().text.muted
        },
        _v$18 = {
          bg: theme().background.action.secondary.base,
          fg: theme().text.base
        },
        _v$19 = {
          fg: current() && !busy() ? theme().text.base : theme().text.muted
        },
        _v$20 = {
          bg: theme().background.action.secondary.base,
          fg: theme().text.base
        },
        _v$21 = {
          fg: theme().text.muted
        };
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "fg", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$5, "fg", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$7, "fg", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$0, "flexDirection", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp(_el$1, "width", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp(_el$13, "fg", _v$6, _p$.n));
      _v$7 !== _p$.s && (_p$.s = _$setProp(_el$13, "width", _v$7, _p$.s));
      _v$8 !== _p$.h && (_p$.h = _$setProp(_el$15, "fg", _v$8, _p$.h));
      _v$9 !== _p$.r && (_p$.r = _$setProp(_el$15, "width", _v$9, _p$.r));
      _v$0 !== _p$.d && (_p$.d = _$setProp(_el$17, "fg", _v$0, _p$.d));
      _v$1 !== _p$.l && (_p$.l = _$setProp(_el$17, "width", _v$1, _p$.l));
      _v$10 !== _p$.u && (_p$.u = _$setProp(_el$23, "border", _v$10, _p$.u));
      _v$11 !== _p$.c && (_p$.c = _$setProp(_el$23, "borderColor", _v$11, _p$.c));
      _v$12 !== _p$.w && (_p$.w = _$setProp(_el$23, "paddingLeft", _v$12, _p$.w));
      _v$13 !== _p$.m && (_p$.m = _$setProp(_el$23, "paddingTop", _v$13, _p$.m));
      _v$14 !== _p$.f && (_p$.f = _$setProp(_el$25, "flexDirection", _v$14, _p$.f));
      _v$15 !== _p$.y && (_p$.y = _$setProp(_el$26, "width", _v$15, _p$.y));
      _v$16 !== _p$.g && (_p$.g = _$setProp(_el$28, "style", _v$16, _p$.g));
      _v$17 !== _p$.p && (_p$.p = _$setProp(_el$30, "style", _v$17, _p$.p));
      _v$18 !== _p$.b && (_p$.b = _$setProp(_el$33, "style", _v$18, _p$.b));
      _v$19 !== _p$.T && (_p$.T = _$setProp(_el$35, "style", _v$19, _p$.T));
      _v$20 !== _p$.A && (_p$.A = _$setProp(_el$37, "style", _v$20, _p$.A));
      _v$21 !== _p$.O && (_p$.O = _$setProp(_el$39, "style", _v$21, _p$.O));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined,
      r: undefined,
      d: undefined,
      l: undefined,
      u: undefined,
      c: undefined,
      w: undefined,
      m: undefined,
      f: undefined,
      y: undefined,
      g: undefined,
      p: undefined,
      b: undefined,
      T: undefined,
      A: undefined,
      O: undefined
    });
    return _el$;
  })();
}
