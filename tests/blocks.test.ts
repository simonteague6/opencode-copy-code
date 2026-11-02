import assert from "node:assert/strict";
import { test } from "node:test";
import { bodyLines, extractBlocks, scanHistory, type HistoryMessage } from "../src/blocks.js";

test("extracts language, preview, turn and exact body", () => {
  assert.deepEqual(extractBlocks("Before\n```ts title=sample\n\n  const x = 1;  \n```\nAfter", 3), [{
    body: "\n  const x = 1;  \n", language: "ts", lineCount: 2, turn: 3, preview: "const x = 1;",
  }]);
});

test("supports tilde fences, longer closing fences and surrounding whitespace", () => {
  const blocks = extractBlocks("  ~~~~ python extra \t\r\n\tprint('hi') \r\n \t~~~~~ \t", 1);
  assert.equal(blocks[0].body, "\tprint('hi') \r\n");
  assert.equal(blocks[0].language, "python");
  assert.equal(blocks[0].lineCount, 1);
});

test("preserves mixed line endings and whitespace byte-for-byte", () => {
  const body = "  a\r\nb\nc\r\t\r\n\r\n";
  const [block] = extractBlocks(`\t\`\`\`\r\n${body}\`\`\``, 0);
  assert.equal(block.body, body);
  assert.equal(block.language, "plain text");
  assert.equal(block.lineCount, 5);
});

test("same-character closing fence must be long enough and alone on its line", () => {
  const text = "````md\n```\n~~~\n```` not a close\nbody\n`````";
  assert.equal(extractBlocks(text, 0)[0].body, "```\n~~~\n```` not a close\nbody\n");
});

test("incomplete, inline and short fences are ignored", () => {
  for (const text of ["```", "```js\nmissing", "``\nbody\n``", "inline ```js\nbody\n```", "~~~\ntext\n```", "```bad`info\nx"]) {
    assert.deepEqual(extractBlocks(text, 1), []);
  }
});

test("empty and whitespace-only blocks remain selectable", () => {
  assert.deepEqual(extractBlocks("```\n```", 0)[0], {
    body: "", language: "plain text", lineCount: 0, turn: 0, preview: "(blank)",
  });
  assert.deepEqual(extractBlocks("~~~\n \t\n\n~~~", 0)[0], {
    body: " \t\n\n", language: "plain text", lineCount: 2, turn: 0, preview: "(blank)",
  });
});

test("counts lines excluding only the final empty line", () => {
  assert.deepEqual(bodyLines(""), []);
  assert.deepEqual(bodyLines("\n"), [""]);
  assert.deepEqual(bodyLines("a\n\n"), ["a", ""]);
  assert.deepEqual(bodyLines("a\r\nb"), ["a", "b"]);
});

test("only completed assistant text is scanned; newest blocks first with user turns", () => {
  const code = (value: string) => `\`\`\`js\n${value}\n\`\`\``;
  const messages: HistoryMessage[] = [
    { type: "user", content: [{ type: "text", text: code("user") }] },
    { type: "assistant", time: { completed: 1 }, content: [
      { type: "reasoning", text: code("reasoning") },
      { type: "tool", text: code("tool") },
      { type: "text", text: code("first") + "\n" + code("second") },
    ] },
    { type: "user" },
    { type: "synthetic", content: [{ type: "text", text: code("synthetic") }] },
    { type: "assistant", time: { completed: 0 }, content: [{ type: "text", text: code("third") }] },
    { type: "assistant", time: {}, content: [{ type: "text", text: code("streaming") }] },
  ];
  assert.deepEqual(scanHistory(messages).map(({ body, turn }) => [body, turn]), [
    ["third\n", 2], ["second\n", 1], ["first\n", 1],
  ]);
});

test("never matches an opening fence across text parts or non-text content", () => {
  assert.deepEqual(scanHistory([{ type: "assistant", time: { completed: 1 }, content: [
    { type: "text", text: "```js\n" }, { type: "tool" }, { type: "text", text: "x\n```" },
  ] }]), []);
});

test("a complete block survives a subsequent incomplete block", () => {
  assert.equal(extractBlocks("```\na\n```\n~~~\nunclosed", 1).length, 1);
});
