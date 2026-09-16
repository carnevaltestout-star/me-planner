import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSetting } from "@/lib/db/use-setting";
import { DEFAULT_MUSIC_SETTINGS, MUSIC_SETTINGS_KEY, normalizeMusicSettings } from "@/lib/music/music-storage";
import { MUSIC_TRACKS } from "@/lib/music/music-types";
import { MusicContext, MusicActionsContext } from "./music-context";

// Mounted once at the app root (see App.tsx), above the router, so the
// underlying <audio> element survives every tab switch/route change
// instead of restarting whenever a page remounts.
export default function MusicProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useSetting(MUSIC_SETTINGS_KEY, DEFAULT_MUSIC_SETTINGS, normalizeMusicSettings);
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
      setSettings((s) => ({ ...s, trackIndex: (s.trackIndex + 1) % MUSIC_TRACKS.length }));
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

  const toggle = useCallback(() => {
    setSettings((s) => ({ ...s, enabled: !s.enabled }));
  }, [setSettings]);

  const next = useCallback(() => {
    setSettings((s) => ({ ...s, trackIndex: (s.trackIndex + 1) % MUSIC_TRACKS.length }));
  }, [setSettings]);

  const prev = useCallback(() => {
    setSettings((s) => ({ ...s, trackIndex: (s.trackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length }));
  }, [setSettings]);

  return (
    <MusicContext.Provider value={{ enabled: settings.enabled, isPlaying, trackIndex: settings.trackIndex }}>
      <MusicActionsContext.Provider value={{ toggle, next, prev }}>{children}</MusicActionsContext.Provider>
    </MusicContext.Provider>
  );
}
