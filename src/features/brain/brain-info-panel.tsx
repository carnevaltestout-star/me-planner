import { useEffect, useRef, useState } from "react";
import type { BrainNode } from "@/lib/brain/brain-types";
import { emptySubpoint } from "@/lib/brain/brain-types";
import { subpointLabel } from "@/lib/brain/brain-numbering";
import { addChildAtPath, flattenSubpoints, removeSubpointAtPath, subpointAnchorId, updateSubpointAtPath } from "@/lib/brain/brain-subpoint-ops";
import SubpointSection from "./subpoint-section";

interface BrainInfoPanelProps {
  node: BrainNode;
  // Every node, so the parent link and the "child nodes" subset view below
  // can look up titles for node.parentId and whoever else points back at
  // this node — distinct from subpoints, which are this node's own
  // internal outline rather than other Brain nodes.
  allNodes: Record<string, BrainNode>;
  // Bumped by a double-click/long-press quick-edit in the 3D view (see
  // brain-page.tsx) — focuses and text-selects the title field below in
  // response, so the gesture actually lands ready to rename.
  editFocusToken: number;
  onUpdateNode: (updater: (n: BrainNode) => BrainNode) => void;
  onDeleteNode: () => void;
  onSelectNode: (id: string) => void;
}

export default function BrainInfoPanel({ node, allNodes, editFocusToken, onUpdateNode, onDeleteNode, onSelectNode }: BrainInfoPanelProps) {
  const [tagDraft, setTagDraft] = useState("");
  const flat = flattenSubpoints(node.subpoints);
  const titleRef = useRef<HTMLInputElement>(null);
  const parent = node.parentId ? allNodes[node.parentId] : null;
  const children = Object.values(allNodes).filter((n) => n.parentId === node.id);

  // Skips the very first render (token starts at 0, same as its initial
  // state) so opening a node via a plain click never steals focus into the
  // title field — only an actual quick-edit gesture bumps this.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    titleRef.current?.focus();
    titleRef.current?.select();
  }, [editFocusToken]);

  function addSubpoint(parentPath: number[] | null) {
    onUpdateNode((n) => ({ ...n, subpoints: addChildAtPath(n.subpoints, parentPath, emptySubpoint(crypto.randomUUID())) }));
  }

  function updateSubpoint(path: number[], updater: (sp: (typeof flat)[number]["subpoint"]) => (typeof flat)[number]["subpoint"]) {
    onUpdateNode((n) => ({ ...n, subpoints: updateSubpointAtPath(n.subpoints, path, updater) }));
  }

  function deleteSubpoint(path: number[]) {
    if (!window.confirm("Delete this subpoint and everything nested under it?")) return;
    onUpdateNode((n) => ({ ...n, subpoints: removeSubpointAtPath(n.subpoints, path) }));
  }

  function addTag() {
    const tag = tagDraft.trim();
    if (!tag || node.tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    onUpdateNode((n) => ({ ...n, tags: [...n.tags, tag] }));
    setTagDraft("");
  }

  function removeTag(tag: string) {
    onUpdateNode((n) => ({ ...n, tags: n.tags.filter((t) => t !== tag) }));
  }

  function scrollToSubpoint(path: number[]) {
    document.getElementById(subpointAnchorId(path))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-3 p-3 md:p-4">
      <div className="flex items-start gap-2">
        <input
          ref={titleRef}
          type="text"
          value={node.title}
          onChange={(e) => onUpdateNode((n) => ({ ...n, title: e.target.value }))}
          placeholder="insert node name"
          className="min-w-0 flex-1 border-b-[1.5px] border-transparent bg-transparent p-1 text-lg font-bold text-ink focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={onDeleteNode}
          className="flex-shrink-0 rounded-theme-sm border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-[#c22a4d] hover:text-[#c22a4d]"
        >
          Delete node
        </button>
      </div>

      {parent && (
        <button
          type="button"
          onClick={() => onSelectNode(parent.id)}
          className="flex w-fit items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-accent-soft hover:text-accent"
        >
          ↑ Parent: {parent.title || "insert node name"}
        </button>
      )}

      <textarea
        value={node.summary}
        onChange={(e) => onUpdateNode((n) => ({ ...n, summary: e.target.value }))}
        placeholder="General information about this node…"
        rows={3}
        className="w-full resize-y rounded-theme border border-border bg-surface p-2.5 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {node.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="text-accent hover:text-[#c22a4d]">
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="+ tag (Enter)"
          className="w-24 flex-shrink-0 rounded-full border border-dashed border-border bg-transparent px-2.5 py-1 text-xs text-ink focus:border-accent focus:outline-none"
        />
      </div>

      {children.length > 0 && (
        <div className="border-t border-dashed border-border pt-3">
          <h3 className="m-0 mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">Child nodes</h3>
          <ul className="flex flex-col gap-0.5">
            {children.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelectNode(c.id)}
                  className="flex w-full items-center gap-1.5 rounded-theme-sm px-1.5 py-1 text-left text-sm text-ink hover:bg-surface-alt hover:text-accent"
                >
                  <span aria-hidden="true">↳</span>
                  <span className="truncate">{c.title || "insert node name"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-dashed border-border pt-3">
        <h3 className="m-0 mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">Subpoints</h3>
        {flat.length > 0 && (
          <ul className="mb-2 flex flex-col gap-0.5">
            {flat.map(({ subpoint, path }) => (
              <li key={subpoint.id} style={{ paddingLeft: `${(path.length - 1) * 1.1}rem` }}>
                <button
                  type="button"
                  onClick={() => scrollToSubpoint(path)}
                  className="flex w-full items-center gap-1.5 rounded-theme-sm px-1.5 py-1 text-left text-sm text-ink hover:bg-surface-alt hover:text-accent"
                >
                  <span className="font-mono text-xs font-bold text-accent">{subpointLabel(path)}</span>
                  <span className="truncate">{subpoint.title || "Untitled subpoint"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => addSubpoint(null)}
          className="w-full rounded-theme-sm border border-dashed border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-soft"
        >
          + Add subpoint
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {flat.map(({ subpoint, path }) => (
          <SubpointSection
            key={subpoint.id}
            subpoint={subpoint}
            path={path}
            label={subpointLabel(path)}
            onUpdate={(updater) => updateSubpoint(path, updater)}
            onAddChild={() => addSubpoint(path)}
            onDelete={() => deleteSubpoint(path)}
          />
        ))}
      </div>
    </div>
  );
}
