import { useState } from "react";
import { fmtRange, startOfWeek } from "@/lib/planner/planner-dates";
import { loadEvents, saveEvents } from "@/lib/planner/planner-storage";
import type { PlannerEvent, PlannerView } from "@/lib/planner/planner-types";
import PlannerToolbar from "./planner-toolbar";
import PlannerGrid from "./planner-grid";
import EventModal, { type EventModalInitial, type EventModalSaveData } from "./event-modal";
import DeleteConfirmDialog from "./delete-confirm-dialog";

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
  const [view, setView] = useState<PlannerView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>(() => loadEvents());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rangeLabel = fmtRange(getDays(view, anchor));

  function persist(next: PlannerEvent[]) {
    setEvents(next);
    saveEvents(next);
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
    if (modal.event.repeat !== "none") {
      setConfirmDeleteId(modal.event.id);
    } else {
      persist(events.filter((ev) => ev.id !== modal.event.id));
      setModal(null);
    }
  }

  function handleDeleteAll() {
    if (!modal || modal.mode !== "edit") return;
    persist(events.filter((ev) => ev.id !== modal.event.id));
    setConfirmDeleteId(null);
    setModal(null);
  }

  function handleDeleteThisOccurrence() {
    if (!modal || modal.mode !== "edit") return;
    persist(
      events.map((ev) =>
        ev.id === modal.event.id ? { ...ev, exceptions: [...ev.exceptions, modal.occurrenceDate] } : ev,
      ),
    );
    setConfirmDeleteId(null);
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
          occurrenceDate: modal.occurrenceDate,
        }
      : {
          title: "",
          notes: "",
          start: modal.start,
          end: modal.end,
          repeat: "none",
          color: "",
          occurrenceDate: modal.occurrenceDate,
        });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <PlannerToolbar
        view={view}
        onViewChange={setView}
        anchor={anchor}
        rangeLabel={rangeLabel}
        onPrev={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth(), a.getDate() - (view === "day" ? 1 : 7)))}
        onNext={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth(), a.getDate() + (view === "day" ? 1 : 7)))}
        onToday={() => setAnchor(new Date())}
        onJumpToDate={setAnchor}
        onNewEvent={handleNewEvent}
      />

      <PlannerGrid view={view} anchor={anchor} events={events} onCellClick={handleCellClick} onBlockClick={handleBlockClick} />

      {modal && modalInitial && (
        <EventModal
          mode={modal.mode}
          initial={modalInitial}
          onSave={handleSave}
          onDelete={handleDeleteRequest}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDeleteId && (
        <DeleteConfirmDialog
          onCancel={() => setConfirmDeleteId(null)}
          onDeleteThis={handleDeleteThisOccurrence}
          onDeleteAll={handleDeleteAll}
        />
      )}
    </div>
  );
}
