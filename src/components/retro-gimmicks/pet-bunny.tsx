import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import {
  BunnyHeartEyesIcon,
  BunnyIcon,
  KawaiiBunnyIcon,
  SleepingBunnyIcon,
} from "@/components/kawaii-icons/kawaii-icons";

const AWAKE_WINDOW_MS = 4 * 60 * 1000;
const WALK_DURATION_MS = 900;
const SIT_MIN_MS = 1200;
const SIT_MAX_MS = 3200;
const STEP_RANGE_PX = 22;
const WANDER_RADIUS_PX = 40;
const ICON_SIZE_PX = 32;
const ICON_SIZE_PX_MOBILE = 22;
const EDGE_MARGIN_PX = 16;
// Sits near the bottom edge on mobile — the footer bar below (see the
// render) gives it a dedicated strip to stand in instead of floating loose
// over page content. Kept a bit clear of the true edge (not flush) since
// some phones' bottom gesture bar/home indicator overlaps the last few px
// of viewport and would otherwise clip the bunny and its mood bubble.
const EDGE_MARGIN_PX_MOBILE = 12;
// Sized to the resting icon + its edge margin — a hop's ~7px bounce (see
// @keyframes hop-arc in index.css) pokes slightly above it, which reads as
// the bunny actually leaving the ground rather than a sizing bug.
const FOOTER_HEIGHT_PX_MOBILE = 34;
const MOOD_MIN_MS = 7000;
const MOOD_MAX_MS = 12000;
const MOOD_DISPLAY_MIN_MS = 4000;
const MOOD_DISPLAY_MAX_MS = 6000;
// Clicking the bunny itself (not just anywhere on the page) 3-4 times within
// this window triggers heart eyes; a 5th click in the same window swaps that
// for a "please focus" nudge instead — a light-touch nag against using the
// pet as a fidget toy instead of doing the thing the app is for.
const CLICK_WINDOW_MS = 5000;
const HEART_EYES_CLICK_MIN = 3;
const FOCUS_NAG_CLICK_MIN = 5;
const HEART_EYES_MS = 2500;
const HEART_FLOAT_MS = 1400;
const FOCUS_NAG_TEXT = "please focus on the journal 👀";
const FOCUS_NAG_DISPLAY_MS = 4000;
const MOODS = [
  "⸜(｡˃ ᵕ ˂ )⸝♡",
  "uwu",
  "（>.<）",
  "❤︎",
  "(>_<)",
  "\\(^o^)/",
  "(*^-^*)",
  "(o^_^o)",
  "^-^",
  "u got this champ!",
  "You gotta earn the smugness",
  "suffer productively",
  "Get up, one task, one victory",
  "Get it together, respectfully",
  "Be a nervous badass",
  "F*ck perfect, show up",
  "keep walking <3",
  "What u fear controls u",
  "we all die eventually, just do it",
  "no risk no champagne babeeey",
  "be awkward with confidence",
  "Eat something that isn't a snack",
  "Stop refreshing your misery",
  "Be consistent and sometimes impressive",
  "Feelings are signs, not instructions.",
  "Replace \"What if\'s!?\" with \"Let\'s find out!\"",
  "Anxiety always wins a debate",
  "Choose: Pain of discipline or regret?!",
  "Notice, don\'t react to all thoughts, dummy",
  "Kiss yourself",
  "discipline over feelings",
  "Slow down, to regain control",
  "Always stay critical, question and debate! ;3",
  "Do what u fear",
  "Just do your thing..whatever it is.",
  "Touch some grass",
  "Be there for someone : 3",
  "bounce back and learn :3"
];

function homePosition(iconSize: number, edgeMargin: number) {
  return {
    x: window.innerWidth - iconSize - edgeMargin,
    y: window.innerHeight - iconSize - edgeMargin,
  };
}

// Asleep on first load. A click wakes it and keeps it awake for 4 minutes,
// extended by every further click. While awake it behaves like a little
// desktop pet (vscode-pets style): walk a short distance, sit for a
// moment, walk again, on repeat, facing the direction it's moving, and
// stays clamped to the visible viewport so it can never wander off-screen.
// No click for 4 minutes -> back to sleep, though it keeps napping right
// there rather than vanishing. Mood pop-ups run on their own continuous
// 7-12s loop the whole time this gimmick is on: random kaomoji/quotes while
// awake, just "Zzz" while asleep. Walking/hopping is skipped under
// prefers-reduced-motion; the mood text itself still shows (it's not
// motion), just without the pop animation.
export default function PetBunny() {
  const theme = useTheme();
  const active = theme.gimmicks.bouncingBuddy;
  const Bunny = theme.kawaii ? KawaiiBunnyIcon : BunnyIcon;
  const [awake, setAwake] = useState(false);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  // Smaller sprite (and correspondingly smaller emotes/bubble, see the JSX
  // below) on narrow screens — less room to spare, so less footprint that
  // could sit on top of real UI.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const iconSize = isMobile ? ICON_SIZE_PX_MOBILE : ICON_SIZE_PX;
  const edgeMargin = isMobile ? EDGE_MARGIN_PX_MOBILE : EDGE_MARGIN_PX;
  const trackRef = useRef<HTMLDivElement>(null);
  const isAwakeRef = useRef(false);
  // Seeded with the real home position (not {x:0, y:0}) so the very first
  // paint already places the bunny correctly — otherwise it starts at the
  // top-left corner and the transition-transform class animates a visible
  // slide down to home on every mount.
  const posRef = useRef(homePosition(iconSize, edgeMargin));
  const asleepTimeoutRef = useRef<number>();
  const walkTimeoutRef = useRef<number>();
  const moodTimeoutRef = useRef<number>();
  const [heartEyes, setHeartEyes] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);
  const clickTimestampsRef = useRef<number[]>([]);
  const heartEyesTimeoutRef = useRef<number>();
  const heartIdRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function applyTransform() {
      if (trackRef.current) {
        trackRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }
    }

    function clampToViewport() {
      // Y always re-anchors to the bottom edge (its "home" row) instead of
      // just clamping the old value — otherwise shrinking the window then
      // growing it back leaves the bunny stuck floating at the old, smaller
      // height instead of snapping back down to the bottom.
      const maxX = window.innerWidth - iconSize - edgeMargin;
      posRef.current = {
        x: Math.min(Math.max(posRef.current.x, edgeMargin), Math.max(edgeMargin, maxX)),
        y: window.innerHeight - iconSize - edgeMargin,
      };
      applyTransform();
    }

    function goToSleep() {
      isAwakeRef.current = false;
      setAwake(false);
      setWalking(false);
      window.clearTimeout(walkTimeoutRef.current);
    }

    function step() {
      if (!isAwakeRef.current) return;
      const home = homePosition(iconSize, edgeMargin);
      const delta = (Math.random() * 2 - 1) * STEP_RANGE_PX;
      const proposedX = posRef.current.x + delta;
      const clampedToWander = Math.min(
        home.x + WANDER_RADIUS_PX,
        Math.max(home.x - WANDER_RADIUS_PX, proposedX),
      );
      const nextX = Math.min(
        window.innerWidth - iconSize - edgeMargin,
        Math.max(edgeMargin, clampedToWander),
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
      const text = isAwakeRef.current ? MOODS[Math.floor(Math.random() * MOODS.length)] : "Zzz";
      setMood(text);
      const displayFor = MOOD_DISPLAY_MIN_MS + Math.random() * (MOOD_DISPLAY_MAX_MS - MOOD_DISPLAY_MIN_MS);
      window.setTimeout(() => setMood(null), displayFor);
      scheduleMood();
    }

    function onClick() {
      window.clearTimeout(asleepTimeoutRef.current);
      asleepTimeoutRef.current = window.setTimeout(goToSleep, AWAKE_WINDOW_MS);

      if (!isAwakeRef.current) {
        isAwakeRef.current = true;
        posRef.current = homePosition(iconSize, edgeMargin);
        applyTransform();
        setAwake(true);
        if (!prefersReducedMotion) step();
      }
    }

    function onResize() {
      clampToViewport();
    }

    // Clicks inside an <iframe> (e.g. a mockup embedded on a tab page) fire
    // in the iframe's own document and never reach this window's "click"
    // listener. Embedded mockups post a message on click instead so the
    // bunny still wakes up when you're interacting with them.
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === "me-planner:wake-bunny") onClick();
    }

    window.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    window.addEventListener("message", onMessage);
    // Moods run continuously regardless of awake/asleep, for as long as this
    // gimmick is on — not gated on activity like the walking is.
    scheduleMood();
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("message", onMessage);
      window.clearTimeout(asleepTimeoutRef.current);
      window.clearTimeout(walkTimeoutRef.current);
      window.clearTimeout(moodTimeoutRef.current);
      window.clearTimeout(heartEyesTimeoutRef.current);
    };
  }, [active, iconSize, edgeMargin]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  function spawnHearts() {
    const burst = [0, 1, 2].map(() => ({ id: (heartIdRef.current += 1), left: Math.random() * 16 - 8 }));
    setHearts((prev) => [...prev, ...burst]);
    burst.forEach((h) => {
      window.setTimeout(() => {
        setHearts((prev) => prev.filter((x) => x.id !== h.id));
      }, HEART_FLOAT_MS);
    });
  }

  function triggerHeartEyes() {
    window.clearTimeout(heartEyesTimeoutRef.current);
    setHeartEyes(true);
    heartEyesTimeoutRef.current = window.setTimeout(() => setHeartEyes(false), HEART_EYES_MS);
    spawnHearts();
  }

  function triggerFocusNag() {
    window.clearTimeout(heartEyesTimeoutRef.current);
    setHeartEyes(false);
    setHearts([]);
    setMood(FOCUS_NAG_TEXT);
    window.setTimeout(() => setMood((current) => (current === FOCUS_NAG_TEXT ? null : current)), FOCUS_NAG_DISPLAY_MS);
  }

  // Clicking the bunny sprite specifically (not the ambient "any click on the
  // page" wake-up above) — a short burst of clicks is treated as affection,
  // a longer burst as pestering it instead of using the app.
  function handlePetClick() {
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter((t) => now - t < CLICK_WINDOW_MS);
    recent.push(now);
    clickTimestampsRef.current = recent;

    if (recent.length >= FOCUS_NAG_CLICK_MIN) {
      triggerFocusNag();
    } else if (recent.length >= HEART_EYES_CLICK_MIN) {
      triggerHeartEyes();
    }
  }

  if (!active) return null;

  return (
    <>
      {/* Mobile only — gives the bunny (now resting right at the bottom
          edge, see EDGE_MARGIN_PX_MOBILE) a dedicated strip of its own
          background color to stand in, instead of floating loose directly
          over whatever page content happens to scroll underneath it.
          data-theme-surface="chrome" (same as the topbar/header) rather than
          a hardcoded --color-surface, so it gets whatever treatment the
          current skin applies to chrome surfaces (e.g. kawaii's gradient,
          starfield's translucency) instead of looking mismatched under
          those. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface md:hidden"
        style={{ height: FOOTER_HEIGHT_PX_MOBILE }}
        data-theme-surface="chrome"
        aria-hidden="true"
      />
      <div
        ref={trackRef}
        className="pointer-events-none fixed left-0 top-0 z-40 transition-transform ease-in-out"
        style={{
          width: iconSize,
          height: iconSize,
          transitionDuration: `${WALK_DURATION_MS}ms`,
          transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)`,
        }}
      aria-hidden="true"
    >
      {mood && (
        <span
          className={`gimmick-mood-pop absolute right-full top-1/2 mr-3 max-w-[46vw] -translate-y-1/2 whitespace-nowrap rounded-2xl border-[3px] font-semibold sm:max-w-none ${
            isMobile ? "px-2 py-1 text-[0.62rem]" : "px-3 py-1.5 text-xs"
          }`}
          style={{ color: "var(--color-ink)", background: "var(--color-surface)", borderColor: "var(--color-accent)" }}
          aria-hidden="true"
        >
          {mood}
        </span>
      )}
      {hearts.map((h) => (
        <span
          key={h.id}
          className={`gimmick-heart-float pointer-events-none absolute bottom-[80%] left-1/2 ${isMobile ? "text-[0.6rem]" : "text-xs"}`}
          style={{ marginLeft: h.left }}
          aria-hidden="true"
        >
          💗
        </span>
      ))}
      {awake ? (
        <div
          className="pointer-events-auto relative h-full w-full cursor-pointer"
          style={{ transform: facingLeft ? "scaleX(-1)" : undefined }}
          onClick={handlePetClick}
        >
          <Bunny
            className={`h-full w-full ${walking ? "gimmick-hop-arc" : "gimmick-idle-bob"}`}
            style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
          />
          {heartEyes && (
            <BunnyHeartEyesIcon
              className="absolute inset-0 h-full w-full"
              style={{ color: "#ff2d78", imageRendering: "pixelated" }}
            />
          )}
        </div>
      ) : (
        <div className="pointer-events-auto relative h-full w-full cursor-pointer" onClick={handlePetClick}>
          <SleepingBunnyIcon
            className="h-full w-full"
            style={{ color: "var(--color-accent)", imageRendering: "pixelated" }}
          />
          <span className={`absolute -right-1 -top-3 ${isMobile ? "text-[8px]" : "text-[10px]"}`} aria-hidden="true">
            💤
          </span>
        </div>
      )}
      </div>
    </>
  );
}
