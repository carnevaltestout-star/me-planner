import type { BrainSubpoint } from "./brain-types";

export interface FlatSubpoint {
  subpoint: BrainSubpoint;
  path: number[];
}

// Depth-first flatten — this is what makes "hierarchical order" automatic:
// a subpoint's position in this list (and therefore its numbering and its
// section's position on the page) comes purely from where it sits in the
// tree, so inserting 2.0 after 4.0 already exists still puts 2.0 above it.
export function flattenSubpoints(subpoints: BrainSubpoint[]): FlatSubpoint[] {
  const result: FlatSubpoint[] = [];
  function walk(list: BrainSubpoint[], prefix: number[]) {
    list.forEach((sp, i) => {
      const path = [...prefix, i];
      result.push({ subpoint: sp, path });
      walk(sp.children, path);
    });
  }
  walk(subpoints, []);
  return result;
}

export function subpointAnchorId(path: number[]): string {
  return `brain-subpoint-${path.join("-")}`;
}

function cloneTree(subpoints: BrainSubpoint[]): BrainSubpoint[] {
  return subpoints.map((sp) => ({
    ...sp,
    toggles: sp.toggles.map((t) => ({ ...t })),
    attachments: [...sp.attachments],
    links: [...sp.links],
    children: cloneTree(sp.children),
  }));
}

function listAtParentPath(root: BrainSubpoint[], path: number[]): BrainSubpoint[] {
  let list = root;
  for (let depth = 0; depth < path.length - 1; depth++) {
    list = list[path[depth]].children;
  }
  return list;
}

export function updateSubpointAtPath(
  subpoints: BrainSubpoint[],
  path: number[],
  updater: (sp: BrainSubpoint) => BrainSubpoint,
): BrainSubpoint[] {
  const next = cloneTree(subpoints);
  const list = listAtParentPath(next, path);
  list[path[path.length - 1]] = updater(list[path[path.length - 1]]);
  return next;
}

// path === null adds a new top-level subpoint; otherwise adds a child under
// the subpoint at that path.
export function addChildAtPath(subpoints: BrainSubpoint[], path: number[] | null, child: BrainSubpoint): BrainSubpoint[] {
  const next = cloneTree(subpoints);
  if (path === null) {
    next.push(child);
    return next;
  }
  let list = next;
  for (const idx of path) list = list[idx].children;
  list.push(child);
  return next;
}

export function removeSubpointAtPath(subpoints: BrainSubpoint[], path: number[]): BrainSubpoint[] {
  const next = cloneTree(subpoints);
  const list = listAtParentPath(next, path);
  list.splice(path[path.length - 1], 1);
  return next;
}
