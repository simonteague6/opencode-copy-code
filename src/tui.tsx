import { Plugin } from "@opencode/plugin/tui";
import { scanHistory } from "./blocks.js";
import { loadHistory } from "./history.js";
import { CodePicker } from "./picker.js";

export default Plugin.define({
  id: "copy-code",
  setup(context) {
    let loading = false;
    let disposed = false;
    context.keymap.layer(() => ({
      mode: "global",
      commands: [{
        id: "copy-code.open",
        title: "Copy code block",
        description: "Preview and copy a fenced code block from this conversation",
        group: "Copy code",
        palette: true,
        slash: { name: "copy-code", aliases: ["cc"] },
        async run() {
          if (loading) return;
          const route = context.ui.router.current();
          if (route.type !== "session") {
            context.ui.toast.show({ message: "Open a conversation to copy code.", variant: "info" });
            return;
          }
          loading = true;
          try {
            const messages = await loadHistory(route.sessionID, (input) => context.client.message.list(input));
            const active = context.ui.router.current();
            if (disposed || active.type !== "session" || active.sessionID !== route.sessionID) return;
            const blocks = scanHistory(messages);
            if (blocks.length === 0) {
              context.ui.toast.show({ message: "No fenced code blocks in completed assistant messages.", variant: "info" });
              return;
            }
            context.ui.dialog.show(() => <CodePicker blocks={blocks} />);
            context.ui.dialog.set({ size: "xlarge", centered: true });
          } catch (error) {
            if (!disposed) context.ui.toast.show({
              title: "Could not load code blocks",
              message: error instanceof Error ? error.message : String(error),
              variant: "error",
            });
          } finally {
            loading = false;
          }
        },
      }],
    }));
    return () => { disposed = true; };
  },
});
