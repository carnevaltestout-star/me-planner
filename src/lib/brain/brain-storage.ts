// Old localStorage key for the full nested tree — kept only so the
// one-time legacy migration knows where to look for pre-SQLite data (see
// brain-repo.ts for real storage now).
export const BRAIN_STORAGE_KEY = "me-planner:mock-brain";

// Which node (if any) is selected/open in the info panel — UI navigation
// state, not content, so it lives in app_settings via useSetting rather
// than in the brain_nodes tables.
export const BRAIN_UI_SETTINGS_KEY = "brain-ui";

export interface BrainUiState {
  selectedNodeId: string | null;
  // Whichever node was most recently created or edited — the 3D view
  // reopens focused/zoomed in on this one instead of the default overview
  // camera, so picking back up where you left off doesn't require manually
  // finding your place in the graph again.
  lastTouchedNodeId: string | null;
}

export const DEFAULT_BRAIN_UI_STATE: BrainUiState = { selectedNodeId: null, lastTouchedNodeId: null };

export function normalizeBrainUiState(raw: unknown): BrainUiState {
  const parsed = (raw ?? {}) as Partial<BrainUiState>;
  return { selectedNodeId: parsed.selectedNodeId ?? null, lastTouchedNodeId: parsed.lastTouchedNodeId ?? null };
}
