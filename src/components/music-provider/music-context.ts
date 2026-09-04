import { createContext, useContext } from "react";

export interface MusicState {
  enabled: boolean;
  // Reflects the actual <audio> element's play/pause events, not just
  // `enabled` — so the note only reads as "active" once playback has
  // genuinely started (matters if a browser blocks autoplay on load).
  isPlaying: boolean;
  trackIndex: number;
}

const DEFAULT_STATE: MusicState = { enabled: false, isPlaying: false, trackIndex: 0 };

export const MusicContext = createContext<MusicState>(DEFAULT_STATE);

export interface MusicActions {
  toggle: () => void;
  next: () => void;
  prev: () => void;
}

export const MusicActionsContext = createContext<MusicActions>({
  toggle: () => {},
  next: () => {},
  prev: () => {},
});

export function useMusic(): MusicState {
  return useContext(MusicContext);
}

export function useMusicActions(): MusicActions {
  return useContext(MusicActionsContext);
}
