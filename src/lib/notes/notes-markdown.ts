// Deliberately tiny, line-based subset — not a general markdown parser.
// Each line in a note's plain-text content is independently one of:
//   "[ ] text"  -> unchecked checkbox
//   "[x] text"  -> checked checkbox ("x" or "X", per spec)
//   "- text" / "* text" -> bullet point
//   anything else -> plain text (including blank lines)
// Deciding this per-line (not block-based, no nesting) keeps toggling a
// checkbox a single-line string replacement — see toggleCheckboxAtLine.
export type ParsedLine =
  | { type: "checkbox"; lineIndex: number; checked: boolean; text: string }
  | { type: "bullet"; lineIndex: number; text: string }
  | { type: "text"; lineIndex: number; text: string };

const CHECKBOX_RE = /^\[([ xX])\]\s?(.*)$/;
const BULLET_RE = /^[-*]\s+(.*)$/;

export function parseNoteLines(content: string): ParsedLine[] {
  return content.split("\n").map((raw, lineIndex) => {
    const checkboxMatch = raw.match(CHECKBOX_RE);
    if (checkboxMatch) return { type: "checkbox", lineIndex, checked: checkboxMatch[1].toLowerCase() === "x", text: checkboxMatch[2] };
    const bulletMatch = raw.match(BULLET_RE);
    if (bulletMatch) return { type: "bullet", lineIndex, text: bulletMatch[1] };
    return { type: "text", lineIndex, text: raw };
  });
}

// Flips a single checkbox line's checked state in place, leaving every
// other line (and that line's own label text) untouched.
export function toggleCheckboxAtLine(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return content;
  const match = line.match(CHECKBOX_RE);
  if (!match) return content;
  const nextMark = match[1].toLowerCase() === "x" ? " " : "x";
  lines[lineIndex] = `[${nextMark}] ${match[2]}`;
  return lines.join("\n");
}
