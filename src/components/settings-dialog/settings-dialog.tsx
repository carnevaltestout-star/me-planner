import { useEffect, useRef, useState } from "react";
import SettingsPanel from "./settings-panel";
import { BOTTOM_NAV_HEIGHT_PX } from "@/components/app-shell/bottom-nav";
import { FOOTER_HEIGHT_PX_MOBILE } from "@/components/retro-gimmicks/pet-bunny";
import { useTheme } from "@/components/theme-provider/theme-context";

interface SettingsDialogProps {
  onClose: () => void;
}

// The open animation (slide up from the bottom) is the same for every
// theme — only the CLOSE animation differs below, so only it needs a
// variant-specific duration.
const OPEN_ANIM_MS = 260;
// Close is deliberately quicker than open (for every variant, including
// clicking the backdrop to dismiss, which goes through the same
// handleClose) — an explicit dismissal should feel snappy rather than
// mirroring the slower, more deliberate opening pace.
const CLOSE_ANIM_MS_DEFAULT = 140;
// These two must match the `animation:` duration baked into
// .settings-pixel-dissolve / .settings-heart-dissolve in index.css — the
// unmount timer here can't read a CSS value, so it's just kept in sync by
// hand (call it out if you change one without the other). Kept longer than
// the default close since the dissolve/heart-float effects need enough
// frames to actually read as themselves rather than a blink.
const CLOSE_ANIM_MS_RETRO = 320;
const CLOSE_ANIM_MS_KAWAII = 340;

let heartIdCounter = 0;

// A real in-app dialog (ported from public/mockups/theme-system.html, which
// stays around as historical reference but is no longer live) instead of a
// separate browser tab or an iframe — every control in SettingsPanel writes
// straight through useSetTheme(), so changes autosave and apply instantly.
// Rendered by AppShell at its root (a sibling of PetBunny etc.), not nested
// inside the main content column, and positioned fixed to the whole
// viewport here (not just that column) with a z-index above every other
// document-level overlay in the shell — z-40 scoped to that column used to
// mean this dialog could render *underneath* things living outside it, like
// PetBunny's fixed sprite/footer bar, on every tab whenever that gimmick was
// on, which looked like the dialog had failed to open at all. Sized to 80%
// of the viewport rather than covering it entirely on desktop; on mobile it
// slides up from the bottom as a sheet capped below BOTTOM_NAV_HEIGHT_PX so
// it never covers BottomNav, rather than taking over the full screen.
//
// Closing looks different per skin: plain theme slides the sheet off to
// the right on mobile (still a plain vertical drop on desktop, where a
// sideways exit reads oddly for a centered modal); retro dissolves it into
// blocky pixel chunks; kawaii dissolves it while a burst of hearts floats
// away from where it sat, echoing PetBunny's own heart-burst gimmick.
export default function SettingsDialog({ onClose }: SettingsDialogProps) {
  const theme = useTheme();
  const variant = theme.retro ? "retro" : theme.kawaii ? "kawaii" : "default";
  // Same "is the bunny's footer strip showing" gate app-shell.tsx and
  // BottomNav already use — needed here too so the sheet's reserved gap
  // matches however much space is actually stacked at the bottom right now.
  const bunnyActive = (theme.retro || theme.kawaii || theme.tryout) && theme.gimmicks.bouncingBuddy;
  const mobileBottomGap = BOTTOM_NAV_HEIGHT_PX + (bunnyActive ? FOOTER_HEIGHT_PX_MOBILE : 0) + 8;
  // Starts hidden and flips true a frame after mount so the slide-up is an
  // actual transition rather than appearing already in place — mirrors the
  // same trick BottomNav's sheet doesn't need (it's always mounted, just
  // translated off-screen) but this dialog only mounts while open.
  const [visible, setVisible] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; leftPct: number; topPct: number; dx: number }[]>([]);
  const heartTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(id);
      heartTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  function spawnCloseHearts() {
    const burst = Array.from({ length: 7 }, () => ({
      id: (heartIdCounter += 1),
      leftPct: 15 + Math.random() * 70,
      topPct: 45 + Math.random() * 45,
      dx: (Math.random() * 2 - 1) * 36,
    }));
    setHearts(burst);
    const t = window.setTimeout(() => setHearts([]), CLOSE_ANIM_MS_KAWAII);
    heartTimeoutsRef.current.push(t);
  }

  function handleClose() {
    // index.css skips the dissolve/slide animations entirely under
    // prefers-reduced-motion — matching that here so the dialog doesn't
    // just sit frozen for hundreds of ms with nothing moving before it
    // finally unmounts.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closeAnimMs = reducedMotion
      ? 0
      : variant === "retro"
        ? CLOSE_ANIM_MS_RETRO
        : variant === "kawaii"
          ? CLOSE_ANIM_MS_KAWAII
          : CLOSE_ANIM_MS_DEFAULT;
    if (variant === "kawaii" && !reducedMotion) spawnCloseHearts();
    setVisible(false);
    window.setTimeout(onClose, closeAnimMs);
  }

  // Retro/kawaii dissolve in place (their exit is a CSS keyframe animation
  // that handles its own opacity/shape, not a transform) — only the plain
  // variant slides on close, so it's the only one that needs an exit
  // transform class at all.
  const exitTransformClass = variant === "default" ? "translate-x-full md:translate-x-0 md:translate-y-full" : "translate-y-0";
  const dissolveClass = visible
    ? ""
    : variant === "retro"
      ? "settings-pixel-dissolve"
      : variant === "kawaii"
        ? "settings-heart-dissolve"
        : "";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 md:items-center md:justify-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* On mobile this sits above the bottom nav (mb-[gap]) instead of
          covering it, and caps its own height so it reads as a sheet rather
          than a full-screen takeover; desktop keeps the original centered
          80% modal, unaffected since there's no bottom nav there to clear. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings and theme"
        className={`mb-[var(--sheet-bottom-gap)] flex max-h-[75vh] w-full flex-col overflow-hidden rounded-t-theme border border-border bg-surface shadow-theme transition-transform ease-out md:mb-0 md:h-[80%] md:max-h-none md:w-[80%] md:rounded-theme ${
          visible ? "translate-y-0" : exitTransformClass
        } ${dissolveClass}`}
        style={{ "--sheet-bottom-gap": `${mobileBottomGap}px`, transitionDuration: `${OPEN_ANIM_MS}ms` } as React.CSSProperties}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface-alt px-3 py-2">
          <span className="text-sm font-semibold text-ink">Settings &amp; theme</span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close settings"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
          >
            ✕
          </button>
        </div>
        <SettingsPanel />
      </div>
      {/* Rendered on the backdrop, not inside the panel — the panel's own
          overflow-hidden (needed for SettingsPanel's internal scroll) would
          otherwise clip hearts the moment they float past its edge. */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="settings-close-heart pointer-events-none fixed text-lg"
          style={{ left: `${h.leftPct}%`, top: `${h.topPct}%`, "--heart-dx": `${h.dx}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          💗
        </span>
      ))}
    </div>
  );
}
