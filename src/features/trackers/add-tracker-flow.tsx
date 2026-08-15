import { useState } from "react";
import { dateKey } from "@/lib/trackers/tracker-dates";
import { TRACKER_COLORS, TRACKER_ICON_KEYS, type Tracker, type TrackerIconKey } from "@/lib/trackers/tracker-types";
import TrackerIcon from "./tracker-icon";
import PeriodConfigModal from "./period-config-modal";

interface AddTrackerFlowProps {
  onClose: () => void;
  onCreate: (tracker: Tracker) => void;
  periodAlreadyAdded: boolean;
}

type Step = "presets" | "custom" | "period";

// Quick-start presets shown on the first screen. Adding another one later is
// just another entry here — name, icon (from the set already generated),
// and a default color; no new UI plumbing needed.
const QUICK_PRESETS: { label: string; icon: TrackerIconKey; color: string }[] = [
  { label: "Workout", icon: "running", color: "#5b8a72" },
];

export default function AddTrackerFlow({ onClose, onCreate, periodAlreadyAdded }: AddTrackerFlowProps) {
  const [step, setStep] = useState<Step>("presets");

  if (step === "period") {
    return <PeriodConfigModal onClose={onClose} onCreate={onCreate} />;
  }

  if (step === "custom") {
    return <CustomTrackerForm onClose={onClose} onCreate={onCreate} onBack={() => setStep("presets")} />;
  }

  function createInstant(preset: (typeof QUICK_PRESETS)[number]) {
    onCreate({
      id: crypto.randomUUID(),
      name: preset.label,
      color: preset.color,
      icon: preset.icon,
      kind: "boolean",
      createdAt: dateKey(new Date()),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[360px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <h2 className="m-0 text-base text-ink">Add tracker</h2>
        <p className="m-0 text-xs text-ink-muted">Pick a preset to start quickly, or build your own.</p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={periodAlreadyAdded}
            onClick={() => setStep("period")}
            title={periodAlreadyAdded ? "Already added — delete it first to re-add" : undefined}
            className={`flex flex-col items-center gap-1.5 rounded-theme border border-border p-3 text-center ${
              periodAlreadyAdded
                ? "cursor-not-allowed opacity-40"
                : "hover:border-accent hover:bg-surface-alt"
            }`}
          >
            <TrackerIcon icon="heart" className="h-6 w-6" style={{ color: periodAlreadyAdded ? undefined : "#c0392b" }} />
            <span className="text-sm font-semibold text-ink">Period</span>
          </button>

          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => createInstant(preset)}
              className="flex flex-col items-center gap-1.5 rounded-theme border border-border p-3 text-center hover:border-accent hover:bg-surface-alt"
            >
              <TrackerIcon icon={preset.icon} className="h-6 w-6" style={{ color: preset.color }} />
              <span className="text-sm font-semibold text-ink">{preset.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setStep("custom")}
            className="flex flex-col items-center gap-1.5 rounded-theme border border-dashed border-border p-3 text-center hover:border-accent hover:bg-surface-alt"
          >
            <span className="flex h-6 w-6 items-center justify-center text-lg text-ink-muted">+</span>
            <span className="text-sm font-semibold text-ink">Custom</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface CustomTrackerFormProps {
  onClose: () => void;
  onBack: () => void;
  onCreate: (tracker: Tracker) => void;
}

function CustomTrackerForm({ onClose, onBack, onCreate }: CustomTrackerFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<TrackerIconKey>(TRACKER_ICON_KEYS[0]);
  const [color, setColor] = useState(TRACKER_COLORS[0]);
  const [kind, setKind] = useState<"boolean" | "amount">("boolean");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }
    onCreate({
      id: crypto.randomUUID(),
      name: trimmed,
      color,
      icon,
      kind,
      createdAt: dateKey(new Date()),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full max-w-[360px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Custom tracker</h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-[1.1rem] py-3.5">
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What are you tracking?"
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">Type</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-pressed={kind === "boolean"}
                  onClick={() => setKind("boolean")}
                  className={`flex-1 rounded-theme-sm border px-2.5 py-1.5 text-xs ${
                    kind === "boolean" ? "border-ink font-semibold text-ink" : "border-border text-ink-muted hover:bg-surface-alt"
                  }`}
                >
                  Done
                </button>
                <button
                  type="button"
                  aria-pressed={kind === "amount"}
                  onClick={() => setKind("amount")}
                  className={`flex-1 rounded-theme-sm border px-2.5 py-1.5 text-xs ${
                    kind === "amount" ? "border-ink font-semibold text-ink" : "border-border text-ink-muted hover:bg-surface-alt"
                  }`}
                >
                  Amount
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">Icon</span>
              <div className="flex flex-wrap gap-1.5">
                {TRACKER_ICON_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={icon === key}
                    onClick={() => setIcon(key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-theme-sm border ${
                      icon === key ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-alt"
                    }`}
                  >
                    <TrackerIcon icon={key} className="h-[18px] w-[18px]" style={{ color }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">Color</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {TRACKER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={c === color}
                    onClick={() => setColor(c)}
                    style={{ background: c }}
                    className={`h-[26px] w-[26px] rounded-full border-2 ${c === color ? "border-ink" : "border-transparent"}`}
                  />
                ))}
                {/* Same native color input pattern as the theme settings
                    page's swatches — lets the person pick any color instead
                    of just the preset palette. */}
                <span className="relative h-[26px] w-[26px]">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Custom color"
                    title="Custom color"
                    className="h-[26px] w-[26px] cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference"
                  >
                    +
                  </span>
                </span>
              </div>
            </div>

            {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-border px-[1.1rem] py-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
