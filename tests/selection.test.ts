import assert from "node:assert/strict";
import { test } from "node:test";
import { extractBlocks } from "../src/blocks.js";
import { codePreview, displayText, filterBlocks, moveSelection, visibleSlice } from "../src/selection.js";

const blocks = [
  ...extractBlocks("```TypeScript\nconst HELLO = 1;\n```", 12),
  ...extractBlocks("~~~python\nprint('hi')\n~~~", 2),
];

test("filter is case insensitive across language, preview and turn", () => {
  assert.deepEqual(filterBlocks(blocks, "typeSCRIPT"), [blocks[0]]);
  assert.deepEqual(filterBlocks(blocks, "hello"), [blocks[0]]);
  assert.deepEqual(filterBlocks(blocks, "12"), [blocks[0]]);
  assert.deepEqual(filterBlocks(blocks, "2"), blocks);
  assert.deepEqual(filterBlocks(blocks, ""), blocks);
  assert.deepEqual(filterBlocks(blocks, "no matches"), []);
});

test("navigation clamps at both ends, including zero results", () => {
  assert.equal(moveSelection(0, -1, 10), 0);
  assert.equal(moveSelection(9, 1, 10), 9);
  assert.equal(moveSelection(3, 1, 10), 4);
  assert.equal(moveSelection(0, 1, 0), 0);
});

test("visible slice keeps selection visible with at most eight entries", () => {
  assert.deepEqual(visibleSlice(0, 20), { start: 0, end: 8 });
  assert.deepEqual(visibleSlice(8, 20), { start: 1, end: 9 });
  assert.deepEqual(visibleSlice(19, 20), { start: 12, end: 20 });
  assert.deepEqual(visibleSlice(0, 0), { start: 0, end: 0 });
  assert.deepEqual(visibleSlice(2, 3), { start: 0, end: 3 });
  assert.deepEqual(visibleSlice(5, 10, 3), { start: 3, end: 6 });
});

test("five-line preview includes initial blank lines without changing body", () => {
  const [block] = extractBlocks("```\n\n\tsecond\r\nthird\nfourth\nfifth\nsixth\n```", 1);
  const body = block.body;
  assert.deepEqual(codePreview(block), ["", "    second", "third", "fourth", "fifth"]);
  assert.equal(block.body, body);
});

test("display escapes terminal control characters without interpreting code", () => {
  assert.equal(displayText("\u001b[31mhi\u0007"), "�[31mhi�");
});
