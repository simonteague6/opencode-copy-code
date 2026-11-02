import assert from "node:assert/strict";
import { test } from "node:test";
import { extractBlocks } from "../src/blocks.js";
import { pickerLayout, tableColumns } from "../src/layout.js";

test("wide dialogs show preview beside the list; narrow dialogs stack", () => {
  assert.equal(pickerLayout(100, 40).sideBySide, true);
  assert.equal(pickerLayout(99, 40).sideBySide, false);
  assert.equal(pickerLayout(60, 40).listWidth, 60);
  assert.equal(pickerLayout(120, 40).listWidth, 40);
});

test("list displays at most eight rows and adapts to terminal height", () => {
  assert.equal(pickerLayout(120, 40).pageSize, 8);
  assert.equal(pickerLayout(80, 26).pageSize, 4);
  assert.equal(pickerLayout(120, 20).pageSize, 7);
  assert.equal(pickerLayout(40, 10).pageSize, 1);
});

test("metadata columns accommodate different languages and number lengths", () => {
  const blocks = [
    ...extractBlocks("```java\nx\n```", 1),
    ...extractBlocks(`\`\`\`typescript\n${"x\n".repeat(1000)}\`\`\``, 123),
  ];
  assert.deepEqual(tableColumns(blocks), { language: 10, lines: 4, turn: 3 });
  assert.deepEqual(tableColumns([]), { language: 8, lines: 3, turn: 2 });
});

test("long language labels cannot expand the table without bound", () => {
  assert.equal(tableColumns(extractBlocks(`\`\`\`${"x".repeat(100)}\nx\n\`\`\``, 1)).language, 16);
});
