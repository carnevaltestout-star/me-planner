import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import {
  BunnyHeartEyesIcon,
  BunnyIcon,
  KawaiiBunnyIcon,
  SleepingBunnyIcon,
} from "@/components/kawaii-icons/kawaii-icons";
import ReadingBunnyScene from "./reading-bunny-scene";

const AWAKE_WINDOW_MS = 4 * 60 * 1000;
const WALK_DURATION_MS = 900;
const SIT_MIN_MS = 1200;
const SIT_MAX_MS = 3200;
const STEP_RANGE_PX = 22;
const WANDER_RADIUS_PX = 40;
// Mobile still wanders and flips which way it's facing, just over a smaller
// patch of ground — less screen to spare, and a full-size desktop-scale
// wander would cover most of a phone's width.
const STEP_RANGE_PX_MOBILE = 10;
const WANDER_RADIUS_PX_MOBILE = 18;
const ICON_SIZE_PX = 32;
const ICON_SIZE_PX_MOBILE = 22;
const EDGE_MARGIN_PX = 16;
// Sits near the bottom edge on mobile — the footer bar below (see the
// render) gives it a dedicated strip to stand in instead of floating loose
// over page content. Kept a bit clear of the true edge (not flush) since
// some phones' bottom gesture bar/home indicator overlaps the last few px
// of viewport and would otherwise clip the bunny and its mood bubble.
// A bit taller than the sprite + edge margin alone would need (22 + 12 =
// 34) so the bunny rests a little higher off the true bottom edge rather
// than flush against it — the extra 10px is pure breathing room, not
// needed for the hop-arc bounce (see @keyframes hop-arc in index.css),
// which stays well inside it.
const EDGE_MARGIN_PX_MOBILE = 22;
// Sized to the resting icon + its edge margin. Exported so app-shell.tsx
// can stack the mobile bottom nav directly above this strip (rather than
// duplicating the number) whenever it's showing.
export const FOOTER_HEIGHT_PX_MOBILE = 44;
const MOOD_MIN_MS = 7000;
const MOOD_MAX_MS = 12000;
// While awake (never while asleep), it climbs up a little book stack and
// reads for a while every so often — "at random every ~20s" via the same
// randomized-window pattern the mood loop above uses, rather than a
// metronomic fixed interval.
const READING_INTERVAL_MIN_MS = 16000;
const READING_INTERVAL_MAX_MS = 24000;
const READING_DURATION_MS = 10000;
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
  "Notice, don\'t react, dummy",
  "Kiss yourself",
  "discipline over feelings",
  "Do what u fear",
  "Just do your thing..whatever it is.",
  "Touch some grass",
  "Be there for someone : 3",
  "bounce back and learn :3",
  "Girl up Girl!"
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
  // Gimmicks are only meaningful under a skin (retro/kawaii/tryout) — same
  // rule apply-theme.ts already enforces for the CSS-driven gimmick
  // data-attributes (resetting to DEFAULT_GIMMICKS when no skin is active)
  // and IdleBunny already enforces for the topbar's mini bunny. This used to
  // check that too, until it was dropped in the Overview-tab refactor,
  // leaving a stale `bouncingBuddy: true` in storage (e.g. saved while Retro
  // was on) able to show the bunny — and its mobile footer bar — the moment
  // the app opens, even in plain light/dark mode with no skin on, and with
  // no way to turn it off since the "Retro gimmicks" section in Settings is
  // itself hidden whenever no skin is active.
  const active = (theme.retro || theme.kawaii || theme.tryout) && theme.gimmicks.bouncingBuddy;
  const Bunny = theme.kawaii ? KawaiiBunnyIcon : BunnyIcon;
  const [awake, setAwake] = useState(false);
  const [walking, setWalking] = useState(false);
  const [reading, setReading] = useState(false);
  // True only for the brief "hop off the book stack" window right before
  // reading actually ends — see stopReading below and .gimmick-hop-off.
  const [leaving, setLeaving] = useState(false);
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
  const readingTimeoutRef = useRef<number>();
  // Bridges the eating-exit's completion (reported from the JSX below, via
  // ReadingBunnyScene's onEatComplete) into the main effect's closure below,
  // where scheduleReading/step and their shared timeout refs actually live.
  const finishEatingRef = useRef<() => void>();
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
      setReading(false);
      setLeaving(false);
      window.clearTimeout(walkTimeoutRef.current);
    }

    function step() {
      if (!isAwakeRef.current) return;
      const stepRange = isMobile ? STEP_RANGE_PX_MOBILE : STEP_RANGE_PX;
      const wanderRadius = isMobile ? WANDER_RADIUS_PX_MOBILE : WANDER_RADIUS_PX;
      const home = homePosition(iconSize, edgeMargin);
      const delta = (Math.random() * 2 - 1) * stepRange;
      const proposedX = posRef.current.x + delta;
      const clampedToWander = Math.min(
        home.x + wanderRadius,
        Math.max(home.x - wanderRadius, proposedX),
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

    // Runs continuously the whole time this gimmick is on, same as the mood
    // loop — while asleep it just skips this cycle and checks again next
    // time, rather than needing to be separately kicked off on waking up.
    function scheduleReading() {
      const delay = READING_INTERVAL_MIN_MS + Math.random() * (READING_INTERVAL_MAX_MS - READING_INTERVAL_MIN_MS);
      readingTimeoutRef.current = window.setTimeout(startReading, delay);
    }

    function startReading() {
      if (!isAwakeRef.current) {
        scheduleReading();
        return;
      }
      // Sitting still to read, same as clicking pauses nothing else —
      // wandering just resumes on its own schedule once reading ends.
      window.clearTimeout(walkTimeoutRef.current);
      setWalking(false);
      setReading(true);
      readingTimeoutRef.current = window.setTimeout(stopReading, READING_DURATION_MS);
    }

    function stopReading() {
      // Starts the Kirby-style eating exit over the still-visible reading
      // scene (see ReadingBunnyScene's `eating` prop) instead of cutting
      // back to the plain bunny instantly. finishEating (called from the
      // JSX below via onEatComplete) does the actual swap-back once that
      // sequence reports it's done — under prefers-reduced-motion the
      // sequence itself completes on its first tick, so this still ends up
      // there almost immediately without a separate branch here.
      setLeaving(true);
    }

    finishEatingRef.current = function finishEating() {
      setReading(false);
      setLeaving(false);
      scheduleReading();
      if (isAwakeRef.current && !prefersReducedMotion) step();
    };

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
    // Fully re-home (not just clamp) the moment this effect re-runs — it
    // only reruns when iconSize/edgeMargin change, i.e. exactly when
    // isMobile flips (the mobile<->desktop devtools toggle). clampToViewport
    // alone isn't enough here: going mobile->desktop, the old mobile X is
    // already comfortably inside the much wider desktop bounds, so a plain
    // clamp leaves it stranded wherever mobile put it instead of snapping
    // back to the right edge — unlike Y, home X isn't a continuous function
    // of viewport width, it jumps with iconSize, so only a real breakpoint
    // change (not an ordinary same-breakpoint resize, handled by onResize's
    // gentler clamp below) should reset it outright.
    posRef.current = homePosition(iconSize, edgeMargin);
    applyTransform();
    // The old effect instance's cleanup (below) already cleared the
    // previous walkTimeoutRef, so if it was awake and mid-wander, nothing
    // would ever call step() again — resume the loop from home instead of
    // leaving it frozen there.
    if (isAwakeRef.current && !prefersReducedMotion) step();
    // Moods run continuously regardless of awake/asleep, for as long as this
    // gimmick is on — not gated on activity like the walking is.
    scheduleMood();
    scheduleReading();
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("message", onMessage);
      window.clearTimeout(asleepTimeoutRef.current);
      window.clearTimeout(walkTimeoutRef.current);
      window.clearTimeout(moodTimeoutRef.current);
      window.clearTimeout(heartEyesTimeoutRef.current);
      window.clearTimeout(readingTimeoutRef.current);
    };
  }, [active, iconSize, edgeMargin, isMobile]);

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
          className={`gimmick-mood-pop absolute right-full top-1/2 mr-3 max-w-[46vw] -translate-y-1/2 break-words rounded-2xl border-[3px] font-semibold sm:max-w-none sm:whitespace-nowrap sm:break-normal ${
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
          {reading ? (
            // Overflows the normal iconSize×iconSize box upward (the box
            // itself keeps tracking position/movement unchanged) so the
            // book stack reads as rising up from the ground the bunny is
            // already standing on, rather than resizing its hitbox. Once
            // `leaving`, switches to the Kirby-style eating exit — no
            // gimmick-climb-in there since that animation's own frozen
            // transform would otherwise fight the eat-bounce's for control
            // of the same CSS property. -translate-x-1/2 is applied as a
            // plain (non-animated) class throughout so centering holds up
            // in between the two — each animation's own keyframes include
            // translateX(-50%) too and take over for their duration, but
            // this is what centers it the rest of the time, including the
            // gap between them.
            <ReadingBunnyScene
              eating={leaving}
              onEatComplete={() => finishEatingRef.current?.()}
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${leaving ? "" : "gimmick-climb-in gimmick-idle-bob"}`}
              style={{ color: "var(--color-accent)", imageRendering: "pixelated", width: iconSize, height: iconSize * 2.25 }}
            />
          ) : (
            <>
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
            </>
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
