import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { BunnyIcon, SleepingBunnyIcon } from "@/components/kawaii-icons/kawaii-icons";

const AWAKE_WINDOW_MS = 2 * 60 * 1000;
const WALK_DURATION_MS = 900;
const SIT_MIN_MS = 1200;
const SIT_MAX_MS = 3200;
const STEP_RANGE_PX = 22;
const WANDER_RADIUS_PX = 40;
const ICON_SIZE_PX = 32;
const EDGE_MARGIN_PX = 16;
const MOOD_MIN_MS = 7000;
const MOOD_MAX_MS = 12000;
const MOOD_DISPLAY_MS = 1600;
const MOODS = [
  "⸜(｡˃ ᵕ ˂ )⸝♡",
  "uwu",
  "（>.<）",
  "•⩊•",
  "❤︎",
  "(^_^)",
  "(>_<)",
  "\\(^o^)/",
  "(*^-^*)",
  "(o^_^o)",
  "^-^",
];

// Asleep by default. A click wakes it and keeps it awake for 2 minutes,
// extended by every further click. While awake it behaves like a little
// desktop pet (vscode-pets style): walk a short distance, sit for a
// moment, walk again, on repeat, facing the direction it's moving, and
// stays clamped to the visible viewport so it can never wander off-screen.
// Every 7-12s it also flashes a little kaomoji emote. No
// click for 2 minutes -> back to sleep. All movement/moods are skipped
// under prefers-reduced-motion — it just stays asleep.
export default function PetBunny() {
  const theme = useTheme();
  const active = theme.retro && theme.gimmicks.bouncingBuddy;
  const [awake, setAwake] = useState(false);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isAwakeRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });
  const asleepTimeoutRef = useRef<number>();
  const walkTimeoutRef = useRef<number>();
  const moodTimeoutRef = useRef<number>();

  useEffect(() => {
    if (!active) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function homePosition() {
      return {
        x: window.innerWidth - ICON_SIZE_PX - EDGE_MARGIN_PX,
        y: window.innerHeight - ICON_SIZE_PX - EDGE_MARGIN_PX,
      };
    }

    function applyTransform() {
      if (trackRef.current) {
        trackRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }
    }

    function clampToViewport() {
      const maxX = window.innerWidth - ICON_SIZE_PX - EDGE_MARGIN_PX;
      const maxY = window.innerHeight - ICON_SIZE_PX - EDGE_MARGIN_PX;
      posRef.current = {
        x: Math.min(Math.max(posRef.current.x, EDGE_MARGIN_PX), Math.max(EDGE_MARGIN_PX, maxX)),
        y: Math.min(Math.max(posRef.current.y, EDGE_MARGIN_PX), Math.max(EDGE_MARGIN_PX, maxY)),
      };
      applyTransform();
    }

    function goToSleep() {
      isAwakeRef.current = false;
      setAwake(false);
      setWalking(false);
      setMood(null);
      window.clearTimeout(walkTimeoutRef.current);
      window.clearTimeout(moodTimeoutRef.current);
    }

    function step() {
      if (!isAwakeRef.current) return;
      const home = homePosition();
      const delta = (Math.random() * 2 - 1) * STEP_RANGE_PX;
      const proposedX = posRef.current.x + delta;
      const clampedToWander = Math.min(
        home.x + WANDER_RADIUS_PX,
        Math.max(home.x - WANDER_RADIUS_PX, proposedX),
      );
      const nextX = Math.min(
        window.innerWidth - ICON_SIZE_PX - EDGE_MARGIN_PX,
        Math.max(EDGE_MARGIN_PX, clampedToWander),
      );
      setFacingLeft(nextX < posRef.current.x);
      posRef.current = { ...posRef.current, x: nextX };
      setWalking(true);
      applyTransform();

      walkTimeoutRef.current = window.setTimeout(() => {
        setWalking(false);
        const sitFor = SIT_MIN_MS + Math.random() * (SIT_MAX_MS - SIT_MIN_MS);
        walkTimeoutRef.current = window.setTimeout(step, sitFor);
      }, WALK_DURATION_MS);
    }

    function scheduleMood() {
      const delay = MOOD_MIN_MS + Math.random() * (MOOD_MAX_MS - MOOD_MIN_MS);
      moodTimeoutRef.current = window.setTimeout(showMood, delay);
    }

    function showMood() {
      if (!isAwakeRef.current) return;
      setMood(MOODS[Math.floor(Math.random() * MOODS.length)]);
      window.setTimeout(() => setMood(null), MOOD_DISPLAY_MS);
      scheduleMood();
    }

    function onClick() {
      window.clearTimeout(asleepTimeoutRef.current);
      asleepTimeoutRef.current = window.setTimeout(goToSleep, AWAKE_WINDOW_MS);

      if (!isAwakeRef.current) {
        isAwakeRef.current = true;
        posRef.current = homePosition();
        applyTransform();
        setAwake(true);
        if (!prefersReducedMotion) {
          step();
          scheduleMood();
        }
      }
    }

    function onResize() {
      clampToViewport();
    }

    posRef.current = homePosition();
    applyTransform();
    window.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(asleepTimeoutRef.current);
      window.clearTimeout(walkTimeoutRef.current);
      window.clearTimeout(moodTimeoutRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={trackRef}
      className="pointer-events-none fixed left-0 top-0 z-40 h-8 w-8 transition-transform ease-in-out"
      style={{ transitionDuration: `${WALK_DURATION_MS}ms` }}
      aria-hidden="true"
    >
      {mood && (
        <span
          className="gimmick-mood-pop absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs"
          style={{ color: "var(--color-accent)" }}
          aria-hidden="true"
        >
          {mood}
        </span>
      )}
      {awake ? (
        <div className="h-full w-full" style={{ transform: facingLeft ? "scaleX(-1)" : undefined }}>
          <BunnyIcon
            className={`h-full w-full ${walking ? "gimmick-hop-arc" : "gimmick-idle-bob"}`}
            style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
          />
        </div>
      ) : (
        <div className="relative h-full w-full">
          <SleepingBunnyIcon
            className="h-full w-full"
            style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
          />
          <span className="absolute -right-1 -top-3 text-[10px]" aria-hidden="true">
            💤
          </span>
        </div>
      )}
    </div>
  );
}
