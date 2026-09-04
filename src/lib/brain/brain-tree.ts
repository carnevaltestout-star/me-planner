import type { BrainNode, BrainState } from "./brain-types";

export function childrenOf(state: BrainState, parentId: string | null): BrainNode[] {
  return Object.values(state.nodes).filter((n) => n.parentId === parentId);
}

export function descendantIds(state: BrainState, rootId: string): string[] {
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop() as string;
    for (const child of childrenOf(state, id)) {
      result.push(child.id);
      stack.push(child.id);
    }
  }
  return result;
}

// Deletes a node and everything under it — "if a node is deleted so are its
// tags and subfolders" (tags/subpoints live inside the node object itself
// so they go for free; "subfolders" means child nodes, which need this
// explicit cascade since they're separate top-level entries in state.nodes).
export function deleteNodeCascade(state: BrainState, id: string): BrainState {
  const toDelete = new Set([id, ...descendantIds(state, id)]);
  const nodes = { ...state.nodes };
  toDelete.forEach((nid) => delete nodes[nid]);
  return { ...state, nodes };
}

// Walks parentId up to the top of the tree — nodes sharing a root ancestor
// belong to the same visual cluster/region in the 3D view.
export function rootAncestorId(state: BrainState, id: string): string {
  let current = state.nodes[id];
  while (current?.parentId && state.nodes[current.parentId]) {
    current = state.nodes[current.parentId];
  }
  return current?.id ?? id;
}

// Guards the "Connect" interaction — reparenting nodeId under
// candidateParentId must not create a cycle (candidateParentId can't be
// nodeId itself or any of its own descendants).
export function wouldCreateCycle(state: BrainState, nodeId: string, candidateParentId: string): boolean {
  if (nodeId === candidateParentId) return true;
  return descendantIds(state, nodeId).includes(candidateParentId);
}
