import { applyTables } from "@/lib/data-transfer";
import { getSetting, setSetting } from "@/lib/db/settings-repo";
import { normalizeMusicSettings, MUSIC_SETTINGS_KEY } from "@/lib/music/music-storage";
import { normalizeTheme, THEME_SETTINGS_KEY } from "@/lib/theme/theme-storage";
import { BRAIN_STORAGE_KEY, BRAIN_UI_SETTINGS_KEY, normalizeBrainUiState } from "@/lib/brain/brain-storage";
import { replaceNode } from "@/lib/brain/brain-repo";
import type { BrainState } from "@/lib/brain/brain-types";
import { GOALS_TODOS_STORAGE_KEY, normalizeLegacyItem } from "@/lib/goals/goal-todo-storage";
import { upsertItem as upsertGoalTodoItem } from "@/lib/goals/goal-todo-repo";
import type { GoalTodoItem } from "@/lib/goals/goal-todo-types";

// One-time carry-over from the old localStorage world into the new SQLite
// tables, per feature as it migrates (not one big flag) — so a later wave
// can add its own mapping here without disturbing waves already migrated.
// A build shipped mid-migration (e.g. the debug APK sent for Android
// testing before this file existed) may have real data sitting in this
// origin's localStorage; if this origin's localStorage is empty (a genuinely
// fresh install), falls back to a bundled public/seed-data.json the same
// way the old loadBundledSeedDataIfEmpty() did.
const MARKER_PREFIX = "migrated-legacy:";

async function alreadyMigrated(legacyKey: string): Promise<boolean> {
  return getSetting(MARKER_PREFIX + legacyKey, false);
}
async function markMigrated(legacyKey: string): Promise<void> {
  await setSetting(MARKER_PREFIX + legacyKey, true);
}

interface BundledSeed {
  entries?: Record<string, string>;
  tables?: Record<string, Record<string, unknown>[]>;
}

let bundledSeedPromise: Promise<BundledSeed | null> | null = null;
function bundledSeed(): Promise<BundledSeed | null> {
  if (!bundledSeedPromise) {
    bundledSeedPromise = fetch("/seed-data.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => (p as BundledSeed | null) ?? null)
      .catch(() => null);
  }
  return bundledSeedPromise;
}

async function bundledSeedEntries(): Promise<Record<string, string> | null> {
  return (await bundledSeed())?.entries ?? null;
}

async function readLegacyValue(key: string): Promise<string | null> {
  const local = window.localStorage.getItem(key);
  if (local !== null) return local;
  const seed = await bundledSeedEntries();
  return seed?.[key] ?? null;
}

async function migrateSetting<T>(legacyKey: string, settingKey: string, normalize: (raw: unknown) => T): Promise<void> {
  if (await alreadyMigrated(legacyKey)) return;
  const raw = await readLegacyValue(legacyKey);
  if (raw != null) {
    try {
      await setSetting(settingKey, normalize(JSON.parse(raw)));
    } catch {
      // Malformed legacy value — leave the fresh default in place.
    }
  }
  await markMigrated(legacyKey);
}

async function migrateGoalsTodos(): Promise<void> {
  if (await alreadyMigrated(GOALS_TODOS_STORAGE_KEY)) return;
  const raw = await readLegacyValue(GOALS_TODOS_STORAGE_KEY);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [id, item] of Object.entries(parsed)) {
          await upsertGoalTodoItem(normalizeLegacyItem(id, item as Partial<GoalTodoItem>));
        }
      }
    } catch {
      // Malformed legacy value — nothing to carry over.
    }
  }
  await markMigrated(GOALS_TODOS_STORAGE_KEY);
}

async function migrateBrain(): Promise<void> {
  if (await alreadyMigrated(BRAIN_STORAGE_KEY)) return;
  const raw = await readLegacyValue(BRAIN_STORAGE_KEY);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw) as Partial<BrainState>;
      if (parsed && typeof parsed === "object" && parsed.nodes) {
        for (const node of Object.values(parsed.nodes)) await replaceNode(node);
      }
    } catch {
      // Malformed legacy value — nothing to carry over.
    }
  }
  await markMigrated(BRAIN_STORAGE_KEY);
}

// Goals/To-Dos and Brain no longer write anything to localStorage at all —
// a real export's "entries" half is legacy-empty for them by now, all their
// actual rows live in the export's "tables" half instead (see
// data-transfer.ts's collectTables()). Runs first and awaited on its own
// (not folded into the Promise.all below) so it finishes writing those
// tables before migrateGoalsTodos()/migrateBrain() get a chance to also
// write into them from their own (in practice empty, for a build seeded
// this way) legacy-entry source — avoids two migrations racing to write
// the same rows from two different origins.
const SEED_TABLES_MARKER = "bundled-seed-tables";

async function migrateBundledTables(): Promise<void> {
  if (await alreadyMigrated(SEED_TABLES_MARKER)) return;
  const tables = (await bundledSeed())?.tables;
  if (tables) await applyTables(tables);
  await markMigrated(SEED_TABLES_MARKER);
}

export async function migrateLegacyData(): Promise<void> {
  await migrateBundledTables();
  await Promise.all([
    migrateSetting("me-planner:theme", THEME_SETTINGS_KEY, normalizeTheme),
    migrateSetting("me-planner:music", MUSIC_SETTINGS_KEY, normalizeMusicSettings),
    migrateSetting("me-planner:brain-ui", BRAIN_UI_SETTINGS_KEY, normalizeBrainUiState),
    migrateGoalsTodos(),
    migrateBrain(),
  ]);
}
