import { useState, type KeyboardEvent } from "react";
import { ITEM_COLORS, PRIORITY_TINT_PERCENT, type ChecklistStep, type GoalPriority, type GoalTodoItem } from "@/lib/goals/goal-todo-types";

interface GoalTodoFormProps {
  item: GoalTodoItem;
  onClose: () => void;
  onSave: (item: GoalTodoItem) => void;
}

const inputClass =
  "w-full rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent";
const labelClass = "text-xs text-ink-muted";

const PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: 1, label: "1 · Highest" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4 · Lowest" },
];

export default function GoalTodoForm({ item, onClose, onSave }: GoalTodoFormProps) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [color, setColor] = useState(item.color);
  const [deadline, setDeadline] = useState(item.deadline);
  const [manualPercent, setManualPercent] = useState(item.manualPercent);
  const [priority, setPriority] = useState<GoalPriority | undefined>(item.priority);
  const [steps, setSteps] = useState<ChecklistStep[]>(item.steps);
  const [newStep, setNewStep] = useState("");
  const [error, setError] = useState("");

  const isGoal = item.kind === "goal";

  function addStep() {
    const text = newStep.trim();
    if (!text) return;
    setSteps((s) => [...s, { id: crypto.randomUUID(), text, done: false }]);
    setNewStep("");
  }

  function removeStep(id: string) {
    setSteps((s) => s.filter((step) => step.id !== id));
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give it a title.");
      return;
    }
    // A step typed into the "Add a step" field but never confirmed with
    // Enter/+ would otherwise just vanish on save — commit it too, same as
    // the other fields, instead of silently dropping whatever's mid-typing.
    const pendingStep = newStep.trim();
    const finalSteps = pendingStep ? [...steps, { id: crypto.randomUUID(), text: pendingStep, done: false }] : steps;
    onSave({
      ...item,
      title: trimmed,
      category: category.trim(),
      color,
      deadline,
      manualPercent,
      priority,
      steps: finalSteps,
    });
  }

  // Enter submits the whole form from Title/Category/Deadline, same as
  // hitting Save — but not from the "Add a step" field, which already uses
  // Enter for its own, narrower "add this step" action.
  function handleEnterSave(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
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
        className="flex max-h-[90dvh] w-full max-w-[380px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">{isGoal ? "Goal" : "To-Do"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-[1.1rem] py-3.5">
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleEnterSave}
                placeholder={isGoal ? "What are you working toward?" : "What needs doing?"}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={handleEnterSave}
                placeholder="Work, Health, Learning…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Deadline</span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                onKeyDown={handleEnterSave}
                className={inputClass}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Color</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {ITEM_COLORS.map((c) => (
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
                <span className="relative h-[26px] w-[26px]">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Custom color"
                    title="Custom color"
                    className="h-[26px] w-[26px] cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                    +
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Priority</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-pressed={priority === undefined}
                  onClick={() => setPriority(undefined)}
                  style={{ background: `color-mix(in srgb, ${color} 18%, var(--color-surface))` }}
                  className={`rounded-theme-sm border px-2.5 py-1.5 text-xs text-ink ${
                    priority === undefined ? "border-ink font-semibold" : "border-border hover:brightness-95"
                  }`}
                >
                  None
                </button>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={priority === p.value}
                    onClick={() => setPriority(p.value)}
                    style={{ background: `color-mix(in srgb, ${color} ${PRIORITY_TINT_PERCENT[p.value]}%, var(--color-surface))` }}
                    className={`rounded-theme-sm border px-2.5 py-1.5 text-xs text-ink ${
                      priority === p.value ? "border-ink font-semibold" : "border-border hover:brightness-95"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Steps (optional{isGoal ? " — drives progress automatically" : ""})
              </span>
              <div className="flex flex-col gap-1.5">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-1.5">
                    <span className="flex-1 truncate rounded-theme-sm border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink">{step.text}</span>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      aria-label={`Remove ${step.text}`}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStep();
                    }
                  }}
                  placeholder="Add a step"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addStep}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-theme-sm border border-accent text-accent hover:bg-accent-soft"
                >
                  +
                </button>
              </div>
            </div>

            {isGoal && steps.length === 0 && (
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Progress: {manualPercent}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={manualPercent}
                  onChange={(e) => setManualPercent(Number(e.target.value))}
                  style={{ accentColor: color }}
                />
              </label>
            )}

            {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
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
  );
}
