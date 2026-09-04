export interface BrainAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

// Matches VocabLink's shape (no separate label — the URL is the label,
// same convention vocabulary already uses).
export interface BrainLink {
  id: string;
  url: string;
}

// A single collapsible Q&A entry under a subpoint — collapsed by default,
// answer can mix free text, a pasted image, and a linked/uploaded document.
export interface BrainToggle {
  id: string;
  question: string;
  answerText: string;
  answerImage: BrainAttachment | null;
  // Either or both — "link a document" (a URL) and "attach a document"
  // (an uploaded file) are both valid per the spec, so a toggle can carry
  // one, the other, or neither alongside its answer text/image.
  answerDocument: BrainAttachment | null;
  answerLink: BrainLink | null;
  expanded: boolean;
}

// Subpoints nest (1.0 -> 1.0.1 etc.) — display numbering is computed from
// array position/depth (see brain-numbering.ts), not stored, so reordering
// or inserting a subpoint automatically renumbers everything under it.
export interface BrainSubpoint {
  id: string;
  title: string;
  toggles: BrainToggle[];
  notes: string;
  attachments: BrainAttachment[];
  links: BrainLink[];
  children: BrainSubpoint[];
}

// A node is one "neuron" — its position lives in a normalized -1..1 cube
// for the 3D view. parentId defines the tree (Neurobiology under Brain
// under Medicine); there's no separate many-to-many edge list since every
// example in the spec is a strict hierarchy, not an arbitrary graph.
export interface BrainNode {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  parentId: string | null;
  position: [number, number, number];
  subpoints: BrainSubpoint[];
}

export interface BrainState {
  nodes: Record<string, BrainNode>;
}

export const DEFAULT_BRAIN_STATE: BrainState = { nodes: {} };

function randomInCube(spread: number): [number, number, number] {
  return [(Math.random() * 2 - 1) * spread, (Math.random() * 2 - 1) * spread, (Math.random() * 2 - 1) * spread];
}

// New root/loose nodes scatter randomly across most of the cube; a child's
// starting position offsets from its parent instead (see brain-storage.ts'
// addNode) so connected trees visually cluster together from the moment
// they're created, rather than needing a manual layout pass.
export function randomLoosePosition(): [number, number, number] {
  return randomInCube(0.8);
}

export function emptyToggle(id: string): BrainToggle {
  return { id, question: "", answerText: "", answerImage: null, answerDocument: null, answerLink: null, expanded: false };
}

export function emptySubpoint(id: string): BrainSubpoint {
  return { id, title: "", toggles: [], notes: "", attachments: [], links: [], children: [] };
}

export function emptyNode(id: string, parentId: string | null, position: [number, number, number]): BrainNode {
  return { id, title: "", summary: "", tags: [], parentId, position, subpoints: [] };
}
