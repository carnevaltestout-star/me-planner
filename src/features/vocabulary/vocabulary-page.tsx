import { useEffect, useState } from "react";
import { gradeWord, buildSessionQueue } from "@/lib/vocabulary/vocab-srs";
import { loadVocabState, loadVocabUiState, saveVocabState, saveVocabUiState } from "@/lib/vocabulary/vocab-storage";
import {
  emptyWord,
  todayKey,
  type Direction,
  type TrainingSession,
  type VocabAttachment,
  type VocabLink,
  type VocabState,
  type VocabTopic,
} from "@/lib/vocabulary/vocab-types";
import TopicCard from "./topic-card";
import AddTopicDialog from "./add-topic-dialog";
import MixedTrainingDialog from "./mixed-training-dialog";
import TopicDeleteConfirm from "./topic-delete-confirm";
import TopicEditView from "./topic-edit-view";
import TrainingView from "./training-view";

type View = "list" | "edit" | "train";

// Partitions the just-finished (or just-exited) session's results per
// topic and writes each topic's own lastResult — a Mixed session spanning
// several topics updates every topic it touched, each with only its own
// slice of correct/wrong/missed.
function applySessionResults(session: TrainingSession, topics: VocabTopic[]): VocabTopic[] {
  return topics.map((t) => {
    if (!session.topicIds.includes(t.id)) return t;
    const processed = session.wordRefs.filter((r, i) => r.topicId === t.id && i < session.index);
    if (processed.length === 0) return t;
    const missedHere = session.missed.filter((m) => m.topicId === t.id).map((m) => m.wordId);
    const correctHere = Math.max(0, processed.length - missedHere.length);
    return { ...t, lastResult: { correct: correctHere, wrong: missedHere.length, missedWordIds: missedHere, at: todayKey() } };
  });
}

// True only until the first VocabularyPage mount of this JS session consumes
// it — a genuine page reload re-evaluates this module (back to false, so the
// restore below runs), but switching to another tab and back is just a
// React Router remount within the same session, and should always land on
// the plain topic list rather than wherever you last were.
let hasRestoredEditingTopicThisSession = false;

export default function VocabularyPage() {
  const [state, setState] = useState<VocabState>(() => loadVocabState());
  // Restores whichever topic was open on the last full page reload — but
  // only on that first reload-mount, and only if the topic still exists
  // (e.g. wasn't deleted from another tab/session). Reads the flag but never
  // mutates it here — StrictMode double-invokes this initializer in dev, and
  // a mutation inside it would make the second call see a flag the first
  // call had already flipped, silently losing the restore. The flag flips
  // exactly once, from the effect below, after the state it gates has
  // already been committed.
  const [editingTopicId, setEditingTopicId] = useState<string | null>(() => {
    if (hasRestoredEditingTopicThisSession) return null;
    const persisted = loadVocabUiState().editingTopicId;
    if (!persisted) return null;
    return loadVocabState().topics.some((t) => t.id === persisted) ? persisted : null;
  });
  const [view, setView] = useState<View>(() => (editingTopicId ? "edit" : "list"));

  useEffect(() => {
    hasRestoredEditingTopicThisSession = true;
  }, []);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [trainDropdownOpen, setTrainDropdownOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [mixedOpen, setMixedOpen] = useState(false);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);

  function persist(next: VocabState) {
    setState(next);
    saveVocabState(next);
  }

  function findTopic(id: string) {
    return state.topics.find((t) => t.id === id);
  }
  function findWord(topicId: string, wordId: string) {
    return findTopic(topicId)?.words.find((w) => w.id === wordId);
  }

  function handleAddTopic(name: string) {
    const id = crypto.randomUUID();
    persist({ ...state, topics: [...state.topics, { id, name, words: [], lastResult: null, attachments: [] }] });
    setAddTopicOpen(false);
    // Jump straight into editing the new topic instead of leaving it to add
    // words as a second, separate step.
    setEditingTopicId(id);
    setView("edit");
    saveVocabUiState({ editingTopicId: id });
  }

  function handleRenameTopic(name: string) {
    if (!editingTopicId) return;
    persist({ ...state, topics: state.topics.map((t) => (t.id === editingTopicId ? { ...t, name } : t)) });
  }

  function handleDeleteTopic() {
    if (!deleteTopicId) return;
    const clearSession = state.pausedSession?.topicIds.includes(deleteTopicId) ?? false;
    persist({
      ...state,
      topics: state.topics.filter((t) => t.id !== deleteTopicId),
      pausedSession: clearSession ? null : state.pausedSession,
    });
    setDeleteTopicId(null);
  }

  function handleUpdateWord(wordId: string, term: string, meaning: string) {
    if (!editingTopicId) return;
    persist({
      ...state,
      topics: state.topics.map((t) =>
        t.id === editingTopicId ? { ...t, words: t.words.map((w) => (w.id === wordId ? { ...w, term, meaning } : w)) } : t,
      ),
    });
  }

  function handleAddWord() {
    if (!editingTopicId) return;
    persist({
      ...state,
      topics: state.topics.map((t) => (t.id === editingTopicId ? { ...t, words: [...t.words, emptyWord(crypto.randomUUID())] } : t)),
    });
  }

  function handleDeleteWord(wordId: string) {
    if (!editingTopicId) return;
    persist({
      ...state,
      topics: state.topics.map((t) => (t.id === editingTopicId ? { ...t, words: t.words.filter((w) => w.id !== wordId) } : t)),
    });
  }

  function handleUpdateWordLinks(wordId: string, links: VocabLink[]) {
    if (!editingTopicId) return;
    persist({
      ...state,
      topics: state.topics.map((t) =>
        t.id === editingTopicId ? { ...t, words: t.words.map((w) => (w.id === wordId ? { ...w, links } : w)) } : t,
      ),
    });
  }

  function handleUpdateWordAttachments(wordId: string, attachments: VocabAttachment[]) {
    if (!editingTopicId) return;
    persist({
      ...state,
      topics: state.topics.map((t) =>
        t.id === editingTopicId ? { ...t, words: t.words.map((w) => (w.id === wordId ? { ...w, attachments } : w)) } : t,
      ),
    });
  }

  function handleUpdateTopicAttachments(attachments: VocabAttachment[]) {
    if (!editingTopicId) return;
    persist({ ...state, topics: state.topics.map((t) => (t.id === editingTopicId ? { ...t, attachments } : t)) });
  }

  function startSession(topicIds: string[], direction: Direction) {
    const wordRefs = topicIds.flatMap((tid) => {
      const topic = findTopic(tid);
      if (!topic) return [];
      return buildSessionQueue(topic.words, 20).map((w) => ({ topicId: tid, wordId: w.id }));
    });
    if (wordRefs.length === 0) {
      window.alert("Nothing due for training in that selection right now — nice work!");
      return;
    }
    setSession({ topicIds, direction, wordRefs, index: 0, correct: 0, wrong: 0, missed: [] });
    if (state.pausedSession) persist({ ...state, pausedSession: null });
    setView("train");
  }

  function resumeSession() {
    if (!state.pausedSession) return;
    setSession(state.pausedSession);
    persist({ ...state, pausedSession: null });
    setView("train");
  }

  function gradeCard(correct: boolean) {
    if (!session) return;
    const ref = session.wordRefs[session.index];
    const word = findWord(ref.topicId, ref.wordId);
    if (!word) return;

    const updatedTopics = state.topics.map((t) =>
      t.id !== ref.topicId
        ? t
        : {
            ...t,
            words: t.words.map((w) => {
              if (w.id !== ref.wordId) return w;
              const copy = { ...w, srs: { ...w.srs } };
              gradeWord(copy, correct);
              return copy;
            }),
          },
    );
    persist({ ...state, topics: updatedTopics });

    setSession({
      ...session,
      correct: session.correct + (correct ? 1 : 0),
      wrong: session.wrong + (correct ? 0 : 1),
      missed: correct ? session.missed : [...session.missed, ref],
      index: session.index + 1,
    });
  }

  function exitSession() {
    if (!session) return;
    let next = state;
    if (session.index < session.wordRefs.length) {
      next = { ...next, pausedSession: session };
    }
    next = { ...next, topics: applySessionResults(session, next.topics) };
    persist(next);
    setSession(null);
    setView("list");
  }

  function finishSession() {
    if (!session) return;
    persist({ ...state, topics: applySessionResults(session, state.topics) });
    setSession(null);
    setView("list");
  }

  if (view === "edit" && editingTopicId) {
    const topic = findTopic(editingTopicId);
    if (topic) {
      return (
        <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
          <TopicEditView
            topic={topic}
            onBack={() => {
              setView("list");
              setEditingTopicId(null);
              saveVocabUiState({ editingTopicId: null });
            }}
            onStartTraining={() => startSession([topic.id], "term-to-meaning")}
            onRenameTopic={handleRenameTopic}
            onUpdateWord={handleUpdateWord}
            onAddWord={handleAddWord}
            onDeleteWord={handleDeleteWord}
            onUpdateWordLinks={handleUpdateWordLinks}
            onUpdateWordAttachments={handleUpdateWordAttachments}
            onUpdateTopicAttachments={handleUpdateTopicAttachments}
          />
        </div>
      );
    }
  }

  if (view === "train" && session) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
        <TrainingView
          session={session}
          findTopic={findTopic}
          findWord={findWord}
          onChangeDirection={(direction) => setSession({ ...session, direction })}
          onGrade={gradeCard}
          onExit={exitSession}
          onFinish={finishSession}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      {state.pausedSession && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-theme-sm border border-accent bg-accent-soft px-3.5 py-2.5 text-sm text-ink">
          <span>
            You have a paused session ({state.pausedSession.index}/{state.pausedSession.wordRefs.length} cards) — pick up where you left off?
          </span>
          <button
            type="button"
            onClick={resumeSession}
            className="flex-shrink-0 rounded-theme-sm border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast hover:brightness-105"
          >
            Resume
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAddTopicOpen(true)}
          className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          + Add Topic
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setTrainDropdownOpen((o) => !o)}
            className="rounded-theme-sm border border-border bg-surface px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
          >
            Start Training ▾
          </button>
          {trainDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTrainDropdownOpen(false)} />
              <div className="absolute left-0 top-[calc(100%+4px)] z-20 flex w-56 flex-col gap-0.5 rounded-theme border border-border bg-surface p-1 shadow-theme">
                <button
                  type="button"
                  onClick={() => {
                    setTrainDropdownOpen(false);
                    window.alert('Pick a topic card\'s own "Start Training" button to begin — this mode trains just that one topic.');
                  }}
                  className="rounded-theme-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-alt"
                >
                  Start Training
                  <span className="block text-xs text-ink-muted">Pick one topic card to train on</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrainDropdownOpen(false);
                    setMixedOpen(true);
                  }}
                  className="rounded-theme-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-alt"
                >
                  Start Mixed Training
                  <span className="block text-xs text-ink-muted">Combine due words from multiple topics</span>
                </button>
              </div>
            </>
          )}
        </div>
        <button type="button" disabled title="Coming soon" className="cursor-default rounded-theme-sm border border-border bg-surface px-3.5 py-2 text-sm text-ink-muted opacity-55">
          Import
        </button>
      </div>

      {state.topics.length === 0 ? (
        <p className="pt-6 text-center text-sm text-ink-muted">No topics yet — add one to start building your vocabulary.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.topics.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              onOpen={() => {
                setEditingTopicId(t.id);
                setView("edit");
                saveVocabUiState({ editingTopicId: t.id });
              }}
              onStartTraining={() => startSession([t.id], "term-to-meaning")}
              onDeleteRequest={() => setDeleteTopicId(t.id)}
            />
          ))}
        </div>
      )}

      {addTopicOpen && <AddTopicDialog onClose={() => setAddTopicOpen(false)} onSave={handleAddTopic} />}
      {mixedOpen && (
        <MixedTrainingDialog
          topics={state.topics}
          onClose={() => setMixedOpen(false)}
          onStart={(topicIds) => {
            setMixedOpen(false);
            startSession(topicIds, "term-to-meaning");
          }}
        />
      )}
      {deleteTopicId && (
        <TopicDeleteConfirm
          name={state.topics.find((t) => t.id === deleteTopicId)?.name ?? "this topic"}
          onCancel={() => setDeleteTopicId(null)}
          onConfirm={handleDeleteTopic}
        />
      )}
    </div>
  );
}
