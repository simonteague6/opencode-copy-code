// Manual TUI smoke fixture: synthetic history only; never sends a model request.
import { Plugin } from "@opencode/plugin/tui";
import type { SessionMessageInfo } from "@opencode/client";
import copyCode from "../../../src/tui.js";

export default Plugin.define({
  id: "copy-code-smoke-fixture",
  async setup(context) {
    const messages = [
      { type: "user" },
      { type: "assistant", time: { completed: 1 }, content: [
        { type: "text", text: "```python\nprint('older')\n```" },
        { type: "text", text: "```typescript\nconst newest = 1;\nline2\nline3\nline4\nline5\nline6\n```" },
      ] },
    ] as SessionMessageInfo[];
    const cleanup = await copyCode.setup({
      ...context,
      client: { ...context.client, message: { ...context.client.message, list: async (input) => {
        if (input.cursor && input.order !== undefined) throw new Error("Cursor cannot be combined with order");
        return input.cursor
          ? { data: messages.slice(1), cursor: {} }
          : { data: messages.slice(0, 1), cursor: { next: "fixture-page2" } };
      } } },
      ui: { ...context.ui, router: { ...context.ui.router, current: () => ({ type: "session", sessionID: "fixture" }) } },
    });
    const timer = setTimeout(() => context.keymap.dispatch("copy-code.open"), 1500);
    return async () => { clearTimeout(timer); await cleanup?.(); };
  },
});
