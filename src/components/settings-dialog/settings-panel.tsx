import { useState } from "react";
import { resolvesToDark } from "@/lib/theme/apply-theme";
import { useSetTheme, useTheme } from "@/components/theme-provider/theme-context";
import { KAWAII_ICON_PACKS, KawaiiBunnyIcon } from "@/components/kawaii-icons/kawaii-icons";
import { paletteKeyFor, type IconPackKey, type PaletteKey, type ThemeColors, type ThemeMode } from "@/lib/theme/theme-types";

const FAVORITES_STORAGE_KEY = "me-planner:favoriteColors";
const FAVORITES_MAX = 16;

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const PRESETS: { name: string; bg: string; accent: string; text: string }[] = [
  { name: "Muted lavender & cream", bg: "#fbf8f6", accent: "#8b6ba8", text: "#362e38" },
  { name: "Sage & warm neutral", bg: "#faf9f6", accent: "#5b8a72", text: "#33312c" },
  { name: "Dusty blue & sand", bg: "#f7f4ee", accent: "#5c7a99", text: "#33302a" },
  { name: "Pastel pink & cream", bg: "#fff7f5", accent: "#f4a6c1", text: "#4a3438" },
  { name: "Pastel mint & cream", bg: "#f5fbf7", accent: "#8fd9b6", text: "#2f4a3e" },
  { name: "Pastel peach & cream", bg: "#fff8f0", accent: "#f7b98c", text: "#4a362a" },
];

const SWATCH_DEFS: { key: keyof ThemeColors; label: string }[] = [
  { key: "sidenav", label: "Sidenav" },
  { key: "bg", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
];

const ICON_PACKS: { key: IconPackKey; name: string }[] = [
  { key: "classic", name: "Classic (no swap)" },
  { key: "bunny", name: "Bunny & friends" },
  { key: "sparkle", name: "Sparkle" },
  { key: "snacks", name: "Snacks" },
];

function loadFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[46px] flex-shrink-0 rounded-full border-[1.5px] transition-colors ${
        checked ? "border-accent bg-accent" : "border-border bg-border"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[2px] h-5 w-5 rounded-full bg-surface shadow-theme transition-transform"
        style={{ left: 2, transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-theme border border-border bg-surface-alt p-3 shadow-theme">
      <div className="flex flex-col gap-0.5">
        <strong className="text-sm text-ink">{title}</strong>
        <span className="text-xs text-ink-muted">{description}</span>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

// Real, live-applied React port of public/mockups/theme-system.html — no
// separate preview frame (the real app around this dialog already shows
// every change instantly), and no Save button (every control calls
// useSetTheme() directly, which persists as it goes — see ThemeProvider).
export default function SettingsPanel() {
  const theme = useTheme();
  const setTheme = useSetTheme();
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [lastSwatchKey, setLastSwatchKey] = useState<keyof ThemeColors>("accent");

  const dark = resolvesToDark(theme.mode);
  const paletteKey: PaletteKey = paletteKeyFor(theme.retro, dark);
  const palette = theme.palettes[paletteKey];
  // Kawaii's colors are fixed (not part of the palette system) — editing a
  // swatch while it's on would silently change a palette that isn't even
  // visible right now, so these sections grey out instead of pretending to
  // do something.
  const colorsDisabled = theme.kawaii;
  const showGimmicks = theme.retro || theme.kawaii;

  function persistFavorites(next: string[]) {
    setFavorites(next);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  }
  function addFavorite(color: string) {
    if (!color || favorites.includes(color)) return;
    persistFavorites([...favorites, color].slice(-FAVORITES_MAX));
  }
  function removeFavorite(color: string) {
    persistFavorites(favorites.filter((c) => c !== color));
  }

  function updatePaletteColor(key: keyof ThemeColors, value: string) {
    setTheme({ ...theme, palettes: { ...theme.palettes, [paletteKey]: { ...palette, [key]: value } } });
  }

  function applyPreset(p: (typeof PRESETS)[number]) {
    setTheme({
      ...theme,
      palettes: { ...theme.palettes, [paletteKey]: { ...palette, bg: p.bg, accent: p.accent, text: p.text } },
    });
  }

  function setMode(mode: ThemeMode) {
    setTheme({ ...theme, mode });
  }

  function setRetro(on: boolean) {
    setTheme({ ...theme, retro: on, kawaii: on ? false : theme.kawaii });
  }

  function setKawaii(on: boolean) {
    setTheme({ ...theme, kawaii: on, retro: on ? false : theme.retro });
  }

  function setGimmick(key: "starfield" | "pawDivider" | "bouncingBuddy", on: boolean) {
    setTheme({ ...theme, gimmicks: { ...theme.gimmicks, [key]: on } });
  }

  function setIconPack(key: IconPackKey) {
    setTheme({ ...theme, iconPack: key });
  }

  function isPresetActive(p: (typeof PRESETS)[number]) {
    return palette.bg === p.bg && palette.accent === p.accent && palette.text === p.text;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-5">
      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 text-sm font-semibold text-ink">Appearance</h2>
        <div className="inline-flex w-fit overflow-hidden rounded-theme border border-border">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={theme.mode === m.value}
              onClick={() => setMode(m.value)}
              className={`border-r border-border px-3.5 py-1.5 text-sm last:border-r-0 ${
                theme.mode === m.value ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted hover:bg-surface-alt"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className={`flex flex-col gap-2.5 ${colorsDisabled ? "opacity-45" : ""}`}>
        <h2 className="m-0 text-sm font-semibold text-ink">Palette presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={colorsDisabled}
              aria-pressed={isPresetActive(p)}
              onClick={() => applyPreset(p)}
              className={`flex items-center gap-2 rounded-theme border border-border bg-surface px-2.5 py-1.5 text-xs text-ink hover:bg-surface-alt disabled:cursor-not-allowed ${
                isPresetActive(p) ? "outline outline-2 outline-accent" : ""
              }`}
            >
              <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-black/10" style={{ background: p.accent }} />
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <section className={`flex flex-col gap-2.5 ${colorsDisabled ? "opacity-45" : ""}`}>
        <h2 className="m-0 text-sm font-semibold text-ink">Customize colors</h2>
        <p className="m-0 text-xs text-ink-muted">Overrides the preset. Applies instantly, everywhere — including Retro Mode.</p>
        <div className="flex flex-wrap gap-3.5">
          {SWATCH_DEFS.map((s) => (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <input
                type="color"
                disabled={colorsDisabled}
                value={palette[s.key]}
                onFocus={() => setLastSwatchKey(s.key)}
                onChange={(e) => updatePaletteColor(s.key, e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-theme border border-border p-0 disabled:cursor-not-allowed"
              />
              <div className="flex items-center gap-1">
                <label className="text-[0.7rem] text-ink-muted">{s.label}</label>
                <button
                  type="button"
                  disabled={colorsDisabled}
                  onClick={() => addFavorite(palette[s.key])}
                  title={`Save ${s.label} to favourites`}
                  aria-label={`Save ${s.label} to favourites`}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border text-[9px] text-ink-muted hover:border-accent hover:text-accent disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1.5 border-t border-dashed border-border pt-3">
          <p className="m-0 text-xs text-ink-muted">
            Favourites — save a color above, then click a favourite to apply it to the last color you picked (
            {SWATCH_DEFS.find((s) => s.key === lastSwatchKey)?.label}).
          </p>
          <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-theme border border-dashed border-border p-2.5">
            {favorites.length === 0 ? (
              <span className="text-xs text-ink-muted">No favourites yet.</span>
            ) : (
              favorites.map((color) => (
                <div key={color} className="group relative h-10 w-10 flex-shrink-0">
                  <button
                    type="button"
                    title={color}
                    disabled={colorsDisabled}
                    onClick={() => updatePaletteColor(lastSwatchKey, color)}
                    style={{ background: color }}
                    className="h-full w-full rounded-theme border border-border disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => removeFavorite(color)}
                    aria-label={`Remove favourite ${color}`}
                    className="absolute -right-1.5 -top-1.5 hidden h-[17px] w-[17px] items-center justify-center rounded-full border border-surface bg-ink-muted text-[10px] text-surface group-hover:flex"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <ToggleRow
        title="Retro Mode"
        description="Nerdy-cute 90s 8-bit look — pixel font, blocky icons, fixed palette"
        checked={theme.retro}
        onChange={setRetro}
      />

      <div className="flex flex-col gap-2.5">
        <ToggleRow
          title="✨ Super Kawaii Mode"
          description="Y2K desktop-widget look — gradient sky, window-chrome panels, floating stickers. Its own skin, so turning this on turns Retro off (and vice versa)."
          checked={theme.kawaii}
          onChange={setKawaii}
        />
        <div className="flex items-center gap-2.5 pl-1">
          <KawaiiBunnyIcon className="h-[30px] w-[30px] flex-shrink-0" style={{ color: "var(--color-accent)" }} />
          <span className="text-xs text-ink-muted">The bunny gets a blush + a bow on one ear while this is on.</span>
        </div>
      </div>

      {showGimmicks && (
        <section className="flex flex-col gap-2.5">
          <h2 className="m-0 text-sm font-semibold text-ink">Retro gimmicks</h2>
          <ToggleRow
            title="✨ Starfield background"
            description="Twinkling stars + shooting stars, drifting behind the whole app"
            checked={theme.gimmicks.starfield}
            onChange={(v) => setGimmick("starfield", v)}
          />
          <ToggleRow
            title="🐾 Paw-print divider"
            description="Sidebar/main-content divider becomes a strip of tiny pixel paws & stars"
            checked={theme.gimmicks.pawDivider}
            onChange={(v) => setGimmick("pawDivider", v)}
          />
          <ToggleRow
            title="🐰 Bunny buddy"
            description="An idle bunny sits next to the brand mark up top, and a sleepy bunny naps bottom-right — wakes & wanders a bit when it senses activity."
            checked={theme.gimmicks.bouncingBuddy}
            onChange={(v) => setGimmick("bouncingBuddy", v)}
          />
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 text-sm font-semibold text-ink">Icon pack (kawaii mode)</h2>
        <p className="m-0 text-xs text-ink-muted">
          Swaps the small icons used across every tab — nav, empty states, everywhere — for a matching cute pixel set.
          Independent of Retro Mode and the color palette; mix and match freely.
        </p>
        <div className="flex flex-wrap gap-2">
          {ICON_PACKS.map((pack) => {
            const icons = KAWAII_ICON_PACKS[pack.key];
            return (
              <button
                key={pack.key}
                type="button"
                aria-pressed={theme.iconPack === pack.key}
                onClick={() => setIconPack(pack.key)}
                className={`flex items-center gap-2 rounded-theme border border-border bg-surface px-2.5 py-1.5 text-xs text-ink hover:bg-surface-alt ${
                  theme.iconPack === pack.key ? "outline outline-2 outline-accent" : ""
                }`}
              >
                {icons && (
                  <span className="flex gap-0.5">
                    {icons.map((Icon, i) => (
                      <Icon key={i} className="h-3.5 w-3.5" style={{ color: "var(--color-accent)" }} />
                    ))}
                  </span>
                )}
                {pack.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
