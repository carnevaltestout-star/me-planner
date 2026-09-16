import { useEffect, useRef, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { loadNotesSettings } from "@/lib/notes/notes-settings-storage";
import { loadNotes, saveNotes } from "@/lib/notes/notes-storage";
import { emptyNote, type Note } from "@/lib/notes/notes-types";
import ConfirmDialog from "./confirm-dialog";
import { EyeIcon, EyeOffIcon } from "./eye-icon";
import NoteCard from "./note-card";
import PenIcon from "./pen-icon";
import SortableNoteCard from "./sortable-note-card";
import NoteEditor from "./note-editor";
import TrashIcon from "./trash-icon";
import TrashRow from "./trash-row";

const PANEL_TRANSITION_MS = 260;
// How far in from the right edge a touch has to start to count as "on the
// collapsed tab's strip" — matches the tab's own mobile width (see
// notes-tab's px-2 py-5 sizing) with a little slack, not just its exact
// pixel width, so a swipe that starts just barely past the icon still
// counts.
const EDGE_SWIPE_ZONE_PX = 48;
const EDGE_SWIPE_OPEN_THRESHOLD_PX = 50;

// Mounted once at the app-shell root (sibling to PetBunny/SettingsDialog)
// so it survives every route change — the same "outside the per-tab z-10
// wrapper" reasoning app-shell.tsx already documents for those two.
// z-45: above PetBunny's z-30/z-40 pieces and BottomNav's z-30/z-40 (so the
// tab is never buried under them), below SettingsDialog's z-50 (so Settings
// still wins if both are ever open at once).
export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [expanded, setExpanded] = useState(false);
  const [showingTrash, setShowingTrash] = useState(false);
  const [query, setQuery] = useState("");
  // Which note (if any) is open in the full editor screen — null means the
  // card grid overview is showing. Cleared whenever the panel itself closes
  // or Trash is toggled on, so re-opening always lands back on the grid.
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  // Settings -> General's retention-days value — read fresh each time the
  // panel expands so a change made there takes effect without needing a
  // reload, without keeping every render in sync with localStorage.
  const [retentionDays, setRetentionDays] = useState(() => loadNotesSettings().trashRetentionDays);
  // Pending confirm-dialog request, if any — see requestDeleteForever/
  // emptyTrash below and confirm-dialog.tsx.
  const [confirmAction, setConfirmAction] = useState<{ message: string; run: () => void } | null>(null);
  // Some touch browsers/webviews fire a synthetic "ghost click" ~300ms after
  // a real tap that just dismissed an element (the confirm dialog closing
  // right on top of this panel's own click-outside-to-close backdrop) —
  // that phantom click would otherwise land on the backdrop and close the
  // *entire* notes panel right after confirming a delete. Suppress the
  // backdrop's close for a brief window after any confirm-dialog dismissal.
  const suppressBackdropCloseRef = useRef(false);

  function dismissConfirm() {
    setConfirmAction(null);
    suppressBackdropCloseRef.current = true;
    window.setTimeout(() => {
      suppressBackdropCloseRef.current = false;
    }, 400);
  }

  const activeNotes = notes.filter((n) => !n.deletedAt);
  const trashedNotes = notes.filter((n) => n.deletedAt);
  const openNote = openNoteId ? notes.find((n) => n.id === openNoteId) : undefined;
  const q = query.trim().toLowerCase();
  const visibleNotes = q ? activeNotes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : activeNotes;

  // Drag-reordering the grid only makes sense over the real (unfiltered)
  // order — same activation constraints every other draggable card in this
  // app uses (a plain tap/click still opens the note; only a real
  // press-and-move starts a drag).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // A swipe starting within the collapsed tab's edge strip and moving left
  // also opens the panel — not just tapping the tab itself. Global (not on
  // the tab element) since the gesture should work anywhere along that
  // vertical strip, not only exactly on the small icon. Skipped entirely
  // once expanded, and harmless on desktop since it only reacts to touch
  // events, which a mouse doesn't fire.
  useEffect(() => {
    if (expanded) return;
    let startX: number | null = null;
    let startY: number | null = null;

    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      const withinEdge = t.clientX >= window.innerWidth - EDGE_SWIPE_ZONE_PX;
      startX = withinEdge ? t.clientX : null;
      startY = withinEdge ? t.clientY : null;
    }
    function handleTouchEnd(e: TouchEvent) {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - (startY ?? t.clientY);
      if (dx < -EDGE_SWIPE_OPEN_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.5) setExpanded(true);
      startX = null;
    }
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [expanded]);

  useEffect(() => {
    if (expanded) setRetentionDays(loadNotesSettings().trashRetentionDays);
  }, [expanded]);

  function persist(next: Note[]) {
    setNotes(next);
    saveNotes(next);
  }

  // Creation also opens the new note straight into the editor — matches
  // Easy Notes' "+ New note" -> editor flow, since a title/description
  // pair is meaningless to leave sitting blank in the grid unopened.
  function addNote() {
    const note = emptyNote(crypto.randomUUID());
    persist([note, ...notes]);
    setOpenNoteId(note.id);
  }

  function updateNote(id: string, title: string, content: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n)));
  }

  // Card-grid checkbox toggle — same persist path as a full edit, just
  // triggered by a click on one checkbox instead of the editor's onBlur.
  function toggleCheckbox(id: string, nextContent: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, content: nextContent, updatedAt: new Date().toISOString() } : n)));
  }

  // Soft delete — moves the note to Trash instead of removing it outright,
  // so no confirm dialog is needed here anymore (see trash-row.tsx for the
  // one place that still confirms: permanently deleting from Trash).
  function trashNote(id: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n)));
    setOpenNoteId((current) => (current === id ? null : current));
  }

  function restoreNote(id: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, deletedAt: null } : n)));
  }

  function deleteForever(id: string) {
    persist(notes.filter((n) => n.id !== id));
  }

  // Both permanent-delete flows go through this single in-app confirm modal
  // instead of window.confirm() — see confirm-dialog.tsx for why.
  function requestDeleteForever(note: Note) {
    setConfirmAction({
      message: `Permanently delete "${note.title || "this note"}"? This can't be undone.`,
      run: () => deleteForever(note.id),
    });
  }

  function emptyTrash() {
    if (trashedNotes.length === 0) return;
    setConfirmAction({
      message: `Permanently delete all ${trashedNotes.length} note${trashedNotes.length === 1 ? "" : "s"} in Trash? This can't be undone.`,
      run: () => persist(notes.filter((n) => !n.deletedAt)),
    });
  }

  // Reorders just the active-notes subset and writes it back with trashed
  // notes left trailing (their relative order among themselves doesn't
  // matter — they're never displayed in this array's own order). Plain
  // array position is the persisted display order; no separate field
  // needed since this is the only place the array's order ever changes.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeNotes.findIndex((n) => n.id === active.id);
    const newIndex = activeNotes.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persist([...arrayMove(activeNotes, oldIndex, newIndex), ...trashedNotes]);
  }

  return (
    <>
      {/* Collapsed tab — always present, regardless of expanded state, so
          there's a single fixed-position element rather than swapping
          nodes (avoids a layout jump/flash on toggle). Fades out while the
          sheet is expanded instead of unmounting. */}
      {/* top-[30%] (not top-1/2) — 40% of the way from vertically centered
          up to the top edge. Retro/kawaii/tryout treatments are plain CSS
          keyed off the same :root[data-retro/kawaii/tryout] attributes
          apply-theme.ts already sets (see .notes-tab rules in index.css) —
          not JS ternaries off useTheme() — since this component needs to
          render/verify correctly independent of whichever storage layer
          Theme itself happens to be on. */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Open notes"
        aria-expanded={expanded}
        className={`notes-tab fixed right-0 top-[30%] z-[45] flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-theme border border-r-0 border-border bg-surface px-1 py-5 text-ink-muted shadow-theme transition-opacity hover:text-ink md:px-1 md:py-3 ${
          expanded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
      >
        <span aria-hidden="true" className="notes-tab-icon relative text-base leading-none">
          📝
        </span>
        {/* Icon-only on mobile (dropped the vertical "Notes" label — extra
            px-2 py-5 above keeps the tab a similar comfortable/tappable
            size instead of shrinking down with the text gone), label comes
            back at md: where there's room for it. */}
        <span className="hidden text-[0.62rem] font-semibold [writing-mode:vertical-rl] md:inline">Notes</span>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => {
            if (!suppressBackdropCloseRef.current) setExpanded(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* The "paper" — plain white-on-black-text / black-on-white-text
          regardless of the app's own accent/kawaii theme, on purpose: a
          sheet of paper isn't supposed to pick up the app's pink kawaii
          skin, just the light/dark mode split. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notes"
        className={`fixed inset-y-0 right-0 z-[45] flex w-[80%] flex-col bg-white text-[#1a1a1a] shadow-2xl transition-transform ease-out dark:bg-[#161616] dark:text-[#eaeaea] ${
          expanded ? "translate-x-0" : "translate-x-full"
        }`}
        // Animated only while opening — while expanded is (becoming) false,
        // duration drops to 0 in this same style update, so the close
        // happens instantly instead of playing the slide-out in reverse.
        style={{ transitionDuration: expanded ? `${PANEL_TRANSITION_MS}ms` : "0ms" }}
      >
        {openNote ? (
          // Full editor replaces the grid entirely — its own header (back/
          // download/delete) stands in for the +New-note/Deleted/close row
          // below, same "one screen at a time" navigation Easy Notes uses.
          <NoteEditor
            key={openNote.id}
            note={openNote}
            onUpdate={(title, content) => updateNote(openNote.id, title, content)}
            onDelete={() => trashNote(openNote.id)}
            onBack={() => setOpenNoteId(null)}
          />
        ) : (
          <>
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-black/10 px-3 py-2.5 dark:border-white/10">
              {showingTrash ? (
                <>
                  {/* Trash's own header — a dedicated back arrow (same
                      convention as the note editor's own back button) is
                      the unambiguous way out, not just re-tapping the eye
                      toggle. "Empty all" takes the same leading slot
                      "+ New note" occupies in the other header, since
                      Trash has no note to create. */}
                  <button
                    type="button"
                    onClick={() => setShowingTrash(false)}
                    aria-label="Back to all notes"
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    ←
                  </button>
                  <h2 className="m-0 flex-shrink-0 text-base font-bold">Deleted Notes</h2>
                  {/* Pushes "Empty all" one back-arrow-width (28px) further
                      right, away from the title, instead of sitting flush
                      against it — desktop only. On mobile the full text
                      button plus this spacer overflowed the narrow panel far
                      enough to push the eye/close buttons entirely off
                      screen, so the spacer drops out and the button itself
                      shrinks to icon-only there instead (see below). */}
                  <span className="hidden w-7 flex-shrink-0 md:inline-block" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={emptyTrash}
                    aria-label="Empty all"
                    title="Empty all"
                    className="flex flex-shrink-0 items-center justify-center rounded-full border border-current px-2 py-1.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 md:px-3"
                  >
                    <TrashIcon className="h-4 w-4 md:hidden" />
                    <span className="hidden md:inline">Empty all</span>
                  </button>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setShowingTrash(false)}
                    aria-pressed={true}
                    aria-label="Hide deleted notes"
                    title="Hide deleted notes"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <EyeIcon className="h-[18px] w-[18px]" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="m-0 flex-shrink-0 text-base font-bold">All Notes</h2>
                  {/* Text button only from md: up — on mobile it's replaced
                      by the floating pen FAB (below), which otherwise would
                      have had to fight the search field for the same
                      cramped header row. */}
                  <button
                    type="button"
                    onClick={addNote}
                    className="hidden flex-shrink-0 rounded-full border border-current px-3 py-1.5 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 md:inline-block"
                  >
                    + New note
                  </button>
                  {/* Same border/shape as "+ New note" — a search field, not
                      another button, but drawn from the same visual family.
                      Fills remaining space on mobile (the spacer next to it
                      is md:-only, so it isn't splitting that space in half);
                      a fixed, much narrower box on desktop instead of
                      stretching the whole row. */}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="min-w-0 flex-1 rounded-full border border-current bg-transparent px-3 py-1.5 text-sm placeholder:opacity-40 focus:outline-none md:flex-none md:w-[40%]"
                  />
                  <span className="hidden md:inline-block md:flex-1" aria-hidden="true" />
                  {/* Closed eye = Trash hidden; tapping it opens Trash. */}
                  <button
                    type="button"
                    onClick={() => setShowingTrash(true)}
                    aria-pressed={false}
                    aria-label="Show deleted notes"
                    title="Show deleted notes"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <EyeOffIcon className="h-[18px] w-[18px]" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close notes"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!showingTrash ? (
                visibleNotes.length === 0 ? (
                  <p className="p-4 text-center text-sm opacity-50">
                    {activeNotes.length === 0 ? 'No notes yet — tap "+ New note" to jot something down.' : "No notes match your search."}
                  </p>
                ) : q ? (
                  // Drag-reordering a filtered subset can't map cleanly back
                  // onto the real (unfiltered) order, so search results are
                  // plain, non-draggable cards — reordering only while
                  // viewing the full list, cleared below.
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {visibleNotes.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onOpen={() => setOpenNoteId(n.id)}
                        onToggleCheckbox={(nextContent) => toggleCheckbox(n.id, nextContent)}
                        onDelete={() => trashNote(n.id)}
                      />
                    ))}
                  </div>
                ) : (
                  // 2 columns fits the mobile-width panel comfortably; 3 at
                  // md: for the wider desktop panel (still 80% of a bigger
                  // viewport, not the full width) — a Keep-style grid, not
                  // the old one-note-per-row stacked list.
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activeNotes.map((n) => n.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {activeNotes.map((n) => (
                          <SortableNoteCard
                            key={n.id}
                            note={n}
                            onOpen={() => setOpenNoteId(n.id)}
                            onToggleCheckbox={(nextContent) => toggleCheckbox(n.id, nextContent)}
                            onDelete={() => trashNote(n.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )
              ) : trashedNotes.length === 0 ? (
                <p className="p-4 text-center text-sm opacity-50">Trash is empty.</p>
              ) : (
                <>
                  <p className="m-0 px-1 pb-2 text-[0.68rem] opacity-50">Notes here are deleted for good after {retentionDays} days.</p>
                  {trashedNotes.map((n) => (
                    <TrashRow
                      key={n.id}
                      note={n}
                      retentionDays={retentionDays}
                      onRestore={() => restoreNote(n.id)}
                      onDeleteForever={() => requestDeleteForever(n)}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Mobile-only FAB standing in for the header's "+ New note"
                button (hidden below md:) — floats over the scrolling grid
                so it's always reachable without eating into the cramped
                mobile header row the search field needs. Colors are
                explicit fixed black/white (not "text-ink"/theme-driven) —
                same "paper doesn't pick up the app's theme" reasoning as
                the rest of this panel — so it stays a plain, clearly
                visible white circle no matter which theme/dark-mode is
                active, instead of silently washing out under it. */}
            {!showingTrash && (
              <button
                type="button"
                onClick={addNote}
                aria-label="New note"
                title="New note"
                className="absolute bottom-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-lg hover:bg-black/5 dark:border-[#eaeaea] dark:bg-[#1f1f1f] dark:text-[#eaeaea] dark:hover:bg-white/10 md:hidden"
              >
                <PenIcon className="h-5 w-5" />
                {/* Small "+" badge — the pen alone reads as "edit", this
                    makes "add a new note" unambiguous at a glance. */}
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold leading-none text-white dark:bg-[#eaeaea] dark:text-[#1a1a1a]"
                >
                  +
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={() => {
            confirmAction.run();
            dismissConfirm();
          }}
          onCancel={dismissConfirm}
        />
      )}
    </>
  );
}
