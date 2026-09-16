// Story Memory's content engine — deliberately separate from the game's UI
// component (story-memory-game.tsx) so the randomization algorithm and the
// story library can be reused/extended (e.g. a future "story stats" screen,
// or swapping in a bigger template library) without touching any rendering
// code.
import { pickRandom, randomInt, sampleN, shuffle } from "./rng";

export interface RecallFact {
  id: string;
  question: string;
  answer: string;
  choices: string[];
}

export interface GeneratedStory {
  text: string;
  facts: RecallFact[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "March", "April", "June", "July", "September", "October", "December"];
const TIMES = ["7:00 AM", "9:15 AM", "11:30 AM", "noon", "1:45 PM", "3:30 PM", "5:00 PM", "8:15 PM"];
const FOODS = ["apples", "bananas", "carrots", "mangoes", "potatoes", "tomatoes", "oranges", "onions", "strawberries", "cucumbers"];
const NAMES = ["Mia", "Noah", "Ava", "Liam", "Zoe", "Ethan", "Lena", "Omar", "Priya", "Kofi", "Sara", "Diego"];
const PLACES = ["park", "library", "train station", "market", "beach", "office", "school", "harbor", "museum", "garden"];
const COUNTRY_CAPITALS: { country: string; capital: string }[] = [
  { country: "France", capital: "Paris" },
  { country: "Japan", capital: "Tokyo" },
  { country: "Kenya", capital: "Nairobi" },
  { country: "Brazil", capital: "Brasília" },
  { country: "Norway", capital: "Oslo" },
  { country: "Egypt", capital: "Cairo" },
  { country: "Peru", capital: "Lima" },
  { country: "Thailand", capital: "Bangkok" },
];

function choicesFor(correct: string, pool: readonly string[]): string[] {
  const distractors = sampleN(
    pool.filter((v) => v !== correct),
    2,
  );
  return shuffle([correct, ...distractors]);
}

let factCounter = 0;
function nextFactId(): string {
  factCounter += 1;
  return `fact-${factCounter}`;
}

interface Sentence {
  text: string;
  facts: RecallFact[];
}

// Each template is a factory (not a static value) so every call re-rolls
// its own random tokens — that's the "detail randomization" the spec asks
// for: same sentence shape and cast of fact-types every time, different
// weekday/number/food/etc. underneath. Tagged with a fixed number of
// distinct 1-3 facts each, so the composer below can always hit an exact
// per-level fact-count target (the 1-fact templates act like a "1-cent
// coin" that always lets it land exactly).
const TEMPLATES: Array<() => Sentence> = [
  () => {
    const name = pickRandom(NAMES);
    const weekday = pickRandom(WEEKDAYS);
    return {
      text: `${name} always goes for a run on ${weekday}.`,
      facts: [{ id: nextFactId(), question: `Which day does ${name} go for a run?`, answer: weekday, choices: choicesFor(weekday, WEEKDAYS) }],
    };
  },
  () => {
    const time = pickRandom(TIMES);
    return {
      text: `The meeting is scheduled for ${time}.`,
      facts: [{ id: nextFactId(), question: "What time is the meeting scheduled for?", answer: time, choices: choicesFor(time, TIMES) }],
    };
  },
  () => {
    const month = pickRandom(MONTHS);
    const day = randomInt(2, 27);
    const dateLabel = `${month} ${day}`;
    return {
      text: `The trip will take place on ${dateLabel}.`,
      facts: [{ id: nextFactId(), question: "What date will the trip take place on?", answer: dateLabel, choices: choicesFor(dateLabel, MONTHS.map((m) => `${m} ${day}`)) }],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    return {
      text: `${name} was the one who organized the whole event.`,
      facts: [{ id: nextFactId(), question: "Who organized the event?", answer: name, choices: choicesFor(name, NAMES) }],
    };
  },
  () => {
    const count = randomInt(3, 24);
    return {
      text: `${count} people showed up to the gathering.`,
      facts: [
        {
          id: nextFactId(),
          question: "How many people showed up to the gathering?",
          answer: String(count),
          choices: choicesFor(String(count), [count - 2, count - 1, count + 1, count + 2].map(String)),
        },
      ],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    const count = randomInt(2, 9);
    const food = pickRandom(FOODS);
    return {
      text: `At the market, ${name} bought ${count} ${food}.`,
      facts: [
        { id: nextFactId(), question: `How many ${food} did ${name} buy?`, answer: String(count), choices: choicesFor(String(count), [count - 2, count - 1, count + 1, count + 2].map(String)) },
        { id: nextFactId(), question: `What did ${name} buy at the market?`, answer: food, choices: choicesFor(food, FOODS) },
      ],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    const { country, capital } = pickRandom(COUNTRY_CAPITALS);
    return {
      text: `${name} is planning a trip to ${country}, whose capital city is ${capital}.`,
      facts: [
        { id: nextFactId(), question: `Which country is ${name} traveling to?`, answer: country, choices: choicesFor(country, COUNTRY_CAPITALS.map((c) => c.country)) },
        { id: nextFactId(), question: `What is the capital of ${country}?`, answer: capital, choices: choicesFor(capital, COUNTRY_CAPITALS.map((c) => c.capital)) },
      ],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    const weekday = pickRandom(WEEKDAYS);
    const place = pickRandom(PLACES);
    return {
      text: `On ${weekday}, ${name} visited the ${place}.`,
      facts: [
        { id: nextFactId(), question: `Which day did ${name} visit the ${place}?`, answer: weekday, choices: choicesFor(weekday, WEEKDAYS) },
        { id: nextFactId(), question: `Where did ${name} go on ${weekday}?`, answer: place, choices: choicesFor(place, PLACES) },
      ],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    const time = pickRandom(TIMES);
    const weekday = pickRandom(WEEKDAYS);
    const place = pickRandom(PLACES);
    return {
      text: `At ${time} on ${weekday}, ${name} arrived at the ${place}.`,
      facts: [
        { id: nextFactId(), question: `What time did ${name} arrive?`, answer: time, choices: choicesFor(time, TIMES) },
        { id: nextFactId(), question: `Which day did ${name} arrive at the ${place}?`, answer: weekday, choices: choicesFor(weekday, WEEKDAYS) },
        { id: nextFactId(), question: `Where did ${name} arrive?`, answer: place, choices: choicesFor(place, PLACES) },
      ],
    };
  },
  () => {
    const name = pickRandom(NAMES);
    const count = randomInt(2, 9);
    const food = pickRandom(FOODS);
    const place = pickRandom(PLACES);
    return {
      text: `${name} brought ${count} ${food} to share at the ${place}.`,
      facts: [
        { id: nextFactId(), question: `How many ${food} did ${name} bring?`, answer: String(count), choices: choicesFor(String(count), [count - 2, count - 1, count + 1, count + 2].map(String)) },
        { id: nextFactId(), question: `What did ${name} bring to share?`, answer: food, choices: choicesFor(food, FOODS) },
        { id: nextFactId(), question: `Where did ${name} share the ${food}?`, answer: place, choices: choicesFor(place, PLACES) },
      ],
    };
  },
];

// Level 1 has 3 recallable facts; every level after that adds 2 more
// (level 2 = 5, level 3 = 7, ... level 20 = 41, level 30 = 61). This is the *pool* of
// facts embedded in the story — how much a player has to read and hold in
// mind — not how many questions get asked at the end (see pickQuizFacts).
export function factCountForLevel(level: number): number {
  return 3 + 2 * (Math.max(1, level) - 1);
}

// Composes sentences (each re-rolled fresh, see TEMPLATES above) until the
// embedded fact count reaches the level's target. Templates that would
// overshoot the remaining budget are skipped in favor of ones that fit —
// since 1-fact templates are always in the pool, this always lands on the
// exact target rather than over/undershooting.
export function generateStory(level: number): GeneratedStory {
  const target = factCountForLevel(level);
  let remaining = target;
  const sentences: string[] = [];
  const facts: RecallFact[] = [];
  let order = shuffle(TEMPLATES.map((_, i) => i));
  let cursor = 0;
  let guard = 0;

  while (remaining > 0 && guard < 400) {
    guard += 1;
    if (cursor >= order.length) {
      order = shuffle(TEMPLATES.map((_, i) => i));
      cursor = 0;
    }
    const templateIndex = order[cursor];
    cursor += 1;
    const sentence = TEMPLATES[templateIndex]();
    if (sentence.facts.length <= remaining) {
      sentences.push(sentence.text);
      facts.push(...sentence.facts);
      remaining -= sentence.facts.length;
    }
  }

  return { text: sentences.join(" "), facts };
}

// Every embedded fact gets quizzed — the question count scales with level
// exactly like factCountForLevel does (3 at level 1, +2 per level after),
// since it's quizzing the whole pool rather than a sample of it. Only the
// order is randomized.
export function pickQuizFacts(facts: RecallFact[]): RecallFact[] {
  return shuffle(facts);
}

// Custom uploads have no structured token data to draw facts from, so this
// takes a best-effort heuristic pass instead: numbers, weekday names, and
// capitalized words (skipping the very first word, which is always
// capitalized by sentence position rather than being a proper noun) become
// simple "which X appeared in the story" multiple-choice questions.
// Words too common/short to make a fair "did this appear in the story"
// question — almost any story contains several of these, so they wouldn't
// actually test whether the reader remembers anything specific.
const STOPWORDS = new Set([
  "the", "and", "that", "with", "have", "this", "from", "they", "were",
  "which", "their", "would", "there", "could", "about", "into", "then",
  "than", "when", "your", "just", "some", "them", "what", "very",
]);

// A quiz question is only fair if the wrong choices are genuinely absent
// from the story — otherwise "did this appear" has more than one right
// answer. Distractors are drawn from a large fixed word bank instead of the
// story's own remaining words, since a short story might not contain enough
// *other* words to safely rule out.
const GENERIC_DISTRACTOR_WORDS = [
  "garden", "window", "mountain", "silver", "quiet", "afternoon", "bicycle",
  "kitchen", "forest", "ocean", "letter", "candle", "market", "bridge",
  "harbor", "meadow", "thunder", "lantern", "corner", "valley",
  "whisper", "shadow", "pillow", "journey", "harvest", "blossom", "ribbon",
  "tunnel", "cabinet", "chimney", "factory", "hallway", "mirror", "curtain",
  "staircase", "courtyard", "fountain", "pavement", "sidewalk", "prairie",
  "glacier", "canyon", "plateau", "wetland", "marsh", "tundra", "savanna",
  "jungle", "whistle", "chisel", "anchor", "compass", "kettle", "teapot",
  "saucer", "cushion", "mattress", "wardrobe", "drawer", "shelf", "cupboard",
  "doormat", "porch", "balcony", "terrace", "veranda", "driveway", "mailbox",
  "lamppost", "alleyway", "crossroad", "highway", "pier", "dock", "wharf",
  "jetty", "lighthouse", "seashell", "coastline", "horizon", "meadowlark",
  "songbird", "sparrow", "acorn", "pinecone", "branch", "petal", "stream",
  "pebble", "thicket",
];

// Guarantees at least one fair quiz question for ANY non-trivial story,
// even a plain one with no numbers, weekdays, or capitalized names — those
// three specific checks above only fire when the story happens to contain
// that kind of detail, which an ordinary short story often doesn't (e.g.
// "the cat sat on the mat and fell asleep" has none of them). Without this,
// the quiz would end up with zero questions and the game would be stuck on
// a blank quiz screen — using someone's own story would silently break
// instead of "asking it the way it is".
function fallbackWordFacts(text: string, exclude: Set<string>, count: number): RecallFact[] {
  const seen = new Set<string>();
  const candidates = text
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ""))
    .filter((w) => {
      const lower = w.toLowerCase();
      if (w.length < 4 || STOPWORDS.has(lower) || exclude.has(lower)) return false;
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  return sampleN(candidates, Math.min(count, candidates.length)).map((w) => ({
    id: nextFactId(),
    question: "Which word appeared in the story?",
    answer: w,
    choices: choicesFor(w, GENERIC_DISTRACTOR_WORDS),
  }));
}

export function extractFactsFromCustomText(text: string): RecallFact[] {
  const facts: RecallFact[] = [];
  const usedWords = new Set<string>();

  const numbers = Array.from(new Set(text.match(/\b\d+\b/g) ?? [])).slice(0, 2);
  numbers.forEach((n) => {
    const num = Number(n);
    facts.push({
      id: nextFactId(),
      question: "Which number appeared in the story?",
      answer: n,
      choices: choicesFor(n, [num + 1, num + 2, Math.max(0, num - 1)].map(String)),
    });
  });

  const mentionedWeekdays = WEEKDAYS.filter((d) => text.includes(d));
  mentionedWeekdays.slice(0, 1).forEach((d) => {
    facts.push({ id: nextFactId(), question: "Which day was mentioned in the story?", answer: d, choices: choicesFor(d, WEEKDAYS) });
  });

  const words = text.split(/\s+/);
  const properNouns = Array.from(
    new Set(
      words
        .slice(1)
        .map((w) => w.replace(/[^A-Za-z]/g, ""))
        .filter((w) => w.length > 2 && /^[A-Z][a-z]+$/.test(w) && !WEEKDAYS.includes(w)),
    ),
  ).slice(0, 2);
  properNouns.forEach((w) => {
    usedWords.add(w.toLowerCase());
    const distractorPool = [...NAMES, ...PLACES, ...COUNTRY_CAPITALS.map((c) => c.country)];
    facts.push({ id: nextFactId(), question: "Which word was mentioned in the story?", answer: w, choices: choicesFor(w, distractorPool) });
  });

  if (facts.length < 2) {
    facts.push(...fallbackWordFacts(text, usedWords, 2 - facts.length));
  }

  return facts.slice(0, 4);
}
