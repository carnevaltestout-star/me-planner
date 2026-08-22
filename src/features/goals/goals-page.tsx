import { useMemo, useState } from "react";
import { dateKey, isDateWithinPeriod, periodLabel, periodShortLabel, representativeDate, shiftPeriod } from "@/lib/goals/goal-todo-dates";
import { loadItems, saveItems } from "@/lib/goals/goal-todo-storage";
import {
  effectiveDate,
  emptyItem,
  isItemEmpty,
  isVisibleInHorizon,
  progressPercent,
  type GoalTodoItem,
  type ItemKind,
  type TimeHorizon,
  HORIZONS,
} from "@/lib/goals/goal-todo-types";
import { matchesDateQuery } from "@/lib/search/date-search";
import GoalTodoCard from "./goal-todo-card";
import GoalTodoForm from "./goal-todo-form";
import GoalTodoDeleteConfirm from "./goal-todo-delete-confirm";
import DoneListView from "./done-list-view";
import { CheckArchiveIcon, SearchIcon } from "./goal-todo-icons";

type SortMode = "newest" | "oldest" | "priority";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
];

// Items with no priority set sort after every prioritized one, regardless
// of P1-P4 among themselves reading P1 > P2 > P3 > P4 (ascending, since 1 is
// the highest priority) — same "unset sorts last" shape as the earlier
// due-date sort this replaced.
function compareItems(a: GoalTodoItem, b: GoalTodoItem, mode: SortMode): number {
  if (mode === "newest") return b.createdAt.localeCompare(a.createdAt);
  if (mode === "oldest") return a.createdAt.localeCompare(b.createdAt);
  const aHas = a.priority !== undefined;
  const bHas = b.priority !== undefined;
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (!aHas) return 0;
  return a.priority! - b.priority!;
}

export default function GoalsPage() {
  const today = useMemo(() => new Date(), []);
  const [items, setItems] = useState(() => loadItems());
  const [activeKind, setActiveKind] = useState<ItemKind>("todo");
  const [horizon, setHorizon] = useState<TimeHorizon>("day");
  const [anchor, setAnchor] = useState(today);
  // A view filter layered on top of horizon/anchor rather than a horizon
  // value itself — toggling it off returns to exactly whichever
  // horizon/period you were on before, and openCreate() keeps using that
  // same real horizon as the new item's creation context either way.
  // Starts true (the initial/default view) rather than needing a click.
  const [showAll, setShowAll] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  // The 4 stat cards (Completed/In-progress/With-deadline/View-Done) start
  // hidden — a glance at the list itself is the common case, the numbers
  // are an opt-in extra rather than something everyone needs every time.
  const [showStats, setShowStats] = useState(false);
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

  const completedCount = useMemo(
    () =>
      showAll
        ? allOfKind.filter((i) => i.done).length
        : allOfKind.filter((i) => i.done && isDateWithinPeriod(effectiveDate(i), horizon, anchor) && isVisibleInHorizon(i, horizon)).length,
    [allOfKind, horizon, anchor, showAll],
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
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-theme hover:bg-surface-alt"
          >
            {SORT_OPTIONS.find((o) => o.value === sortMode)?.label}
            <span aria-hidden="true" className="text-[0.6rem] text-ink-muted">
              ▾
            </span>
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
          <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-theme border border-border bg-surface px-2 py-1.5 shadow-theme">
            <div className="inline-flex flex-wrap overflow-hidden rounded-full border border-border">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                aria-pressed={showAll}
                className={`px-2 py-0.5 text-[0.7rem] ${showAll ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
              >
                All
              </button>
              {HORIZONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setHorizon(key);
                    setShowAll(false);
                  }}
                  aria-pressed={!showAll && horizon === key}
                  className={`px-2 py-0.5 text-[0.7rem] ${
                    !showAll && horizon === key ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHideDone((h) => !h)}
                aria-pressed={hideDone}
                className={`rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold ${
                  hideDone ? "bg-accent text-accent-contrast" : "bg-surface text-ink-muted hover:text-ink"
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
              className="rounded-theme border border-accent bg-accent px-2 py-1 text-xs font-semibold text-accent-contrast hover:brightness-105"
            >
              + Add {activeKind === "goal" ? "goal" : "to-do"}
            </button>
            <button
              type="button"
              onClick={() => setShowStats((s) => !s)}
              aria-pressed={showStats}
              className={`rounded-theme border px-2 py-1 text-xs font-semibold ${
                showStats ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              Show statistics
            </button>
          </div>

          {showStats && (
            <div className="grid flex-shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="flex flex-col gap-0.5 rounded-theme border border-border bg-surface p-2 shadow-theme">
                <span className="text-[0.58rem] uppercase tracking-wide text-ink-muted">
                  Completed · {showAll ? "All" : periodShortLabel(horizon, anchor)}
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
          )}
        </>
      )}

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
