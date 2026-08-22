// Shared content pools for Sequence Memory's word mode and Reverse Recall's
// number/letter/word/picture modes.

export const MEMORY_WORDS = [
  "apple", "train", "castle", "ocean", "guitar", "mountain", "river", "candle",
  "forest", "bridge", "pencil", "window", "garden", "rocket", "island", "lantern",
  "harbor", "meadow", "compass", "thunder", "blanket", "orchard", "canyon", "feather",
];

// Paired index-for-index with MEMORY_WORDS above — Reverse Recall's picture
// mode uses the matching word as each picture's sortable/announceable name.
export const MEMORY_PICTURES = [
  "🍎", "🚂", "🏰", "🌊", "🎸", "⛰️", "🏞️", "🕯️",
  "🌲", "🌉", "✏️", "🪟", "🌷", "🚀", "🏝️", "🏮",
  "⚓", "🦋", "🧭", "⚡", "🧣", "🍇", "🏔️", "🪶",
];

// B/C/D/F/G/H/J/K/L/M/N/P/Q/R/S/T/V/W/X/Y/Z — vowels A/E/I/O/U excluded,
// same convention most N-Back implementations use so letters don't sound
// alike when read aloud and are visually easy to tell apart at a glance.
export const CONSONANT_LETTERS = ["B", "C", "D", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T", "V"];

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
