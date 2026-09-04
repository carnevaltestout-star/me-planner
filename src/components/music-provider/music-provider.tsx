import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { loadMusicSettings, saveMusicSettings, MUSIC_STORAGE_KEY } from "@/lib/music/music-storage";
import { MUSIC_TRACKS } from "@/lib/music/music-types";
import { MusicContext, MusicActionsContext } from "./music-context";

// Mounted once at the app root (see App.tsx), above the router, so the
// underlying <audio> element survives every tab switch/route change
// instead of restarting whenever a page remounts.
export default function MusicProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadMusicSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Advances to the next track (looping back to the first after the last)
  // whenever one finishes on its own — same fixed order the skip arrows move
  // through, so unattended playback just keeps cycling the whole list.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onEnded() {
      setSettings((s) => {
        const nextSettings = { ...s, trackIndex: (s.trackIndex + 1) % MUSIC_TRACKS.length };
        saveMusicSettings(nextSettings);
        return nextSettings;
      });
    }
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  // Swaps the source whenever the current track changes (initial mount
  // included) and keeps playing if music is currently turned on.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = MUSIC_TRACKS[settings.trackIndex];
    audio.src = track.src;
    if (settings.enabled) audio.play().catch(() => {});
  }, [settings.trackIndex]);

  // Autoplay on load only fires if the browser/webview allows it without a
  // prior user gesture — if blocked, `enabled` stays true (per storage) but
  // isPlaying stays false until the user interacts with the note again.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (settings.enabled) audio.play().catch(() => {});
    else audio.pause();
  }, [settings.enabled]);

  // Picks up a toggle/skip made from another tab/window of the same app.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === MUSIC_STORAGE_KEY) setSettings(loadMusicSettings());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, enabled: !s.enabled };
      saveMusicSettings(next);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    setSettings((s) => {
      const nextSettings = { ...s, trackIndex: (s.trackIndex + 1) % MUSIC_TRACKS.length };
      saveMusicSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  const prev = useCallback(() => {
    setSettings((s) => {
      const nextSettings = { ...s, trackIndex: (s.trackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length };
      saveMusicSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  return (
    <MusicContext.Provider value={{ enabled: settings.enabled, isPlaying, trackIndex: settings.trackIndex }}>
      <MusicActionsContext.Provider value={{ toggle, next, prev }}>{children}</MusicActionsContext.Provider>
    </MusicContext.Provider>
  );
}
