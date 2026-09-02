// Shared content pools for Sequence Memory's word mode and Reverse Recall's
// number/letter/word/picture modes.

// Grown from 24 to 36 entries so higher levels (up to level 34 before
// Reverse Recall's word/picture modes need to fall back to repeats — see
// buildRoundItems in reverse-recall-game.tsx) draw from a genuinely bigger,
// more varied vocabulary instead of just reusing the same 24 nouns more
// often once levels got harder.
export const MEMORY_WORDS = [
  "apple", "train", "castle", "ocean", "guitar", "mountain", "river", "candle",
  "forest", "bridge", "pencil", "window", "garden", "rocket", "island", "lantern",
  "harbor", "meadow", "compass", "thunder", "blanket", "orchard", "canyon", "feather",
  "volcano", "dolphin", "diamond", "hammer", "telescope", "umbrella", "penguin", "cactus",
  "trumpet", "snail", "kite", "violin",
];

// Paired index-for-index with MEMORY_WORDS above — Reverse Recall's picture
// mode uses the matching word as each picture's sortable/announceable name.
export const MEMORY_PICTURES = [
  "🍎", "🚂", "🏰", "🌊", "🎸", "⛰️", "🏞️", "🕯️",
  "🌲", "🌉", "✏️", "🪟", "🌷", "🚀", "🏝️", "🏮",
  "⚓", "🦋", "🧭", "⚡", "🧣", "🍇", "🏔️", "🪶",
  "🌋", "🐬", "💎", "🔨", "🔭", "☂️", "🐧", "🌵",
  "🎺", "🐌", "🪁", "🎻",
];

// B/C/D/F/G/H/J/K/L/M/N/P/Q/R/S/T/V/W/X/Y/Z — vowels A/E/I/O/U excluded,
// same convention most N-Back implementations use so letters don't sound
// alike when read aloud and are visually easy to tell apart at a glance.
// All 21 consonants are included (not just a subset) so Reverse Recall's
// letter mode has as much unique-symbol headroom as possible before it has
// to fall back to repeating letters at high levels — see buildRoundItems in
// reverse-recall-game.tsx.
export const CONSONANT_LETTERS = [
  "B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z",
];

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
