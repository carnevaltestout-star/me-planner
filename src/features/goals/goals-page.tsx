import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { dateKey, isDateWithinPeriod, periodLabel, representativeDate, shiftPeriod } from "@/lib/goals/goal-todo-dates";
import { loadItems, saveItems } from "@/lib/goals/goal-todo-storage";
import {
  effectiveDate,
  emptyItem,
  isItemEmpty,
  isVisibleInHorizon,
  type GoalTodoItem,
  type ItemKind,
  type TimeHorizon,
  HORIZONS,
} from "@/lib/goals/goal-todo-types";
import { matchesDateQuery } from "@/lib/search/date-search";
import RoutinesSection from "@/features/principles/routines-section";
import GoalTodoCard from "./goal-todo-card";
import GoalTodoForm from "./goal-todo-form";
import GoalTodoDeleteConfirm from "./goal-todo-delete-confirm";
import DoneListView from "./done-list-view";
import { CheckArchiveIcon, SearchIcon } from "./goal-todo-icons";

// Drag payload carried on each dnd-kit draggable/droppable's `data` in this
// page's DndContext — a card is the only drag source (see GoalTodoCard),
// and a horizon tab is the only drop target (see HorizonTab below).
type DragData = { type: "item"; itemId: string } | { type: "horizon"; horizon: TimeHorizon };

// One Day/Week/Month/Quarter/Year filter tab, also acting as a drop target
// for a dragged GoalTodoCard — dropping a card here reassigns its horizon
// (see goals-page's handleDragEnd). Pulled out to its own component since
// useDroppable needs to run once per tab, not once for the whole mapped row.
function HorizonTab({
  horizonKey,
  label,
  pressed,
  onClick,
}: {
  horizonKey: TimeHorizon;
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `horizon:${horizonKey}`,
    data: { type: "horizon", horizon: horizonKey } satisfies DragData,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
        pressed ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface text-ink-muted"
      } ${isOver ? "ring-2 ring-inset ring-accent" : ""}`}
    >
      {label}
    </button>
  );
}

type SortMode = "newest" | "oldest" | "priority";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
];

// Priority is always the PRIMARY sort, regardless of which of the 3 modes
// is selected — items with no priority set sort after every prioritized
// one, and among prioritized items P1 > P2 > P3 > P4 (ascending, since 1 is
// the highest priority). Without this, "Newest" used to be a fully
// independent sort that ignored priority entirely, so a brand-new
// unprioritized to-do (freshest createdAt) would jump above an existing P1
// item — the opposite of what setting a priority is for. The selected mode
// only decides the TIEBREAKER within a priority tier (including the
// unprioritized tier, where most quick-added items land): "Oldest" breaks
// ties oldest-first, "Newest" and "Priority" both break ties newest-first
// (Priority mode didn't have a defined tiebreak before this; newest-first
// is at least deterministic instead of an arbitrary stable-sort artifact).
function compareItems(a: GoalTodoItem, b: GoalTodoItem, mode: SortMode): number {
  const aHas = a.priority !== undefined;
  const bHas = b.priority !== undefined;
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (aHas && bHas && a.priority !== b.priority) return a.priority! - b.priority!;
  return mode === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt);
}

export default function GoalsPage() {
  const today = useMemo(() => new Date(), []);
  const [items, setItems] = useState(() => loadItems());
  const [activeKind, setActiveKind] = useState<ItemKind>("todo");
  const [horizon, setHorizon] = useState<TimeHorizon>("day");
  const [anchor, setAnchor] = useState(today);
  // Same breakpoint/pattern used elsewhere in the app (e.g. pet-bunny.tsx,
  // trackers-page.tsx) for a mobile/desktop split. The All/Day/Week/Month/
  // Quarter/Year row becomes a single dropdown on mobile instead of a row
  // of pills, since six individual pills don't fit a phone-width screen
  // without overflowing (confirmed — "Year" was getting clipped at 390px).
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  // A view filter layered on top of horizon/anchor rather than a horizon
  // value itself — toggling it off returns to exactly whichever
  // horizon/period you were on before, and openCreate() keeps using that
  // same real horizon as the new item's creation context either way.
  // Starts true (the initial/default view) rather than needing a click.
  const [showAll, setShowAll] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const [query, setQuery] = useState("");
  const [viewingDone, setViewingDone] = useState(false);
  const [formItem, setFormItem] = useState<GoalTodoItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GoalTodoItem | null>(null);

  function persist(next: Record<string, GoalTodoItem>) {
    setItems(next);
    saveItems(next);
  }

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Same activation-constraint pattern used for dnd-kit everywhere else in
  // this app (Attachments, Statistics/Overview card reordering): a small
  // mouse-movement threshold so a plain click still registers as a click,
  // and a short touch hold (plus its own tolerance) so scrolling the list
  // on mobile isn't mistaken for a drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // Dropping a dragged card onto a horizon tab reassigns that item's
  // horizon — reuses the same `persist` every other mutation on this page
  // (toggleDone, toggleStep, handleSave, ...) already goes through, rather
  // than adding a separate persistence path.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;
    if (activeData?.type !== "item" || overData?.type !== "horizon") return;
    const item = items[activeData.itemId];
    if (!item || item.horizon === overData.horizon) return;
    persist({ ...items, [item.id]: { ...item, horizon: overData.horizon } });
  }

  const allOfKind = useMemo(() => Object.values(items).filter((i) => i.kind === activeKind), [items, activeKind]);
  const activeOfKind = useMemo(() => allOfKind.filter((i) => !i.done), [allOfKind]);
  const doneOfKind = useMemo(
    () => allOfKind.filter((i) => i.done).sort((a, b) => b.doneAt.localeCompare(a.doneAt)),
    [allOfKind],
  );

  // An item shows up in every horizon view *at or broader than the one it
  // was created under* whose period contains its effective date (its
  // deadline when it has one, otherwise the date it was filed under at
  // creation) — a Day-created goal due the 18th shows under Day/18, the
  // week containing the 18th, that month, that quarter, and that year
  // alike, but a Quarter-created goal only shows in that quarter and its
  // year, never in the narrower Day/Week/Month views (see
  // isVisibleInHorizon).
  const periodItems = useMemo(() => {
    const base = showAll
      ? activeOfKind
      : activeOfKind.filter((i) => isDateWithinPeriod(effectiveDate(i), horizon, anchor) && isVisibleInHorizon(i, horizon));
    return [...base].sort((a, b) => compareItems(a, b, sortMode));
  }, [activeOfKind, horizon, anchor, showAll, sortMode]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return [
      ...activeOfKind.filter(
        (i) =>
          `${i.title} ${i.category}`.toLowerCase().includes(q) ||
          (i.deadline && matchesDateQuery(new Date(`${i.deadline}T00:00:00`), q)),
      ),
    ].sort((a, b) => compareItems(a, b, sortMode));
  }, [activeOfKind, query, sortMode]);

  // Done items for the period being *currently lived in* stay visible
  // (crossed out, sorted after the active ones) instead of vanishing the
  // moment they're checked — once that day/week/month/etc. is actually
  // over, they drop out of the period view and only live in the Done tab.
  const isCurrentPeriod = isDateWithinPeriod(dateKey(today), horizon, anchor);
  // "All" already shows every active item regardless of period — appending
  // "done in the current period" on top of that wouldn't mean anything
  // coherent, so it's skipped entirely there (Done items still have their
  // own dedicated "View Done" archive).
  const doneInPeriod = useMemo(
    () =>
      !showAll && !hideDone && isCurrentPeriod
        ? allOfKind
            .filter((i) => i.done && isDateWithinPeriod(effectiveDate(i), horizon, anchor) && isVisibleInHorizon(i, horizon))
            .sort((a, b) => b.doneAt.localeCompare(a.doneAt))
        : [],
    [allOfKind, horizon, anchor, isCurrentPeriod, showAll, hideDone],
  );

  const displayedItems = searchResults ?? [...periodItems, ...doneInPeriod];

  // Switching from a horizon with lots of cards (e.g. "All") to one with
  // none (e.g. "Day") used to visibly snap the scroll position back to the
  // top: the list collapses to a one-line empty message, the scroll
  // container's content shrinks below however far the user had scrolled,
  // and the browser clamps scrollTop back down since there's nothing left
  // to scroll to. Holding the list area at its last non-empty height while
  // it's empty keeps the container's scrollable range unchanged, so there's
  // nothing for the browser to clamp — the page doesn't move on its own.
  const listAreaRef = useRef<HTMLDivElement>(null);
  const lastListHeightRef = useRef(0);
  useLayoutEffect(() => {
    if (displayedItems.length > 0 && listAreaRef.current) {
      lastListHeightRef.current = listAreaRef.current.scrollHeight;
    }
  }, [displayedItems]);

  // Belt-and-suspenders alongside the min-height above: the header row
  // itself also changes height when switching All <-> a specific horizon
  // (the period nav with its ‹ label › only shows for a specific horizon),
  // which alone can shift scroll position a bit even once the list stops
  // collapsing. Explicitly re-pinning scrollTop after that kind of change
  // closes the gap so the viewport genuinely doesn't move on its own.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  useLayoutEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollTopRef.current;
  }, [horizon, anchor, showAll, activeKind]);

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
    setFormItem(emptyItem(crypto.randomUUID(), activeKind, representativeDate(horizon, anchor, today), horizon));
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <div
      ref={scrollContainerRef}
      onScroll={(e) => {
        scrollTopRef.current = e.currentTarget.scrollTop;
      }}
      className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4"
    >
      <RoutinesSection />

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

      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex min-w-0 max-w-[60%] flex-1 items-center gap-1 rounded-theme border border-border bg-surface pl-2.5 pr-1">
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

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setSortMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            aria-label={`Sort by: ${SORT_OPTIONS.find((o) => o.value === sortMode)?.label}`}
            title={`Sort by: ${SORT_OPTIONS.find((o) => o.value === sortMode)?.label}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-theme hover:bg-surface-alt"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {sortMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+4px)] z-20 flex w-32 flex-col gap-0.5 rounded-theme border border-border bg-surface p-1 shadow-theme">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={sortMode === o.value}
                    onClick={() => {
                      setSortMode(o.value);
                      setSortMenuOpen(false);
                    }}
                    className={`rounded-theme-sm px-2.5 py-1.5 text-left text-xs ${
                      sortMode === o.value ? "bg-accent-soft font-semibold text-accent" : "text-ink hover:bg-surface-alt"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!searchResults && (
        <>
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
            {isMobile ? (
              // A dropdown instead of a pill row on mobile — six individual
              // pills (All + 5 horizons) don't fit a phone-width screen
              // without overflowing/clipping (confirmed at 390px, "Year"
              // was getting cut off). Drag-to-categorize (see HorizonTab
              // below) only applies to the desktop pill row: dropping a
              // dragged card onto a currently-closed native <select> isn't
              // a workable touch gesture anyway, so mobile just gets plain
              // tap-to-filter instead.
              <select
                value={showAll ? "all" : horizon}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    setShowAll(true);
                  } else {
                    setHorizon(e.target.value as TimeHorizon);
                    setShowAll(false);
                  }
                }}
                aria-label="Filter by time horizon"
                className="min-w-0 flex-shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink focus:outline focus:outline-2 focus:outline-accent"
              >
                <option value="all">All</option>
                {HORIZONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  aria-pressed={showAll}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                    showAll ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface text-ink-muted"
                  }`}
                >
                  All
                </button>
                {HORIZONS.map(({ key, label }) => (
                  <HorizonTab
                    key={key}
                    horizonKey={key}
                    label={label}
                    pressed={!showAll && horizon === key}
                    onClick={() => {
                      setHorizon(key);
                      setShowAll(false);
                    }}
                  />
                ))}
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHideDone((h) => !h)}
                aria-pressed={hideDone}
                className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                  hideDone ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface text-ink-muted"
                }`}
              >
                Hide done
              </button>
              {!showAll && (
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
              )}
            </div>
          </div>

          <div className="relative flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full border border-accent bg-accent px-3 py-1 text-xs font-semibold text-accent-contrast hover:brightness-105"
            >
              + Add {activeKind === "goal" ? "goal" : "to-do"}
            </button>
            <button
              type="button"
              onClick={() => setViewingDone(true)}
              aria-label={`View done ${activeKind === "goal" ? "goals" : "to-dos"} (${doneOfKind.length})`}
              className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <CheckArchiveIcon className="h-3 w-3" />
              Done ({doneOfKind.length})
            </button>
          </div>
        </>
      )}

      <div
        ref={listAreaRef}
        style={displayedItems.length === 0 ? { minHeight: lastListHeightRef.current } : undefined}
      >
        {displayedItems.length === 0 ? (
          <p className="pt-6 text-center text-sm text-ink-muted">
            {searchResults
              ? `No ${activeKind === "goal" ? "goals" : "to-dos"} match your search.`
              : `No ${activeKind === "goal" ? "goals" : "to-dos"} ${showAll ? "yet" : `for ${periodLabel(horizon, anchor)} yet`} — tap + to add one.`}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {displayedItems.map((item) => (
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
          </div>
        )}
      </div>

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
    </DndContext>
  );
}
