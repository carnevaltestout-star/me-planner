import { DEFAULT_MUSIC_SETTINGS, MUSIC_TRACKS, type MusicSettings } from "./music-types";

export const MUSIC_SETTINGS_KEY = "music";

// Validates trackIndex bounds — same guard loadMusicSettings() used to
// apply reading straight out of localStorage — since a stored row could
// predate a track being removed from MUSIC_TRACKS.
export function normalizeMusicSettings(raw: unknown): MusicSettings {
  const parsed = (raw ?? {}) as Partial<MusicSettings>;
  const trackIndex = Number.isInteger(parsed.trackIndex) ? (parsed.trackIndex as number) : 0;
  return {
    enabled: Boolean(parsed.enabled),
    trackIndex: trackIndex >= 0 && trackIndex < MUSIC_TRACKS.length ? trackIndex : 0,
  };
}

export { DEFAULT_MUSIC_SETTINGS };
