export interface MusicTrack {
  id: string;
  title: string;
  src: string;
}

// Fixed play order per the source files under public/music/ — skipping
// with the control's arrows just moves through this same list instead of
// picking randomly.
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "soft-gentle-pixel", title: "Soft Gentle Pixel", src: "/music/soft-gentle-pixel.mp3" },
  { id: "pop-suspense", title: "Pop Suspense", src: "/music/pop-suspense.mp3" },
  { id: "mellow-thinking", title: "Mellow Thinking", src: "/music/mellow-thinking.mp3" },
  { id: "upbeat-pixel", title: "Upbeat Pixel", src: "/music/upbeat-pixel.mp3" },
  { id: "energized-pixel-music", title: "Energized Pixel", src: "/music/energized-pixel-music.mp3" },
];

export interface MusicSettings {
  // Whether background music should be playing — persisted so turning it
  // off stays off across reloads/tab switches until explicitly turned back
  // on (never re-enables itself on its own).
  enabled: boolean;
  trackIndex: number;
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = { enabled: false, trackIndex: 0 };
