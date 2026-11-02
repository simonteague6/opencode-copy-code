export interface CodeBlock {
  body: string;
  language: string;
  lineCount: number;
  turn: number;
  preview: string;
}

/** Structural subset of OpenCode V2 messages; other content is deliberately opaque. */
export interface HistoryMessage {
  type: string;
  time?: { created?: number; completed?: number };
  content?: readonly { type: string; text?: string }[];
}

export function bodyLines(body: string): string[] {
  if (!body) return [];
  const lines = body.split(/\r\n|\n|\r/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/** Parse using source offsets, never reconstructing or normalizing the body. */
export function extractBlocks(text: string, turn: number): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let opening: { character: string; length: number; start: number; language: string } | undefined;
  const lines = text.matchAll(/([^\r\n]*)(\r\n|\n|\r|$)/g);
  for (const match of lines) {
    const line = match[1];
    if (opening) {
      const close = /^[\t ]*(`{3,}|~{3,})[\t ]*$/.exec(line);
      if (!close || close[1][0] !== opening.character || close[1].length < opening.length) continue;
      const body = text.slice(opening.start, match.index);
      const bodyLineList = bodyLines(body);
      blocks.push({
        body,
        language: opening.language,
        lineCount: bodyLineList.length,
        turn,
        preview: bodyLineList.find((value) => value.trim())?.trim() ?? "(blank)",
      });
      opening = undefined;
      continue;
    }
    const fence = /^[\t ]*(`{3,}|~{3,})(.*)$/.exec(line);
    if (!fence || (fence[1][0] === "`" && fence[2].includes("`"))) continue;
    opening = {
      character: fence[1][0],
      length: fence[1].length,
      start: match.index + match[0].length,
      language: fence[2].trim().split(/\s+/)[0] || "plain text",
    };
  }
  return blocks;
}

export function scanHistory(messages: readonly HistoryMessage[]): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let turn = 0;
  for (const message of messages) {
    if (message.type === "user") turn++;
    if (message.type !== "assistant" || message.time?.completed === undefined) continue;
    for (const content of message.content ?? []) {
      if (content.type === "text" && typeof content.text === "string") {
        blocks.push(...extractBlocks(content.text, turn));
      }
    }
  }
  return blocks.reverse();
}
