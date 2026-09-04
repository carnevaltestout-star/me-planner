import { DEFAULT_MUSIC_SETTINGS, MUSIC_TRACKS, type MusicSettings } from "./music-types";

export const MUSIC_STORAGE_KEY = "me-planner:music";

export function loadMusicSettings(): MusicSettings {
  const raw = window.localStorage.getItem(MUSIC_STORAGE_KEY);
  if (!raw) return DEFAULT_MUSIC_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    const trackIndex = Number.isInteger(parsed.trackIndex) ? parsed.trackIndex : 0;
    return {
      enabled: Boolean(parsed.enabled),
      trackIndex: trackIndex >= 0 && trackIndex < MUSIC_TRACKS.length ? trackIndex : 0,
    };
  } catch {
    return DEFAULT_MUSIC_SETTINGS;
  }
}

export function saveMusicSettings(settings: MusicSettings) {
  window.localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(settings));
}
