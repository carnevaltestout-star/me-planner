import { useEffect, useRef, useState, type SVGProps } from "react";

type Bitmap = string[];
interface Layer {
  grid: Bitmap;
  color: string;
}

// Same cell size as the app's other pixel-glyph icons (kawaii-icons.tsx's
// pixelGlyph: 20 / 8 = 2.5), just applied to a taller-than-wide canvas
// instead of the usual 8×8 square, since the book stack needs the extra
// height below the bunny.
const CELL = 2.5;
const COLS = 8;
const ROWS = 18;

// Sitting pose, ported from the animation-prompts mockup: shoulders (row
// 10) narrower than the arms row below (row 11) so the paws visibly poke
// out past the shoulders gripping the book, same as there.
const READ_POSE: Bitmap = [
  "00000000", "00000000", "00000000", "00000000",
  "00100100", "00100100", "00111100", "01111110",
  "11111111", "11011011", "01111110", "11111111",
];
// Eyes shift within row 9 (the same row's "gap" pixels the looking-around
// idle animation uses) so it visibly reads as scanning left/right across
// the page rather than staring fixed at one point the whole time.
function withEyeRow(pattern: string): Bitmap {
  const g = READ_POSE.slice();
  g[9] = pattern;
  return g;
}
const READ_EYE_CENTER = READ_POSE;
const READ_EYE_LEFT = withEyeRow("10110111");
const READ_EYE_RIGHT = withEyeRow("11101101");

// Two rows tall (not one) so it reads as an actual book rather than a
// sliver, with a small tab at row 9 poking up near the chin. The "turn"
// variant shifts and re-shapes both rows — an occasional page flip amid
// the steady reading, not just a static prop.
const HELD_BOOK_FLAT: Bitmap = [
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00011000", "00111100", "00111100",
];
const HELD_BOOK_TURN: Bitmap = [
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00011000", "00011110", "00111100",
];
const HELD_BOOK_CREASE_FLAT: Bitmap = [
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00010000", "00010000",
];
const HELD_BOOK_CREASE_TURN: Bitmap = [
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00000000", "00000000",
  "00000000", "00000000", "00001000", "00010000",
];
// Each book is 2 rows tall (a highlight row + a base row) so it reads as a
// rectangular book rather than a thin stripe, with a dark seam between
// each book and a matching vertical spine shadow down the side — same
// divider color for both, so the horizontal and vertical dividers match.
// This part of the scene is static — only the eyes and the held book cycle.
const BOOK_DIVIDER = "#4a2f22";
function bookRow(index: number, pattern: string): Bitmap {
  const g = Array(ROWS).fill("00000000");
  g[index] = pattern;
  return g;
}
const BOOK_TOP_HI = bookRow(12, "01111110");
const BOOK_TOP_BASE = bookRow(13, "01111110");
const BOOK_SEAM_1 = bookRow(14, "01111110");
const BOOK_MID = bookRow(15, "01111110");
const BOOK_SEAM_2 = bookRow(16, "01111110");
const BOOK_BOTTOM = bookRow(17, "01111110");
const BOOK_SPINE: Bitmap = Array(ROWS).fill("00000000");
[12, 13, 15, 17].forEach((r) => (BOOK_SPINE[r] = "01000000"));

const BOOK_STACK_LAYERS: Layer[] = [
  { grid: BOOK_TOP_HI, color: "color-mix(in srgb, #d9b98a 60%, white)" },
  { grid: BOOK_TOP_BASE, color: "#d9b98a" },
  { grid: BOOK_SEAM_1, color: BOOK_DIVIDER },
  { grid: BOOK_MID, color: "#3f8f6f" },
  { grid: BOOK_SEAM_2, color: BOOK_DIVIDER },
  { grid: BOOK_BOTTOM, color: "#7a2748" },
  { grid: BOOK_SPINE, color: BOOK_DIVIDER },
];
function spineWithMarks(rows: number[]): Bitmap {
  const g = Array(ROWS).fill("00000000");
  rows.forEach((r) => (g[r] = "01000000"));
  return g;
}
// The three books disappearing one at a time from the top down (closest to
// the bunny's mouth first) instead of the whole stack cutting out at once
// — see EAT_STAGES below, which pairs each of these with an open-mouth mark
// on the bunny itself, for the "Kirby inhale" exit.
const BOOKS_AFTER_TOP_EATEN: Layer[] = [
  { grid: BOOK_MID, color: "#3f8f6f" },
  { grid: BOOK_SEAM_2, color: BOOK_DIVIDER },
  { grid: BOOK_BOTTOM, color: "#7a2748" },
  { grid: spineWithMarks([15, 17]), color: BOOK_DIVIDER },
];
const BOOKS_AFTER_MID_EATEN: Layer[] = [
  { grid: BOOK_BOTTOM, color: "#7a2748" },
  { grid: spineWithMarks([17]), color: BOOK_DIVIDER },
];
const NO_BOOK: Bitmap = Array(12).fill("00000000");

// Eyes center/left/center/right on a steady rhythm (as if reading across a
// line of text), with an occasional quick page-turn thrown in — same
// timing/shape choices already validated in the animation-prompts mockup.
const FRAMES: { bunny: Bitmap; book: Bitmap; crease: Bitmap; ms: number }[] = [
  { bunny: READ_EYE_CENTER, book: HELD_BOOK_FLAT, crease: HELD_BOOK_CREASE_FLAT, ms: 900 },
  { bunny: READ_EYE_LEFT, book: HELD_BOOK_FLAT, crease: HELD_BOOK_CREASE_FLAT, ms: 700 },
  { bunny: READ_EYE_CENTER, book: HELD_BOOK_FLAT, crease: HELD_BOOK_CREASE_FLAT, ms: 900 },
  { bunny: READ_EYE_RIGHT, book: HELD_BOOK_FLAT, crease: HELD_BOOK_CREASE_FLAT, ms: 700 },
  { bunny: READ_EYE_CENTER, book: HELD_BOOK_TURN, crease: HELD_BOOK_CREASE_TURN, ms: 220 },
];

// The Kirby-style exit: the held book goes first (already right at its
// chin), then the stack disappears one book at a time from the top down,
// ending on a little satisfied gulp/bounce — instead of the whole scene
// just cutting or sliding away. onEatComplete (below) fires once this
// finishes, so the caller knows exactly when it's safe to swap back to the
// plain bunny rather than guessing a matching timeout duration.
const EAT_STAGES: { book: Bitmap; crease: Bitmap; stack: Layer[]; bounce?: boolean; ms: number }[] = [
  { book: NO_BOOK, crease: NO_BOOK, stack: BOOK_STACK_LAYERS, ms: 130 },
  { book: NO_BOOK, crease: NO_BOOK, stack: BOOKS_AFTER_TOP_EATEN, ms: 130 },
  { book: NO_BOOK, crease: NO_BOOK, stack: BOOKS_AFTER_MID_EATEN, ms: 130 },
  { book: NO_BOOK, crease: NO_BOOK, stack: [], bounce: true, ms: 160 },
];

function renderLayers(layers: Layer[]) {
  return layers.map(({ grid, color }, i) => (
    <g key={i} style={{ fill: color }}>
      {grid.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "1" ? <rect key={`${x},${y}`} x={x * CELL} y={y * CELL} width={CELL} height={CELL} /> : null,
        ),
      )}
    </g>
  ));
}

interface ReadingBunnySceneProps extends SVGProps<SVGSVGElement> {
  // Switches from the looping reading cycle to the one-shot Kirby-style
  // eating sequence (see EAT_STAGES) — set true for PetBunny's brief exit
  // window, then back to false/omitted once onEatComplete fires.
  eating?: boolean;
  onEatComplete?: () => void;
}

// The bunny sitting on a small book stack, reading — PetBunny's "reading
// mode" state. Cycles its own eyes (scanning across the page) and the held
// book's shape (an occasional page turn) on a self-contained timer, same
// frame data as the animation-prompts mockup's shot #21. Only the bunny
// layer uses currentColor (so it still follows the accent color the way
// BunnyIcon does); the books keep their own fixed colors regardless of
// theme, same as the mockup. When `eating`, plays the exit sequence
// instead and reports back via onEatComplete when it's done.
export default function ReadingBunnyScene({ eating, onEatComplete, className, ...props }: ReadingBunnySceneProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [eatStageIndex, setEatStageIndex] = useState(0);
  const timeoutRef = useRef<number>();
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // The looping reading cycle — paused entirely while eating (that has its
  // own effect below driving a one-shot sequence instead of a loop).
  useEffect(() => {
    if (eating || reducedMotionRef.current) return;
    function advance() {
      setFrameIndex((i) => (i + 1) % FRAMES.length);
    }
    timeoutRef.current = window.setTimeout(advance, FRAMES[frameIndex].ms);
    return () => window.clearTimeout(timeoutRef.current);
  }, [eating, frameIndex]);

  // The eating sequence — resets to the first stage whenever `eating` turns
  // on, then advances once per stage until it calls onEatComplete instead
  // of looping.
  useEffect(() => {
    if (!eating) return;
    setEatStageIndex(0);
    if (reducedMotionRef.current) {
      onEatComplete?.();
      return;
    }
    let i = 0;
    function advance() {
      i += 1;
      if (i >= EAT_STAGES.length) {
        onEatComplete?.();
        return;
      }
      setEatStageIndex(i);
      timeoutRef.current = window.setTimeout(advance, EAT_STAGES[i].ms);
    }
    timeoutRef.current = window.setTimeout(advance, EAT_STAGES[0].ms);
    return () => window.clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eating]);

  let layers: Layer[];
  let stageClassName = "";
  if (eating) {
    const stage = EAT_STAGES[eatStageIndex];
    layers = [
      ...stage.stack,
      { grid: READ_EYE_CENTER, color: "currentColor" },
      { grid: stage.book, color: "#fdf6ec" },
      { grid: stage.crease, color: "color-mix(in srgb, #fdf6ec 70%, black)" },
    ];
    if (stage.bounce) stageClassName = "gimmick-eat-bounce";
  } else {
    const frame = FRAMES[frameIndex];
    layers = [
      ...BOOK_STACK_LAYERS,
      { grid: frame.bunny, color: "currentColor" },
      { grid: frame.book, color: "#fdf6ec" },
      { grid: frame.crease, color: "color-mix(in srgb, #fdf6ec 70%, black)" },
    ];
  }

  return (
    <svg viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`} className={[className, stageClassName].filter(Boolean).join(" ")} {...props}>
      {renderLayers(layers)}
    </svg>
  );
}
