import { useMemo, useState, type ReactNode } from "react";
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@/components/theme-provider/theme-context";
import { loadEntries } from "@/lib/journal/journal-storage";
import { PRINCIPLE_TYPES, type PrincipleType } from "@/lib/journal/journal-types";
import { loadPrinciples, savePrinciples } from "@/lib/principles/principle-storage";
import { createPrinciple, type Principle } from "@/lib/principles/principle-types";
import { loadRoutineIconSettings, saveRoutineIconSettings } from "@/lib/principles/routine-icon-storage";
import { loadRoutines, saveRoutines } from "@/lib/principles/routine-storage";
import type { RoutineIconPalette, RoutineIconShape, RoutineKey } from "@/lib/principles/routine-types";
import { matchesDateQuery } from "@/lib/search/date-search";
import { loadEnergyNotes, saveEnergyNotes } from "@/lib/trackers/energy-note-storage";
import { PaletteIcon, PrincipleBunnyIcon } from "./principle-icons";
import RoutineCard from "./routine-card";
import RoutineIconPickerDialog from "./routine-icon-picker-dialog";
import PrincipleCard from "./principle-card";
import AddPrincipleDialog from "./add-principle-dialog";

// Principles saved from the Journal's "What new thing did I learn?" ->
// Principle checkbox show up here too, filed under whichever type was
// chosen there — this is a live view over Journal's own storage, not a
// copy, so toggling/untoggling the checkbox there is reflected here without
// any sync step.
function journalDerivedPrinciples(): Principle[] {
  const entries = loadEntries();
  return Object.values(entries)
    .filter((e) => e.isPrinciple && e.learned.trim())
    .map((e) => ({
      id: `journal-${e.dateKey}`,
      text: e.learned.trim(),
      type: e.principleType || "All",
      savedAt: `${e.dateKey}T00:00:00`,
      updatedAt: "",
      source: "journal" as const,
      // Not draggable (see the "disabled" sortable wrapper in the render),
      // but still needs an order on the same negated-timestamp scale as
      // real principles so it sorts correctly among them.
      order: -new Date(`${e.dateKey}T00:00:00`).getTime(),
    }));
}

// Same live-view idea as journalDerivedPrinciples, but for the Energy
// Tracker's Notes field — always filed under "Me" since that field never
// offers a manual type choice.
function energyDerivedPrinciples(): Principle[] {
  const notes = loadEnergyNotes();
  return Object.entries(notes)
    .filter(([, note]) => note.isPrinciple && note.text.trim())
    .map(([dateKey, note]) => ({
      id: `energy-${dateKey}`,
      text: note.text.trim(),
      type: "Me" as const,
      savedAt: `${dateKey}T00:00:00`,
      updatedAt: note.updatedAt,
      source: "tracker" as const,
      order: -new Date(`${dateKey}T00:00:00`).getTime(),
    }));
}

const ENERGY_ID_PREFIX = "energy-";

// No dedicated drag handle here (unlike SortableCard elsewhere) — the card
// already has a trash icon + type dropdown pinned to its own top-right
// corner, so a second control there would collide with them. Dragging from
// anywhere on the card works the same way book-reviews' whole-card drag
// does: the sensors' activation distance means a plain click/tap without
// real movement never starts a drag, so the card's own click-to-edit text,
// type select, and delete button all keep working untouched. Journal/
// tracker-derived cards pass disabled — not draggable themselves (there's
// nowhere to persist a custom order for them), but still registered as
// valid drop targets so a real principle can be dragged to a position
// between two derived ones.
function SortablePrincipleCard({ id, disabled, children }: { id: string; disabled: boolean; children: ReactNode }) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      className={disabled ? undefined : isDragging ? "cursor-grabbing" : "cursor-grab"}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : undefined,
        touchAction: disabled ? undefined : "none",
      }}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      {children}
    </div>
  );
}

export default function PrinciplesPage() {
  const theme = useTheme();
  const showBunny = theme.retro || theme.kawaii;

  const [routines, setRoutines] = useState(() => loadRoutines());
  const [iconSettings, setIconSettings] = useState(() => loadRoutineIconSettings());
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [principles, setPrinciples] = useState(() => loadPrinciples());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PrincipleType>("All");
  const [query, setQuery] = useState("");
  // Editing/deleting a tracker-derived principle writes straight through to
  // Energy Tracker's own note storage rather than through setPrinciples, so
  // this is bumped afterward to force allPrinciples to recompute and pick
  // the change up.
  const [derivedRefresh, setDerivedRefresh] = useState(0);

  function persistRoutines(next: typeof routines) {
    setRoutines(next);
    saveRoutines(next);
  }

  function addRoutineItem(key: RoutineKey, text: string) {
    persistRoutines({ ...routines, [key]: [...routines[key], text] });
  }

  function removeRoutineItem(key: RoutineKey, index: number) {
    persistRoutines({ ...routines, [key]: routines[key].filter((_, i) => i !== index) });
  }

  function editRoutineItem(key: RoutineKey, index: number, text: string) {
    persistRoutines({ ...routines, [key]: routines[key].map((item, i) => (i === index ? text : item)) });
  }

  function changeIconShape(shape: RoutineIconShape) {
    const next = { ...iconSettings, shape };
    setIconSettings(next);
    saveRoutineIconSettings(next);
  }

  function changeIconPalette(palette: RoutineIconPalette) {
    const next = { ...iconSettings, palette };
    setIconSettings(next);
    saveRoutineIconSettings(next);
  }

  function handleAddPrinciple(text: string, type: PrincipleType) {
    const next = [createPrinciple(text, type), ...principles];
    setPrinciples(next);
    savePrinciples(next);
    setDialogOpen(false);
  }

  // Tracker-derived (type "Me") principles are a live view over Energy
  // Tracker's own note storage, same as journal-derived ones are over
  // Journal's — editing here writes the new text straight into that note
  // rather than forking off a separate copy.
  function handleEditPrinciple(id: string, text: string) {
    if (id.startsWith(ENERGY_ID_PREFIX)) {
      const dateKey = id.slice(ENERGY_ID_PREFIX.length);
      const notes = loadEnergyNotes();
      const existing = notes[dateKey];
      if (!existing) return;
      saveEnergyNotes({ ...notes, [dateKey]: { ...existing, text, updatedAt: new Date().toISOString() } });
      setDerivedRefresh((t) => t + 1);
      return;
    }
    const next = principles.map((p) => (p.id === id ? { ...p, text, updatedAt: new Date().toISOString() } : p));
    setPrinciples(next);
    savePrinciples(next);
  }

  // Only meaningful for manually-created principles — tracker-derived ones
  // are always filed as "Me" with nowhere in EnergyNote to store a
  // different type, and journal-derived ones aren't editable here at all.
  function handleChangePrincipleType(id: string, type: PrincipleType) {
    const next = principles.map((p) => (p.id === id ? { ...p, type, updatedAt: new Date().toISOString() } : p));
    setPrinciples(next);
    savePrinciples(next);
  }

  // "Delete" on a tracker-derived principle only unflags it as a
  // principle — the note itself is Energy Tracker's own data (still shown
  // there, still editable there), not something this tab owns and should
  // be able to erase outright the way it can for principles it does own.
  function handleDeletePrinciple(id: string) {
    if (id.startsWith(ENERGY_ID_PREFIX)) {
      const dateKey = id.slice(ENERGY_ID_PREFIX.length);
      const notes = loadEnergyNotes();
      const existing = notes[dateKey];
      if (!existing) return;
      saveEnergyNotes({ ...notes, [dateKey]: { ...existing, isPrinciple: false } });
      setDerivedRefresh((t) => t + 1);
      return;
    }
    const next = principles.filter((p) => p.id !== id);
    setPrinciples(next);
    savePrinciples(next);
  }

  const allPrinciples = useMemo(() => {
    return [...principles, ...journalDerivedPrinciples(), ...energyDerivedPrinciples()].sort((a, b) => a.order - b.order);
  }, [principles, derivedRefresh]);

  const filteredPrinciples = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPrinciples.filter((p) => {
      if (activeFilter !== "All" && p.type !== activeFilter) return false;
      if (!q) return true;
      const savedDate = new Date(p.savedAt);
      const dateLabel = savedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toLowerCase();
      return (
        p.text.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        dateLabel.includes(q) ||
        matchesDateQuery(savedDate, q)
      );
    });
  }, [allPrinciples, activeFilter, query]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // Interpolates a new order for the dragged card between its new
  // neighbors' order values instead of reassigning sequential indices —
  // see the "order" field comment in principle-types.ts for why sequential
  // indices would break future sorting against undragged (date-ordered)
  // cards.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredPrinciples.findIndex((p) => p.id === active.id);
    const newIndex = filteredPrinciples.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filteredPrinciples, oldIndex, newIndex);
    const idx = reordered.findIndex((p) => p.id === active.id);
    const prevOrder = reordered[idx - 1]?.order;
    const nextOrder = reordered[idx + 1]?.order;
    let newOrder: number;
    if (prevOrder !== undefined && nextOrder !== undefined) newOrder = (prevOrder + nextOrder) / 2;
    else if (prevOrder !== undefined) newOrder = prevOrder - 1000;
    else if (nextOrder !== undefined) newOrder = nextOrder + 1000;
    else newOrder = -Date.now();

    const next = principles.map((p) => (p.id === active.id ? { ...p, order: newOrder } : p));
    setPrinciples(next);
    savePrinciples(next);
  }

  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto p-2 md:gap-7 md:p-4">
      <div className="flex flex-col gap-3">
        <div className="relative flex items-center justify-center gap-2">
          {showBunny && (
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              aria-label="Change routine icon and color"
              title="Change routine icon and color"
              className="absolute left-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-theme hover:bg-surface-alt hover:text-accent"
            >
              <PaletteIcon className="h-4 w-4" />
            </button>
          )}
          {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
          <h1 className="m-0 text-base font-semibold text-ink">Routines</h1>
          {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <RoutineCard
            emoji="☀️"
            title="Morning Routine"
            placeholder="Add to your morning…"
            items={routines.morning}
            iconShape={iconSettings.shape}
            iconPalette={iconSettings.palette}
            onAdd={(text) => addRoutineItem("morning", text)}
            onRemove={(i) => removeRoutineItem("morning", i)}
            onEdit={(i, text) => editRoutineItem("morning", i, text)}
          />
          <RoutineCard
            emoji="🌙"
            title="Evening Routine"
            placeholder="Add to your evening…"
            items={routines.evening}
            iconShape={iconSettings.shape}
            iconPalette={iconSettings.palette}
            onAdd={(text) => addRoutineItem("evening", text)}
            onRemove={(i) => removeRoutineItem("evening", i)}
            onEdit={(i, text) => editRoutineItem("evening", i, text)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2">
          {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
          <h1 className="m-0 text-base font-semibold text-ink">Principles</h1>
          {showBunny && <PrincipleBunnyIcon className="h-5 w-5 text-accent" />}
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex-shrink-0 rounded-theme-sm border border-accent bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-contrast hover:brightness-105 sm:px-3.5 sm:py-2 sm:text-sm"
          >
            <span className="sm:hidden">+ Add</span>
            <span className="hidden sm:inline">+ Add Principle</span>
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, type, or date…"
              className="w-full rounded-full border border-border bg-surface px-2.5 py-1.5 pr-8 text-xs text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-accent sm:px-3.5 sm:py-2 sm:pr-9 sm:text-sm"
            />
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted sm:right-3 sm:h-4 sm:w-4"
            >
              <circle cx="8.3" cy="8.3" r="5.3" />
              <line x1="16" y1="16" x2="12.6" y2="12.6" />
            </svg>
          </div>
        </div>

        <div className="flex flex-nowrap gap-1 overflow-x-auto sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
          {PRINCIPLE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={activeFilter === t}
              onClick={() => setActiveFilter(t)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[0.62rem] sm:px-3 sm:py-1 sm:text-xs ${
                activeFilter === t ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface text-ink-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {filteredPrinciples.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No principles match yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredPrinciples.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2.5">
                {filteredPrinciples.map((p) => (
                  <SortablePrincipleCard key={p.id} id={p.id} disabled={Boolean(p.source)}>
                    <PrincipleCard
                      text={p.text}
                      type={p.type}
                      savedAt={p.savedAt}
                      updatedAt={p.updatedAt}
                      source={p.source}
                      onEdit={p.source === "journal" ? undefined : (text) => handleEditPrinciple(p.id, text)}
                      onDelete={p.source === "journal" ? undefined : () => handleDeletePrinciple(p.id)}
                      onChangeType={p.source ? undefined : (type) => handleChangePrincipleType(p.id, type)}
                    />
                  </SortablePrincipleCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {dialogOpen && <AddPrincipleDialog onClose={() => setDialogOpen(false)} onSave={handleAddPrinciple} />}

      {iconPickerOpen && (
        <RoutineIconPickerDialog
          shape={iconSettings.shape}
          palette={iconSettings.palette}
          onChangeShape={changeIconShape}
          onChangePalette={changeIconPalette}
          onClose={() => setIconPickerOpen(false)}
        />
      )}
    </div>
  );
}
