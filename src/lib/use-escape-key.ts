import { useEffect, useRef } from "react";

// A module-level stack (not per-hook state) so that when dialogs are nested
// — e.g. a delete-confirm rendered on top of its parent edit dialog — a
// single Escape press closes only the top-most one instead of every open
// dialog at once, since window-level keydown listeners all fire on the same
// event regardless of which DOM subtree registered them.
let stack: Array<() => void> = [];

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  const top = stack[stack.length - 1];
  if (top) {
    e.preventDefault();
    top();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", handleGlobalKeyDown);
}

// Calls `onEscape` when Escape is pressed while this hook is mounted and
// `enabled`. Every modal/dialog/sub-form in the app uses this so Escape
// always dismisses whatever is currently open on top, matching the
// click-outside-the-backdrop convention those same components already use.
export function useEscapeKey(onEscape: () => void, enabled = true) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!enabled) return;
    const handler = () => onEscapeRef.current();
    stack.push(handler);
    return () => {
      stack = stack.filter((h) => h !== handler);
    };
  }, [enabled]);
}
