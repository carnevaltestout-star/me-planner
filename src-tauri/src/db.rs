use tauri_plugin_sql::{Migration, MigrationKind};

pub const DB_URL: &str = "sqlite:me-planner.db";

// One migration for the whole schema — this is a pre-launch app with no
// production data to preserve on the Rust side, so there's nothing an
// incremental migration history would protect yet. Add v2+ migrations here
// once this schema has shipped to real users.
pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "initial schema",
        kind: MigrationKind::Up,
        sql: r#"
            CREATE TABLE app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            -- Shared by every attachment across Attachments/Brain/Vocabulary —
            -- keeps the exact "data:<mime>;base64,..." string so existing
            -- <img src> / download-as-blob call sites need no changes.
            CREATE TABLE file_blobs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                data_url TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE planner_events (
                id TEXT PRIMARY KEY,
                date_key TEXT NOT NULL,
                title TEXT NOT NULL,
                start REAL NOT NULL,
                "end" REAL NOT NULL,
                repeat TEXT,
                color TEXT,
                priority TEXT,
                notes TEXT,
                exceptions_json TEXT
            );

            CREATE TABLE event_presets (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                start REAL NOT NULL,
                "end" REAL NOT NULL,
                color TEXT,
                repeat TEXT,
                notes TEXT
            );

            CREATE TABLE routine_items (
                id TEXT PRIMARY KEY,
                period TEXT NOT NULL CHECK (period IN ('morning', 'evening')),
                text TEXT NOT NULL,
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE principles (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE trackers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT,
                icon TEXT,
                kind TEXT NOT NULL,
                created_at TEXT NOT NULL,
                config_json TEXT
            );

            CREATE TABLE tracker_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
                date_key TEXT NOT NULL,
                value_json TEXT NOT NULL
            );

            CREATE TABLE energy_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_key TEXT NOT NULL,
                time TEXT NOT NULL,
                value REAL NOT NULL
            );

            CREATE TABLE energy_notes (
                date_key TEXT PRIMARY KEY,
                note TEXT NOT NULL
            );

            CREATE TABLE goal_todo_items (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL CHECK (kind IN ('goal', 'todo')),
                title TEXT NOT NULL,
                category TEXT,
                color TEXT,
                deadline TEXT,
                date TEXT NOT NULL,
                horizon TEXT NOT NULL,
                manual_percent INTEGER NOT NULL DEFAULT 0,
                priority TEXT,
                done INTEGER NOT NULL DEFAULT 0,
                done_at TEXT,
                sort_order INTEGER,
                created_at TEXT,
                steps_json TEXT
            );

            CREATE TABLE journal_entries (
                date_key TEXT PRIMARY KEY,
                updated_at TEXT NOT NULL,
                data_json TEXT NOT NULL
            );

            CREATE TABLE vocab_topics (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                last_result_json TEXT
            );

            CREATE TABLE vocab_words (
                id TEXT PRIMARY KEY,
                topic_id TEXT NOT NULL REFERENCES vocab_topics(id) ON DELETE CASCADE,
                term TEXT NOT NULL,
                meaning TEXT,
                srs_json TEXT,
                links_json TEXT
            );

            CREATE TABLE vocab_word_attachments (
                word_id TEXT NOT NULL REFERENCES vocab_words(id) ON DELETE CASCADE,
                blob_id TEXT NOT NULL REFERENCES file_blobs(id) ON DELETE CASCADE,
                PRIMARY KEY (word_id, blob_id)
            );

            CREATE TABLE book_reviews (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT,
                genre TEXT,
                start_date TEXT,
                end_date TEXT,
                format TEXT,
                rating REAL,
                cover_image TEXT,
                summary TEXT,
                quotes TEXT,
                review TEXT,
                tropes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sort_order INTEGER
            );

            -- parentId is already a strict tree in the app's BrainNode type
            -- (no separate many-to-many edge list exists), so parent_id alone
            -- captures every relationship there is.
            CREATE TABLE brain_nodes (
                id TEXT PRIMARY KEY,
                parent_id TEXT REFERENCES brain_nodes(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                summary TEXT,
                tags_json TEXT,
                pos_x REAL NOT NULL,
                pos_y REAL NOT NULL,
                pos_z REAL NOT NULL
            );

            CREATE TABLE brain_subpoints (
                id TEXT PRIMARY KEY,
                node_id TEXT NOT NULL REFERENCES brain_nodes(id) ON DELETE CASCADE,
                parent_subpoint_id TEXT REFERENCES brain_subpoints(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                notes TEXT,
                sort_order INTEGER NOT NULL,
                links_json TEXT
            );

            -- A subpoint's own attachment list (separate from a toggle's
            -- single answerImage/answerDocument) — an ordered set of blobs,
            -- not a 1:1 relation, so this needs its own join table.
            CREATE TABLE brain_subpoint_attachments (
                subpoint_id TEXT NOT NULL REFERENCES brain_subpoints(id) ON DELETE CASCADE,
                blob_id TEXT NOT NULL REFERENCES file_blobs(id) ON DELETE CASCADE,
                sort_order INTEGER NOT NULL,
                PRIMARY KEY (subpoint_id, blob_id)
            );

            CREATE TABLE brain_toggles (
                id TEXT PRIMARY KEY,
                subpoint_id TEXT NOT NULL REFERENCES brain_subpoints(id) ON DELETE CASCADE,
                question TEXT,
                answer_text TEXT,
                answer_image_blob_id TEXT REFERENCES file_blobs(id) ON DELETE SET NULL,
                answer_document_blob_id TEXT REFERENCES file_blobs(id) ON DELETE SET NULL,
                answer_link_json TEXT,
                expanded INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE attachment_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT REFERENCES attachment_folders(id) ON DELETE CASCADE
            );

            CREATE TABLE attachment_files (
                id TEXT PRIMARY KEY,
                folder_id TEXT REFERENCES attachment_folders(id) ON DELETE SET NULL,
                blob_id TEXT NOT NULL REFERENCES file_blobs(id) ON DELETE CASCADE,
                added_at TEXT NOT NULL
            );

            CREATE TABLE learning_progress (
                game_id TEXT PRIMARY KEY,
                level INTEGER NOT NULL DEFAULT 0,
                attempts INTEGER NOT NULL DEFAULT 0,
                correct INTEGER NOT NULL DEFAULT 0,
                last_played_at TEXT
            );

            CREATE TABLE learning_custom_stories (
                id TEXT PRIMARY KEY,
                level INTEGER,
                name TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        "#,
    }]
}
