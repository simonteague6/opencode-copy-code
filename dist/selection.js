import { bodyLines } from "./blocks.js";
export function filterBlocks(blocks, query) {
  const needle = query.toLowerCase();
  return blocks.filter(block => [block.language, block.preview, String(block.turn)].some(field => field.toLowerCase().includes(needle)));
}
export function moveSelection(selected, delta, count) {
  return Math.max(0, Math.min(Math.max(0, count - 1), selected + delta));
}
export function visibleSlice(selected, count, size = 8) {
  const start = Math.max(0, Math.min(selected - size + 1, Math.max(0, count - size)));
  return {
    start,
    end: Math.min(count, start + size)
  };
}

/** Terminal-safe display only. The copied body never goes through this function. */
export function displayText(text) {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "�").replace(/\t/g, "    ");
}
export function codePreview(block) {
  return bodyLines(block.body).slice(0, 5).map(displayText);
}
