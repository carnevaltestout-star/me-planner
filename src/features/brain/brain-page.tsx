import { useEffect, useState } from "react";
import { emptyNode, randomLoosePosition, type BrainNode, type BrainState } from "@/lib/brain/brain-types";
import { loadBrainState, loadBrainUiState, saveBrainState, saveBrainUiState } from "@/lib/brain/brain-storage";
import { deleteNodeCascade, wouldCreateCycle } from "@/lib/brain/brain-tree";
import BrainGraph3D, { type BrainGraphMode } from "./brain-graph-3d";
import BrainInfoPanel from "./brain-info-panel";

const MODES: { value: BrainGraphMode; label: string; hint: string }[] = [
  {
    value: "select",
    label: "Select",
    hint: "Click a node to open and zoom in on it, or tap empty space to add a new one. Double-click (or press and hold on mobile) a node to jump straight to renaming it. Drag the background to orbit.",
  },
  { value: "move", label: "Move", hint: "Click a node, then drag its gizmo to reposition it in the cube." },
  { value: "connect", label: "Connect", hint: "Click a node, then click another to make it a child of the first." },
];

export default function BrainPage() {
  const [state, setState] = useState<BrainState>(loadBrainState);
  const [selectedId, setSelectedId] = useState<string | null>(() => loadBrainUiState().selectedNodeId);
  // Whichever node was most recently created or edited — the 3D view opens
  // zoomed in on this one (see brain-graph-3d.tsx's CameraFocus) instead of
  // the default overview camera. Only updates on create/edit, not on every
  // plain selection, so just browsing around doesn't keep yanking the
  // camera around.
  const [lastTouchedId, setLastTouchedId] = useState<string | null>(() => loadBrainUiState().lastTouchedNodeId);
  const [mode, setMode] = useState<BrainGraphMode>("select");
  const [connectPendingId, setConnectPendingId] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState("");

  // Mobile only: the 3D view normally takes 42vh, leaving cramped room
  // below for editing a subpoint once the on-screen keyboard shows up too.
  // Focusing any field down there (or just scrolling that section) shrinks
  // the 3D view down to give the editing area ~3/4 of the screen instead;
  // tapping back into the 3D view restores the original split.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [infoPanelExpanded, setInfoPanelExpanded] = useState(false);
  // Bumped whenever a double-click/long-press quick-edit fires — BrainInfoPanel
  // focuses (and selects the text of) its title input in response, so the
  // gesture actually lands you ready to rename rather than just opening the
  // same panel a plain click would.
  const [editFocusToken, setEditFocusToken] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => saveBrainState(state), [state]);
  useEffect(() => saveBrainUiState({ selectedNodeId: selectedId, lastTouchedNodeId: lastTouchedId }), [selectedId, lastTouchedId]);

  function updateNode(id: string, updater: (n: BrainNode) => BrainNode) {
    setState((s) => (s.nodes[id] ? { ...s, nodes: { ...s.nodes, [id]: updater(s.nodes[id]) } } : s));
    setLastTouchedId(id);
  }

  function addNode() {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, nodes: { ...s.nodes, [id]: emptyNode(id, null, randomLoosePosition()) } }));
    setSelectedId(id);
    setLastTouchedId(id);
    setMode("select");
  }

  // Tapping empty space in the 3D view (Select mode only — see
  // BrainGraph3D's ClickToAddBackdrop) creates a loose root node right
  // where the user tapped, instead of at a random spot.
  function addNodeAt(position: [number, number, number]) {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, nodes: { ...s.nodes, [id]: emptyNode(id, null, position) } }));
    setSelectedId(id);
    setLastTouchedId(id);
    setMode("select");
  }

  function deleteNode(id: string) {
    const node = state.nodes[id];
    if (!node) return;
    const label = node.title || "this node";
    if (!window.confirm(`Delete "${label}" and every node connected under it? This can't be undone.`)) return;
    setState((s) => deleteNodeCascade(s, id));
    if (selectedId === id) setSelectedId(null);
    if (lastTouchedId === id) setLastTouchedId(null);
  }

  function commitMove(id: string, position: [number, number, number]) {
    updateNode(id, (n) => ({ ...n, position }));
  }

  // Plain selection now also focuses the camera on the node — previously
  // only create/edit did, to avoid yanking the camera while just browsing,
  // but "click a node, it opens and zooms in" is now the explicit ask.
  function handleSelect(id: string) {
    setSelectedId(id);
    setLastTouchedId(id);
    if (isMobile) setInfoPanelExpanded(true);
  }

  // Double-click (desktop) / long-press (mobile) on a node — see
  // NodeSphere's onDoubleClick/long-press handling in brain-graph-3d.tsx.
  // Opens the node the same way a plain click does, plus expands the panel
  // on mobile and bumps editFocusToken so BrainInfoPanel jumps straight to
  // a focused, text-selected rename field instead of just being open.
  function handleQuickEdit(id: string) {
    setSelectedId(id);
    setLastTouchedId(id);
    setInfoPanelExpanded(true);
    setEditFocusToken((t) => t + 1);
  }

  function handleConnectClick(id: string) {
    if (!connectPendingId) {
      setConnectPendingId(id);
      return;
    }
    if (connectPendingId === id) {
      setConnectPendingId(null);
      return;
    }
    if (wouldCreateCycle(state, id, connectPendingId)) {
      window.alert("Can't connect those two — it would create a loop.");
      setConnectPendingId(null);
      return;
    }
    updateNode(id, (n) => ({ ...n, parentId: connectPendingId }));
    setConnectPendingId(null);
  }

  const nodeCount = Object.keys(state.nodes).length;
  const selectedNode = selectedId ? state.nodes[selectedId] : null;
  const query = tagQuery.trim().toLowerCase();
  const searchResults = query
    ? Object.values(state.nodes).filter((n) => n.title.toLowerCase().includes(query) || n.tags.some((t) => t.toLowerCase().includes(query)))
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2" data-theme-surface="chrome">
        <h1 className="m-0 text-base font-bold text-ink">Brain</h1>
        <div className="inline-flex overflow-hidden rounded-theme border border-border">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => {
                setMode(m.value);
                setConnectPendingId(null);
              }}
              className={`border-r border-border px-3 py-1.5 text-sm last:border-r-0 ${
                mode === m.value ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted hover:bg-surface-alt"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={addNode}
          className="rounded-theme-sm border border-accent bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          + New node
        </button>
        <div className="relative ml-auto w-full max-w-[220px]">
          <input
            type="text"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            placeholder="Search by tag or name…"
            className="w-full rounded-theme-sm border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
          {query && (
            <div className="absolute right-0 top-full z-20 mt-1 max-h-56 w-full min-w-[220px] overflow-y-auto rounded-theme border border-border bg-surface shadow-theme">
              {searchResults.length === 0 ? (
                <p className="m-0 px-2.5 py-2 text-xs text-ink-muted">No nodes match.</p>
              ) : (
                searchResults.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(n.id);
                      setTagQuery("");
                    }}
                    className="flex w-full flex-col items-start gap-0.5 px-2.5 py-1.5 text-left hover:bg-surface-alt"
                  >
                    <span className="text-sm text-ink">{n.title || "insert node name"}</span>
                    {n.tags.length > 0 && <span className="text-[0.68rem] text-ink-muted">{n.tags.map((t) => `#${t}`).join(" ")}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <p className="flex-shrink-0 bg-accent-soft px-3 py-1 text-xs text-accent">
        {mode === "connect" && connectPendingId
          ? `Click the node that should become a child of "${state.nodes[connectPendingId]?.title || "insert node name"}".`
          : MODES.find((m) => m.value === mode)?.hint}
      </p>

      {/* Fixed dark background regardless of the app's own light/dark theme
          — deliberately styled like a network/data-viz stock image rather
          than following the app's palette, same reasoning pixel-bunny's
          CRT/monitor mockup work used fixed colors for its own aesthetic.
          Height shrinks on mobile while editing (see infoPanelExpanded) —
          tapping anywhere in here (a node or just empty space) hands the
          space back by collapsing the info panel again. */}
      <div
        className="flex-shrink-0 border-b border-border transition-[height] duration-300 ease-out"
        style={{ background: "#05070f", height: isMobile && infoPanelExpanded ? "16vh" : "42vh" }}
        onClick={() => {
          if (isMobile) setInfoPanelExpanded(false);
        }}
      >
        {nodeCount === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#9aa8c9]">
            No nodes yet — click "+ New node" above to create your first one.
          </div>
        ) : (
          <BrainGraph3D
            nodes={state.nodes}
            selectedId={selectedId}
            focusNodeId={lastTouchedId && state.nodes[lastTouchedId] ? lastTouchedId : null}
            mode={mode}
            connectPendingId={connectPendingId}
            onSelect={handleSelect}
            onCommitMove={commitMove}
            onNodeClickInConnectMode={handleConnectClick}
            onAddNodeAt={addNodeAt}
            onQuickEdit={handleQuickEdit}
            onDeleteNode={deleteNode}
          />
        )}
      </div>

      {/* onFocus here catches focus from any input/textarea/contentEditable
          nested inside BrainInfoPanel — React's synthetic focus event
          bubbles (unlike the native DOM one), so this one handler covers
          every field down in the subpoint tree without threading a
          callback through each of them individually. onScroll expands the
          same way once the user starts scrolling this section, per the
          explicit "scrolling down should expand it too" ask. */}
      <div
        className="flex-1 overflow-y-auto"
        onFocus={() => {
          if (isMobile) setInfoPanelExpanded(true);
        }}
        onScroll={(e) => {
          if (isMobile && e.currentTarget.scrollTop > 4) setInfoPanelExpanded(true);
        }}
      >
        {selectedNode ? (
          <BrainInfoPanel
            node={selectedNode}
            allNodes={state.nodes}
            editFocusToken={editFocusToken}
            onUpdateNode={(updater) => updateNode(selectedNode.id, updater)}
            onDeleteNode={() => deleteNode(selectedNode.id)}
            onSelectNode={handleSelect}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-muted">
            {nodeCount === 0 ? "Create a node above to get started." : "Select a node in the 3D view above to see its details here."}
          </div>
        )}
      </div>
    </div>
  );
}
