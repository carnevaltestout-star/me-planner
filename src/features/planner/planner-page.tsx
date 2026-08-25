import { useState } from "react";
import { dateKey, fmtRange, startOfWeek } from "@/lib/planner/planner-dates";
import { loadEvents, saveEvents } from "@/lib/planner/planner-storage";
import { loadPresets, savePresets } from "@/lib/planner/preset-storage";
import type { PlannerEvent, PlannerView } from "@/lib/planner/planner-types";
import { presetDurationHours, type EventPreset } from "@/lib/planner/preset-types";
import PlannerToolbar from "./planner-toolbar";
import PlannerGrid, { EVENT_DRAG_TYPE, EVENT_OCCURRENCE_DRAG_TYPE } from "./planner-grid";
import PresetBar from "./preset-bar";
import EventModal, { type EventModalInitial, type EventModalSaveData } from "./event-modal";
import DeleteConfirmDialog from "./delete-confirm-dialog";
import RoutinesDialog from "./routines-dialog";

type ModalState =
  | { mode: "create"; dateKey: string; occurrenceDate: string; start: number; end: number }
  | { mode: "edit"; event: PlannerEvent; occurrenceDate: string };

function getDays(view: PlannerView, anchor: Date): Date[] {
  if (view === "day") return [new Date(anchor)];
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function PlannerPage() {
  // Week view is cramped on a phone-width screen, so mobile starts on Day
  // instead — matches the app's usual md: (768px) mobile/desktop split.
  const [view, setView] = useState<PlannerView>(() => (window.innerWidth < 768 ? "day" : "week"));
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>(() => loadEvents());
  const [presets, setPresets] = useState<EventPreset[]>(() => loadPresets());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ event: PlannerEvent; occurrenceDate: string } | null>(null);
  const [routinesOpen, setRoutinesOpen] = useState(false);

  const rangeLabel = fmtRange(getDays(view, anchor));

  function persistPresets(next: EventPreset[]) {
    setPresets(next);
    savePresets(next);
  }

  function reorderPresets(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const fromIndex = presets.findIndex((p) => p.id === draggedId);
    const toIndex = presets.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...presets];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persistPresets(next);
  }

  // Start always comes from wherever the preset was dropped (or, for a
  // tap-to-quick-add, the current half-hour) — only the *duration* comes
  // from the preset itself, defaulting to 1 hour if it doesn't set one.
  function addEventFromPreset(preset: EventPreset, key: string, startHour: number) {
    const start = startHour;
    const end = Math.min(24, start + presetDurationHours(preset));
    persist([
      ...events,
      { id: crypto.randomUUID(), dateKey: key, title: preset.title, notes: "", start, end, repeat: "none", color: preset.color, priority: preset.priority, exceptions: [] },
    ]);
  }

  function currentHalfHour(): number {
    const now = new Date();
    return now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0);
  }

  function goPrev() {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth(), a.getDate() - (view === "day" ? 1 : 7)));
  }

  function goNext() {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth(), a.getDate() + (view === "day" ? 1 : 7)));
  }

  function persist(next: PlannerEvent[]) {
    setEvents(next);
    saveEvents(next);
  }

  // Shared by the edit modal's own Delete button and the grid block's
  // hover trash-can icon — a repeating event always confirms which scope
  // to delete (matches the drag-to-move behavior's "just this occurrence"
  // framing); a one-off event deletes immediately.
  function requestDelete(event: PlannerEvent, occurrenceDate: string) {
    if (event.repeat !== "none") {
      setPendingDelete({ event, occurrenceDate });
    } else {
      persist(events.filter((ev) => ev.id !== event.id));
      setModal(null);
    }
  }

  // Dragging an event block out of the grid entirely (dropped on the
  // toolbar, the preset bar, or anywhere else that isn't an hour cell)
  // deletes it — same confirm-or-immediate rule as any other delete.
  function handleDragOutDelete(eventId: string, occurrenceDate: string) {
    const ev = events.find((e) => e.id === eventId);
    if (ev) requestDelete(ev, occurrenceDate);
  }

  // Dragging a plain event just moves it in place (same duration, new
  // date/start). Dragging one occurrence of a *repeating* event instead
  // detaches that single occurrence — the original series gets an
  // exception on the date it was dragged from (same mechanism as "delete
  // just this occurrence"), and a new one-off event is created at the
  // dropped slot — so the rest of the series stays put.
  function handleEventDrop(eventId: string, occurrenceDate: string, newDateKey: string, hour: number) {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    if (newDateKey === occurrenceDate && hour === ev.start) return;
    const duration = ev.end - ev.start;
    const newStart = hour;
    const newEnd = Math.min(24, newStart + duration);
    if (ev.repeat === "none") {
      persist(events.map((e) => (e.id === eventId ? { ...e, dateKey: newDateKey, start: newStart, end: newEnd } : e)));
    } else {
      persist([
        ...events.map((e) => (e.id === eventId ? { ...e, exceptions: [...e.exceptions, occurrenceDate] } : e)),
        {
          id: crypto.randomUUID(),
          dateKey: newDateKey,
          title: ev.title,
          notes: ev.notes,
          start: newStart,
          end: newEnd,
          repeat: "none",
          color: ev.color,
          priority: ev.priority,
          exceptions: [],
        },
      ]);
    }
  }

  function handleCellClick(dateKey: string, hour: number) {
    setModal({ mode: "create", dateKey, occurrenceDate: dateKey, start: hour, end: Math.min(24, hour + 1) });
  }

  function handleBlockClick(event: PlannerEvent, occurrenceDate: string) {
    setModal({ mode: "edit", event, occurrenceDate });
  }

  function handleNewEvent() {
    const d = view === "day" ? anchor : new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setModal({ mode: "create", dateKey: key, occurrenceDate: key, start: 9, end: 10 });
  }

  function handleSave(data: EventModalSaveData) {
    if (!modal) return;
    if (modal.mode === "edit") {
      persist(events.map((ev) => (ev.id === modal.event.id ? { ...ev, ...data } : ev)));
    } else {
      persist([
        ...events,
        {
          id: crypto.randomUUID(),
          dateKey: modal.dateKey,
          exceptions: [],
          ...data,
        },
      ]);
    }
    setModal(null);
  }

  function handleDeleteRequest() {
    if (!modal || modal.mode !== "edit") return;
    requestDelete(modal.event, modal.occurrenceDate);
  }

  function handleDeleteAll() {
    if (!pendingDelete) return;
    persist(events.filter((ev) => ev.id !== pendingDelete.event.id));
    setPendingDelete(null);
    setModal(null);
  }

  function handleDeleteThisOccurrence() {
    if (!pendingDelete) return;
    persist(
      events.map((ev) =>
        ev.id === pendingDelete.event.id ? { ...ev, exceptions: [...ev.exceptions, pendingDelete.occurrenceDate] } : ev,
      ),
    );
    setPendingDelete(null);
    setModal(null);
  }

  const modalInitial: EventModalInitial | null =
    modal &&
    (modal.mode === "edit"
      ? {
          title: modal.event.title,
          notes: modal.event.notes,
          start: modal.event.start,
          end: modal.event.end,
          repeat: modal.event.repeat,
          color: modal.event.color,
          priority: modal.event.priority,
          occurrenceDate: modal.occurrenceDate,
        }
      : {
          title: "",
          notes: "",
          start: modal.start,
          end: modal.end,
          repeat: "none",
          color: "",
          priority: undefined,
          occurrenceDate: modal.occurrenceDate,
        });

  return (
    <div
      className="planner-checkerboard flex h-full flex-col gap-2 p-2 md:gap-4 md:p-4"
      // Catch-all for an event block dropped anywhere that isn't one of
      // PlannerGrid's own hour cells (those stopPropagation once they've
      // handled a drop themselves) — dragging a card out of the calendar
      // deletes it.
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(EVENT_DRAG_TYPE)) e.preventDefault();
      }}
      onDrop={(e) => {
        const eventId = e.dataTransfer.getData(EVENT_DRAG_TYPE);
        if (!eventId) return;
        e.preventDefault();
        handleDragOutDelete(eventId, e.dataTransfer.getData(EVENT_OCCURRENCE_DRAG_TYPE));
      }}
    >
      <PlannerToolbar
        view={view}
        onViewChange={setView}
        anchor={anchor}
        rangeLabel={rangeLabel}
        onToday={() => setAnchor(new Date())}
        onJumpToDate={setAnchor}
        onNewEvent={handleNewEvent}
        routinesOpen={routinesOpen}
        onToggleRoutines={() => setRoutinesOpen((o) => !o)}
      />

      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <PresetBar
            presets={presets}
            onAdd={(preset) => persistPresets([...presets, preset])}
            onUpdate={(preset) => persistPresets(presets.map((p) => (p.id === preset.id ? preset : p)))}
            onDelete={(id) => persistPresets(presets.filter((p) => p.id !== id))}
            onQuickAdd={(preset) => addEventFromPreset(preset, dateKey(new Date()), currentHalfHour())}
            onReorder={reorderPresets}
          />
        </div>
        <div className="inline-flex flex-shrink-0 overflow-hidden rounded-full border border-border">
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className="flex h-[24px] w-[24px] items-center justify-center border-r border-border bg-surface text-ink hover:bg-surface-alt md:h-[30px] md:w-[30px]"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className="flex h-[24px] w-[24px] items-center justify-center bg-surface text-ink hover:bg-surface-alt md:h-[30px] md:w-[30px]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PlannerGrid
          view={view}
          anchor={anchor}
          events={events}
          onCellClick={handleCellClick}
          onBlockClick={handleBlockClick}
          onPresetDrop={(presetId, key, hour) => {
            const preset = presets.find((p) => p.id === presetId);
            if (preset) addEventFromPreset(preset, key, hour);
          }}
          onEventDrop={handleEventDrop}
          onDeleteRequest={requestDelete}
        />
      </div>

      {modal && modalInitial && (
        <EventModal
          mode={modal.mode}
          initial={modalInitial}
          onSave={handleSave}
          onDelete={handleDeleteRequest}
          onClose={() => setModal(null)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          onCancel={() => setPendingDelete(null)}
          onDeleteThis={handleDeleteThisOccurrence}
          onDeleteAll={handleDeleteAll}
        />
      )}

      {routinesOpen && <RoutinesDialog onClose={() => setRoutinesOpen(false)} />}
    </div>
  );
}
