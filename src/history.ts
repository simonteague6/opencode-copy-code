import type { MessageListInput, SessionMessagesResponse, SessionMessageInfo } from "@opencode/client";

/** Explicit pagination avoids limiting the picker to the TUI's cached messages. */
export async function loadHistory(
  sessionID: string,
  list: (input: MessageListInput) => Promise<SessionMessagesResponse>,
): Promise<SessionMessageInfo[]> {
  const messages: SessionMessageInfo[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    // Continuation cursors retain the initial order; the API rejects an
    // explicit order when a cursor is present.
    const page = await list(cursor
      ? { sessionID, limit: 100, cursor }
      : { sessionID, limit: 100, order: "asc" });
    messages.push(...page.data);
    cursor = page.cursor.next ?? undefined;
    if (cursor && cursors.has(cursor)) throw new Error("Message history returned a repeated pagination cursor");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return messages;
}
