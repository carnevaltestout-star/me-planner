import { useTheme } from "@/components/theme-provider/theme-context";
import { useMusic, useMusicActions } from "./music-context";

// Note + prev/next, next to the "Me planner" brand mark (desktop sidebar)
// and again in the mobile topbar (see app-shell.tsx) since that's the only
// place a mobile user can reach it. The note itself is the play/pause
// toggle; its color/pulse reflects real playback (isPlaying), not just the
// stored `enabled` intent, since a browser can silently block autoplay.
export default function MusicControl() {
  const theme = useTheme();
  const { isPlaying } = useMusic();
  const { toggle, next, prev } = useMusicActions();

  // Same bordered-box "‹ / ›" style journal-header.tsx uses for its prev/next
  // day navigation, just sized down — this sits inline in the compact brand
  // mark row, not its own toolbar, so the white box stays small around the
  // glyph rather than matching journal's full button size. Kawaii's own
  // border color is white (see KAWAII_COLORS in apply-theme.ts), which makes
  // a 1px border invisible against the skin's pale backgrounds — swapped for
  // the kawaii accent pink there specifically so the box actually reads.
  const arrowButtonClass = `flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-theme border bg-surface text-[0.55rem] text-ink hover:bg-surface-alt md:h-[18px] md:w-[18px] md:text-[0.6rem] ${
    theme.kawaii ? "border-accent" : "border-border"
  }`;
  // Kawaii sizes the note at exactly 1.25x the arrow buttons (20/22.5px vs
  // 16/18px); every other skin keeps its own existing note size untouched.
  const noteSizeClass = theme.kawaii ? "h-5 w-5 text-base md:h-[22.5px] md:w-[22.5px] md:text-lg" : "h-6 w-6 text-lg md:h-7 md:w-7 md:text-xl";

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" aria-label="Previous track" onClick={prev} className={arrowButtonClass}>
        ‹
      </button>
      <button
        type="button"
        aria-label={isPlaying ? "Pause music" : "Play music"}
        aria-pressed={isPlaying}
        onClick={toggle}
        className={`relative flex flex-shrink-0 items-center justify-center rounded-theme ${noteSizeClass} ${
          isPlaying ? "music-note-active text-accent" : "text-ink-muted hover:bg-surface-alt hover:text-ink"
        }`}
      >
        ♬
        {/* Diagonal mute strike, same convention as a crossed-out speaker
            icon — shown whenever sound isn't actually playing, whether that's
            the user turning it off or a browser having silently blocked
            autoplay, since either way nothing is audible right now. */}
        {!isPlaying && (
          <span aria-hidden="true" className="pointer-events-none absolute h-[2px] w-[70%] rotate-45 bg-current" />
        )}
      </button>
      <button type="button" aria-label="Next track" onClick={next} className={arrowButtonClass}>
        ›
      </button>
    </div>
  );
}
