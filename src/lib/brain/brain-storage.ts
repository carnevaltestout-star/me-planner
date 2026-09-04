import { DEFAULT_BRAIN_STATE, type BrainState } from "./brain-types";

// Same localStorage-as-stand-in-for-SQLite pattern as every other feature.
export const BRAIN_STORAGE_KEY = "me-planner:mock-brain";

// Which node (if any) is selected/open in the info panel — kept separate
// from BRAIN_STORAGE_KEY since it's UI navigation state, not data. Reloading
// the page lands back on the same node instead of deselecting everything.
export const BRAIN_UI_STORAGE_KEY = "me-planner:brain-ui";

export interface BrainUiState {
  selectedNodeId: string | null;
  // Whichever node was most recently created or edited — the 3D view
  // reopens focused/zoomed in on this one instead of the default overview
  // camera, so picking back up where you left off doesn't require manually
  // finding your place in the graph again.
  lastTouchedNodeId: string | null;
}

export function loadBrainUiState(): BrainUiState {
  try {
    const raw = window.localStorage.getItem(BRAIN_UI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { selectedNodeId: parsed.selectedNodeId ?? null, lastTouchedNodeId: parsed.lastTouchedNodeId ?? null };
      }
    }
  } catch {
    // fall through to default
  }
  return { selectedNodeId: null, lastTouchedNodeId: null };
}

export function saveBrainUiState(state: BrainUiState) {
  window.localStorage.setItem(BRAIN_UI_STORAGE_KEY, JSON.stringify(state));
}

export function loadBrainState(): BrainState {
  try {
    const raw = window.localStorage.getItem(BRAIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.nodes) return parsed as BrainState;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_BRAIN_STATE;
}

// Attachments (toggle answer images/documents, subpoint file uploads) are
// stored as base64 data URLs directly in this blob, so — same as
// vocab-storage's save — this can realistically hit localStorage's quota.
export function saveBrainState(state: BrainState) {
  try {
    window.localStorage.setItem(BRAIN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    window.alert("Couldn't save — storage is full. Try removing an attachment and saving again.");
  }
}
