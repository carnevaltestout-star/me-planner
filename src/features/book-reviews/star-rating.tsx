import { useState } from "react";
import { StarIcon } from "./book-review-icons";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: string;
}

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({ value, onChange, size = "h-4 w-4" }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const shown = hover ?? value;

  return (
    <div dir="ltr" className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {STARS.map((n) => {
        const filled = n <= shown;
        const star = (
          <StarIcon
            filled={filled}
            className={size}
            style={{ color: filled ? "var(--color-accent)" : "var(--color-border)" }}
          />
        );
        if (!interactive) {
          return (
            <span key={n} aria-hidden="true">
              {star}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange?.(n === value ? 0 : n)}
            className="flex items-center justify-center rounded-theme-sm p-0.5 hover:brightness-95"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
