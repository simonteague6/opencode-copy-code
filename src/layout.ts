import type { CodeBlock } from "./blocks.js";

/** Stable column widths from all blocks, not only the filtered/visible slice. */
export function tableColumns(blocks: readonly CodeBlock[]) {
  return {
    language: Math.min(16, Math.max(8, ...blocks.map((block) => Array.from(block.language).length))),
    lines: Math.max(3, ...blocks.map((block) => String(block.lineCount).length)),
    turn: Math.max(2, ...blocks.map((block) => String(block.turn).length)),
  };
}

/** Width is the actual dialog body width, not the surrounding terminal width. */
export function pickerLayout(width: number, height: number) {
  const sideBySide = width >= 100;
  return {
    sideBySide,
    listWidth: sideBySide ? Math.min(40, Math.floor((width - 3) * 0.5)) : width,
    pageSize: Math.max(1, Math.min(8, height - (sideBySide ? 13 : 22))),
  };
}
