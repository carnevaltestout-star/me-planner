import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// Grows with its content instead of scrolling or needing a manual drag
// handle — every journal field (the static questions, the rotating Q5, and
// Notes) uses this instead of a plain <textarea>. Resizes on every
// keystroke, and once more on mount/value change so a pre-filled entry
// (switching dates, loading a saved answer) starts at the right height
// without waiting for the first keystroke.
export default function AutoGrowTextarea({ value, onChange, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        resize(e.currentTarget);
        onChange?.(e);
      }}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      {...rest}
    />
  );
}
