import { useMemo, useState } from "react";
import { keyToDate } from "@/lib/trackers/tracker-dates";
import { loadEvents, saveEvents } from "@/lib/planner/planner-storage";
import { eventOccursOn } from "@/lib/planner/planner-dates";
import type { PlannerEvent } from "@/lib/planner/planner-types";
import PlannerGrid from "@/features/planner/planner-grid";
import EventModal, { type EventModalInitial, type EventModalSaveData } from "@/features/planner/event-modal";
import DeleteConfirmDialog from "@/features/planner/delete-confirm-dialog";
import { PlannerIcon } from "@/components/tab-icons/tab-icons";
import SectionHeader from "./overview-section-header";

interface OverviewCalendarListProps {
  selectedDateKey: string;
}

// Bounded so PlannerGrid (which fills whatever height its parent gives it)
// sits at a sensible size inside a card instead of stretching to the full
// page — tall enough to show most of a working day before its own internal
// scroll kicks in.
const GRID_HEIGHT_PX = 420;

type ModalState =
  | { mode: "create"; dateKey: string; occurrenceDate: string; start: number; end: number }
  | { mode: "edit"; event: PlannerEvent; occurrenceDate: string };

// The real Planner day grid (same component the full Calendar tab uses),
// not a simplified card list — so this section behaves exactly like the
// full page: click an empty slot to create an event, click a block to edit
// it, same drag-free click-to-time-slot precision and priority/recurrence
// handling.
export default function OverviewCalendarList({ selectedDateKey }: OverviewCalendarListProps) {
  const [events, setEvents] = useState<PlannerEvent[]>(() => loadEvents());
  const [open, setOpen] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedDate = useMemo(() => keyToDate(selectedDateKey), [selectedDateKey]);
  const dayCount = useMemo(() => events.filter((ev) => eventOccursOn(ev, selectedDate)).length, [events, selectedDate]);

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

  function handleSave(data: EventModalSaveData) {
    if (!modal) return;
    if (modal.mode === "edit") {
      persist(events.map((ev) => (ev.id === modal.event.id ? { ...ev, ...data } : ev)));
    } else {
      persist([...events, { id: crypto.randomUUID(), dateKey: modal.dateKey, exceptions: [], ...data }]);
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
    persist(events.map((ev) => (ev.id === modal.event.id ? { ...ev, exceptions: [...ev.exceptions, modal.occurrenceDate] } : ev)));
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
    <section className="flex flex-col gap-2">
      <SectionHeader
        icon={<PlannerIcon className="h-4 w-4" />}
        title="Calendar"
        count={dayCount}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
      {open && (
        <div style={{ height: GRID_HEIGHT_PX }}>
          <PlannerGrid view="day" anchor={selectedDate} events={events} onCellClick={handleCellClick} onBlockClick={handleBlockClick} />
        </div>
      )}
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
        <DeleteConfirmDialog onCancel={() => setConfirmDeleteId(null)} onDeleteThis={handleDeleteThisOccurrence} onDeleteAll={handleDeleteAll} />
      )}
    </section>
  );
}
