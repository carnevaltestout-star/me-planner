import { parseNoteLines } from "@/lib/notes/notes-markdown";

interface NoteContentViewProps {
  content: string;
  // How many lines to render before cutting off (a card preview only shows
  // the first few) — omit to render everything (used by the trash preview,
  // which already truncates by character count instead).
  maxLines?: number;
  // Present only where checkboxes should actually be clickable (card grid);
  // omitted in read-only contexts (Trash), where they render as plain
  // disabled-looking checkboxes instead.
  onToggleCheckbox?: (lineIndex: number) => void;
}

// Shared renderer for the "[ ]"/"[x]" checkbox and "-"/"*" bullet
// line-based markdown-lite — used by NoteCard's preview (interactive) and
// anywhere else a note's content needs to render as more than raw text.
export default function NoteContentView({ content, maxLines, onToggleCheckbox }: NoteContentViewProps) {
  const lines = parseNoteLines(content);
  const visible = maxLines ? lines.slice(0, maxLines) : lines;

  if (lines.length === 1 && lines[0].text.trim() === "") {
    return <p className="m-0 text-sm italic opacity-40">Empty note</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {visible.map((line) => {
        if (line.type === "checkbox") {
          return (
            <label
              key={line.lineIndex}
              className="flex cursor-pointer items-start gap-1.5 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={line.checked}
                onChange={() => onToggleCheckbox?.(line.lineIndex)}
                disabled={!onToggleCheckbox}
                className="mt-0.5 flex-shrink-0"
              />
              <span className={line.checked ? "line-through opacity-50" : ""}>{line.text || <>&nbsp;</>}</span>
            </label>
          );
        }
        if (line.type === "bullet") {
          return (
            <div key={line.lineIndex} className="flex items-start gap-1.5 text-sm">
              <span aria-hidden="true" className="flex-shrink-0">
                •
              </span>
              <span>{line.text || <>&nbsp;</>}</span>
            </div>
          );
        }
        return line.text ? (
          <p key={line.lineIndex} className="m-0 text-sm">
            {line.text}
          </p>
        ) : (
          <div key={line.lineIndex} className="h-2" aria-hidden="true" />
        );
      })}
    </div>
  );
}
