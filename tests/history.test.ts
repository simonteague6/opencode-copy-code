import assert from "node:assert/strict";
import { test } from "node:test";
import type { MessageListInput, SessionMessageInfo } from "@opencode/client";
import { loadHistory } from "../src/history.js";

test("loads every page in ascending history order", async () => {
  const inputs: MessageListInput[] = [];
  const messages = [{ id: "a", type: "user" }, { id: "b", type: "assistant" }] as SessionMessageInfo[];
  const result = await loadHistory("session", async (input) => {
    if (input.cursor && input.order !== undefined) throw new Error("Cursor cannot be combined with order");
    inputs.push(input);
    return input.cursor
      ? { data: [messages[1]], cursor: { next: null } }
      : { data: [messages[0]], cursor: { next: "page2" } };
  });
  assert.deepEqual(result, messages);
  assert.deepEqual(inputs, [
    { sessionID: "session", order: "asc", limit: 100 },
    { sessionID: "session", limit: 100, cursor: "page2" },
  ]);
});

test("empty history is valid", async () => {
  assert.deepEqual(await loadHistory("session", async () => ({ data: [], cursor: {} })), []);
});

test("history failures propagate and repeated cursors cannot loop forever", async () => {
  await assert.rejects(loadHistory("session", async () => { throw new Error("offline"); }), /offline/);
  await assert.rejects(loadHistory("session", async () => ({ data: [], cursor: { next: "same" } })), /repeated pagination cursor/);
});
