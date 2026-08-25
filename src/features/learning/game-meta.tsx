import type { ComponentType, SVGProps } from "react";
import type { GameId } from "@/lib/learning/learning-types";
import { NBackIcon, ReverseRecallIcon, SequenceMemoryIcon, SpatialMemoryIcon, StoryMemoryIcon } from "./learning-icons";

export interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Shared by the Brain Training tab itself and every other entry point that
// links straight into a specific game (the Dashboard preview card, the
// Overview daily-agenda section) — one list instead of each place inventing
// its own titles/descriptions.
export const GAME_META: GameMeta[] = [
  { id: "sequence-memory", title: "Sequence Memory", description: "Watch the sequence, then tap it back in order.", icon: SequenceMemoryIcon },
  { id: "reverse-recall", title: "Reverse Recall", description: "Memorize the list, then rebuild it reversed or sorted.", icon: ReverseRecallIcon },
  { id: "story-memory", title: "Story Memory", description: "Read a short story, wait it out, then answer questions.", icon: StoryMemoryIcon },
  { id: "spatial-memory", title: "Spatial Memory", description: "Remember which cells lit up all at once.", icon: SpatialMemoryIcon },
  { id: "n-back", title: "N-Back", description: "Tap when the current letter matches N steps back.", icon: NBackIcon },
];
