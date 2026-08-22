import { addDaysToKey, todayKey, type VocabWord } from "./vocab-types";

// Simplified SM-2-style scheduling: correct answers grow the interval
// (roughly x2.2, minimum +1 day), wrong answers reset it to 1 day so the
// word comes back up tomorrow. mistakeCount never resets — it's the
// running "how often has this been missed, ever" signal used to
// prioritize which due words surface first in a session.
export function gradeWord(word: VocabWord, correct: boolean) {
  const srs = word.srs;
  srs.isNew = false;
  if (correct) {
    srs.correctCount++;
    srs.interval = srs.interval <= 0 ? 1 : Math.max(srs.interval + 1, Math.round(srs.interval * 2.2));
  } else {
    srs.mistakeCount++;
    srs.interval = 1;
  }
  srs.dueDate = addDaysToKey(todayKey(), srs.interval);
}

export function isWordDue(word: VocabWord): boolean {
  return word.srs.isNew || word.srs.dueDate <= todayKey();
}

// Frequently-missed due words first, then other due words, oldest-due first.
export function buildSessionQueue(words: VocabWord[], cap = 20): VocabWord[] {
  const due = words.filter(isWordDue);
  due.sort((a, b) => b.srs.mistakeCount - a.srs.mistakeCount || (a.srs.dueDate < b.srs.dueDate ? -1 : 1));
  return due.slice(0, cap);
}
