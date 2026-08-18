import { useMemo, useState } from "react";
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { dateKey, isDateWithinPeriod, periodLabel, periodShortLabel, representativeDate, shiftPeriod } from "@/lib/goals/goal-todo-dates";
import { loadItems, saveItems } from "@/lib/goals/goal-todo-storage";
import {
  effectiveDate,
  emptyItem,
  isItemEmpty,
  progressPercent,
  type GoalTodoItem,
  type ItemKind,
  type TimeHorizon,
  HORIZONS,
} from "@/lib/goals/goal-todo-types";
import GoalTodoCard from "./goal-todo-card";
import SortableGoalTodoCard from "./sortable-goal-todo-card";
import GoalTodoForm from "./goal-todo-form";
import GoalTodoDeleteConfirm from "./goal-todo-delete-confirm";
import DoneListView from "./done-list-view";
import { CheckArchiveIcon, SearchIcon } from "./goal-todo-icons";

export default function GoalsPage() {
  const today = useMemo(() => new Date(), []);
  const [items, setItems] = useState(() => loadItems());
  const [activeKind, setActiveKind] = useState<ItemKind>("todo");
  const [horizon, setHorizon] = useState<TimeHorizon>("day");
  const [anchor, setAnchor] = useState(today);
  const [query, setQuery] = useState("");
  const [viewingDone, setViewingDone] = useState(false);
  const [formItem, setFormItem] = useState<GoalTodoItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GoalTodoItem | null>(null);

  function persist(next: Record<string, GoalTodoItem>) {
    setItems(next);
    saveItems(next);
  }

  const allOfKind = useMemo(() => Object.values(items).filter((i) => i.kind === activeKind), [items, activeKind]);
  const activeOfKind = useMemo(() => allOfKind.filter((i) => !i.done), [allOfKind]);
  const doneOfKind = useMemo(
    () => allOfKind.filter((i) => i.done).sort((a, b) => b.doneAt.localeCompare(a.doneAt)),
    [allOfKind],
  );

  // An item shows up in *every* horizon view whose period contains its
  // effective date (its deadline when it has one, otherwise the date it
  // was filed under at creation) — a goal due the 18th shows under Day/18,
  // the week containing the 18th, that month, that quarter, and that year
  // alike, rather than being siloed to just the one horizon it was created
  // under, or worse, stuck under today even once it's due somewhere else.
  const periodItems = useMemo(
    () =>
      activeOfKind
        .filter((i) => isDateWithinPeriod(effectiveDate(i), horizon, anchor))
        .sort((a, b) => a.order - b.order),
    [activeOfKind, horizon, anchor],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = periodItems.findIndex((i) => i.id === active.id);
    const newIndex = periodItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(periodItems, oldIndex, newIndex);
    const updated = { ...items };
    reordered.forEach((item, index) => {
      updated[item.id] = { ...updated[item.id], order: index };
    });
    persist(updated);
  }

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return activeOfKind.filter((i) => `${i.title} ${i.category}`.toLowerCase().includes(q));
  }, [activeOfKind, query]);

  // Done items for the period being *currently lived in* stay visible
  // (crossed out, sorted after the active ones) instead of vanishing the
  // moment they're checked — once that day/week/month/etc. is actually
  // over, they drop out of the period view and only live in the Done tab.
  const isCurrentPeriod = isDateWithinPeriod(dateKey(today), horizon, anchor);
  const doneInPeriod = useMemo(
    () =>
      isCurrentPeriod
        ? allOfKind.filter((i) => i.done && isDateWithinPeriod(effectiveDate(i), horizon, anchor)).sort((a, b) => b.doneAt.localeCompare(a.doneAt))
        : [],
    [allOfKind, horizon, anchor, isCurrentPeriod],
  );

  const displayedItems = searchResults ?? [...periodItems, ...doneInPeriod];

  const completedCount = useMemo(
    () => allOfKind.filter((i) => i.done && isDateWithinPeriod(effectiveDate(i), horizon, anchor)).length,
    [allOfKind, horizon, anchor],
  );
  const totalCount = periodItems.length + completedCount;
  const avgProgress = periodItems.length
    ? Math.round(periodItems.reduce((sum, i) => sum + progressPercent(i), 0) / periodItems.length)
    : 0;
  const dueSoonCount = periodItems.filter((i) => i.deadline).length;

  function handleSave(next: GoalTodoItem) {
    const updated = { ...items };
    if (isItemEmpty(next)) delete updated[next.id];
    else updated[next.id] = next;
    persist(updated);
    setFormItem(null);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const updated = { ...items };
    delete updated[pendingDelete.id];
    persist(updated);
    setPendingDelete(null);
  }

  function toggleDone(item: GoalTodoItem) {
    const nextDone = !item.done;
    persist({ ...items, [item.id]: { ...item, done: nextDone, doneAt: nextDone ? new Date().toISOString() : "" } });
  }

  function toggleStep(item: GoalTodoItem, stepId: string) {
    const steps = item.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
    persist({ ...items, [item.id]: { ...item, steps } });
  }

  function openCreate() {
    setFormItem(emptyItem(crypto.randomUUID(), activeKind, representativeDate(horizon, anchor, today)));
  }

  if (viewingDone) {
    return (
      <DoneListView
        kind={activeKind}
        items={doneOfKind}
        onBack={() => setViewingDone(false)}
        onUndo={(id) => persist({ ...items, [id]: { ...items[id], done: false, doneAt: "" } })}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <div className="flex flex-shrink-0 items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveKind("todo")}
          aria-pressed={activeKind === "todo"}
          className={`rounded-full bg-surface px-3 py-1 text-xs font-semibold shadow-theme ${
            activeKind === "todo" ? "text-accent" : "text-ink-muted hover:text-ink"
          }`}
        >
          To-Dos
        </button>
        <span aria-hidden="true" className="text-xs text-ink-muted">
          |
        </span>
        <button
          type="button"
          onClick={() => setActiveKind("goal")}
          aria-pressed={activeKind === "goal"}
          className={`rounded-full bg-surface px-3 py-1 text-xs font-semibold shadow-theme ${
            activeKind === "goal" ? "text-accent" : "text-ink-muted hover:text-ink"
          }`}
        >
          Goals
        </button>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 rounded-theme border border-border bg-surface pl-2.5 pr-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${activeKind === "goal" ? "goals" : "to-dos"}…`}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted">
          <SearchIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      {!searchResults && (
        <>
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-theme border border-border bg-surface px-2 py-1.5 shadow-theme">
            <div className="inline-flex flex-wrap overflow-hidden rounded-full border border-border">
              {HORIZONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHorizon(key)}
                  aria-pressed={horizon === key}
                  className={`px-2 py-0.5 text-[0.7rem] ${
                    horizon === key ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => setAnchor((a) => shiftPeriod(horizon, a, -1))}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
              >
                ‹
              </button>
              <span className="min-w-[7rem] text-center text-xs font-semibold text-ink">{periodLabel(horizon, anchor)}</span>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => setAnchor((a) => shiftPeriod(horizon, a, 1))}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid flex-shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4">
            <div className="flex flex-col gap-0.5 rounded-theme border border-border bg-surface p-2 shadow-theme">
              <span className="text-[0.58rem] uppercase tracking-wide text-ink-muted">
                Completed · {periodShortLabel(horizon, anchor)}
              </span>
              <span className="text-sm font-bold text-ink">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-theme border border-border bg-surface p-2 shadow-theme">
              <span className="text-[0.58rem] uppercase tracking-wide text-ink-muted">
                {activeKind === "goal" ? "Avg progress" : "In progress"}
              </span>
              <span className="text-sm font-bold text-ink">{activeKind === "goal" ? `${avgProgress}%` : periodItems.length}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-theme border border-border bg-surface p-2 shadow-theme">
              <span className="text-[0.58rem] uppercase tracking-wide text-ink-muted">With deadline</span>
              <span className="text-sm font-bold text-ink">{dueSoonCount}</span>
            </div>
            <button
              type="button"
              onClick={() => setViewingDone(true)}
              aria-label={`View done ${activeKind === "goal" ? "goals" : "to-dos"}`}
              className="flex items-center justify-between gap-1 rounded-theme border border-accent bg-accent-soft p-2 text-left shadow-theme hover:brightness-95"
            >
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[0.58rem] uppercase tracking-wide text-accent">
                  <CheckArchiveIcon className="h-2.5 w-2.5" />
                  View Done
                </span>
                <span className="text-sm font-bold text-accent">{doneOfKind.length}</span>
              </span>
              <span aria-hidden="true" className="text-sm text-accent">
                ›
              </span>
            </button>
          </div>

          <div className="relative flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-theme border border-accent bg-accent px-2 py-1 text-xs font-semibold text-accent-contrast hover:brightness-105"
            >
              + New {activeKind === "goal" ? "goal" : "to-do"}
            </button>
          </div>
        </>
      )}

      {displayedItems.length === 0 ? (
        <p className="pt-6 text-center text-sm text-ink-muted">
          {searchResults
            ? `No ${activeKind === "goal" ? "goals" : "to-dos"} match your search.`
            : `No ${activeKind === "goal" ? "goals" : "to-dos"} for ${periodLabel(horizon, anchor)} yet — tap + to add one.`}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {searchResults ? (
            searchResults.map((item) => (
              <GoalTodoCard
                key={item.id}
                item={item}
                today={today}
                onToggleDone={() => toggleDone(item)}
                onToggleStep={(stepId) => toggleStep(item, stepId)}
                onEdit={() => setFormItem(item)}
                onDeleteRequest={() => setPendingDelete(item)}
              />
            ))
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={periodItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {periodItems.map((item) => (
                    <SortableGoalTodoCard
                      key={item.id}
                      item={item}
                      today={today}
                      onToggleDone={() => toggleDone(item)}
                      onToggleStep={(stepId) => toggleStep(item, stepId)}
                      onEdit={() => setFormItem(item)}
                      onDeleteRequest={() => setPendingDelete(item)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {doneInPeriod.map((item) => (
                <GoalTodoCard
                  key={item.id}
                  item={item}
                  today={today}
                  onToggleDone={() => toggleDone(item)}
                  onToggleStep={(stepId) => toggleStep(item, stepId)}
                  onEdit={() => setFormItem(item)}
                  onDeleteRequest={() => setPendingDelete(item)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {formItem && <GoalTodoForm item={formItem} onClose={() => setFormItem(null)} onSave={handleSave} />}

      {pendingDelete && (
        <GoalTodoDeleteConfirm
          title={pendingDelete.title}
          kind={pendingDelete.kind}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
