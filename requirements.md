# Me - Planner

## What this is
A personal, ADHD-friendly planning and self-reflection and self-management pp app. One user (me, the product owner).
Not a generic productivity tool — prioritizes balance between structure and spontaneity,
and gentle self-tracking over rigid systems.

## Workflow rule (IMPORTANT)
Only install necessary packages, check if new feature can be developed with existing package, if not, download new one.

Before implementing any new feature/tab, send a GUI mockup (ASCII/wireframe description or
an HTML/React preview) for approval first. Do NOT write production code for a feature until
the mockup is approved.
After developing a feature, do a thorough testing, also in mobile view. If for example the save, edit, etc doesnt work, redo the feature
or do a bugfix.
- Prefer clean, readable code over clever code: clear names, small functions, no dead code or commented-out blocks.
- Never hardcode secrets, API keys, or tokens — use environment variables and confirm they're gitignored.
- Add or update tests for any behavior change; don't mark something done if tests fail or are skipped.

Branching: classic `master` → `dev` → `feature` model. Clone `dev` from `master` before
starting work. Create a new branch per feature; merge into `dev` only after explicit approval.

## Global requirements
- Editable color theme options (user can customize palette, not just light/dark toggle)
- also retro theme toggle,in nerdy cute 90s 8 bit style, find free icon and font packages for it
- Clean, calm visual style — avoid clutter (ADHD-friendly = low cognitive load)

## Tech Stack
- **Shell / cross-platform runtime:** Tauri v2 — only mainstream framework with first-class
  support for Linux + Windows desktop and Android from one codebase (Electron has no official
  mobile target, React Native has no official Linux desktop target).
- **UI:** React + TypeScript — matches the mockup workflow rule directly (mockups are already
  HTML/React previews, so no translation step to production code).
- **Styling / theming:** Tailwind CSS — palette defined as CSS variables, Tailwind references
  them, so the editable color theme requirement is a variable swap, not duplicated styles.
- **Data storage:** SQLite via `tauri-plugin-sql` — local single file, works identically across
  all target platforms, fits the mostly-relational data model (diary entries, principles, vocab,
  tracker check-ins, goals, book reviews). No server needed (single user).
- **Charts:** Recharts — for tracker visualizations (mood/contentment over time).
- **File storage:** Tauri's built-in filesystem APIs — sandboxed, consistent across platforms,
  used for attachments/documents and book cover uploads.
- **Responsive design:** Build the React UI responsively from day one (Tailwind breakpoints)
  rather than as a separate mobile app later, so the eventual Android target is mostly wiring,
  not a rebuild.

## Tabs / Features

### 1. Planner (default/home tab)
- Default view: full week, full day, extended hours (not just 9-5)
- ADHD-friendly: minimal friction to add/edit tasks, visual time blocking preferred over lists

### 2. Diary
- Gratitude-style daily reflection, fixed prompts each entry:
  - What went well today?
  - What do I want to do differently?
  - What did I do for someone else today?
  - What did I do for myself?
  - What new thing did I learn?
- Goal: encourage balance between self-management and spontaneity (tone/copy should reflect this, not feel like a chore log)

### 3. Principles
- User-editable list of personal principles, bullet points with editable subtext underneath
- Full CRUD: add, edit, delete, reorder

### 4. Vocabulary
- List of vocabulary entries (word + meaning/notes)
- Training/quiz mode to practice recall

### 5. Attachments/Documents
- Files/notes the user is learning from or has written
- Sorted/organized by topic (needs topic/tag system)

### 6. Trackers
- Period tracker
- Habit tracker
- Mood tracker
- Overall contentment tracker
- Productivity
- (Likely daily check-in style, visualized over time — confirm chart style in mockup phase)

### 7. Goals
- Card grid view, switchable to to-dos
- Time horizons: Month, Quarter, Yearly
- Switch between Goals and and To-dos Month, quartely, Yearly

### 8. Book Reviews
- List of books with thoughts/review text
- Filterable and sortable
- Cover image upload per entry (icon/thumbnail)


### 9. Statistics
- Dashboard of cards showing tracked data over time (mood, habit completion, productivity,
  contentment, etc. — sourced from the Trackers tabs)
- Each card covers a time range (e.g. last few weeks/months)
- Per-card chart type toggle: line chart / area chart (confirm any further chart types in the
  mockup phase)


## Conventions
- **Language:** TypeScript everywhere in the UI layer (strict mode on).
- **Folder structure (proposed):**
  ```
  src/
    components/     # shared/reusable UI (buttons, cards, modals, theme provider)
    features/       # one folder per tab (planner/, diary/, principles/, vocabulary/,
                     # attachments/, trackers/, goals/, book-reviews/)
    lib/             # db access (sqlite queries), theme utils, chart helpers
    routes/          # top-level tab routing
  src-tauri/         # Rust shell, Tauri config, native plugin wiring
  ```
- **Component pattern:** functional components + hooks only, no class components.
- **State management:** React Context for cross-tab state (theme, current user prefs);
  local component state / SQLite queries for feature data — no global store library unless
  a real need shows up (single user, low complexity).
- **Naming:** PascalCase for components, camelCase for functions/variables, kebab-case for
  file names matching component folders.

## Notes / Decisions Log
- **[Tech stack chosen]** Tauri v2 + React + TypeScript + Tailwind + SQLite, decided to satisfy
  Linux/Windows-now, Android-later requirement from a single codebase. Alternatives considered:
  Electron (no official mobile support), React Native (no official Linux desktop support),
  Flutter (viable but Dart breaks the "mockups are HTML/React" workflow rule).
- **[Build target narrowed]** First build target is Android only (desktop Linux/Windows builds
  deferred). Tauri v2's Android support covers this without a stack change — same React/SQLite
  codebase, just a different `tauri android build` output instead of desktop bundling.
- **[Branching model]** `master` → `dev` → `feature/*`. Feature branches merge to `dev` only
  after explicit approval; `dev` merges to `master` at release points.
- **[Repo skeleton merged]** `feature/repo-skeleton` merged to `dev`. Hand-authored (no
  Node/npm or Rust/cargo toolchain available in the dev sandbox at setup time) rather than
  scaffolded via `npm create tauri-app` / `cargo` — config has not been verified to actually
  `npm install` / build. Confirm this before relying on it. `src-tauri/icons/` is empty;
  real icon assets are needed before a bundle build will work. `App.tsx` is a bare placeholder
  on purpose — layout/nav and theming are separate backlog items, not part of the skeleton.
- **[Backlog order — superseded, see next entry]** ~~Flat backlog for the 8 tabs + global
  requirements...~~
- **[Requirements updated 2026-08-12]** User revised requirements.md directly. Changes with
  scope impact: retro 8-bit theme toggle added to the global theming requirement (needs a
  pixel font + icon set — will bring options during the theming task rather than pick
  silently); Principles changed from essay-style to bullet points with editable subtext;
  Trackers gained Habit and Productivity types; Goals and To-dos share one switchable view
  with the same three horizon categories — Month / Quarter / Yearly (previously Month/Quarter,
  Goals-only); new Statistics tab added (cross-tracker dashboard, cards with a per-card
  line/area chart toggle, see its section above). Also added durable workflow rules: only add
  an npm package when the feature genuinely can't be built with what's already installed;
  test every feature thoroughly after building it, including mobile viewport, and redo/bugfix
  before calling it done if save/edit/etc. is broken; clean code with no dead code or
  commented-out blocks; never hardcode secrets; add/update tests for behavior changes.
- **[Backlog order, current]** One feature branch/mockup cycle per item: (1) global shell &
  tab nav — done, in review, (2) global theme system incl. retro 8-bit toggle, (3-4) Diary
  [entry form, history view], (5-6) Planner [week/day view, add/edit/move tasks], (7)
  Principles [bullet + subtext CRUD/reorder], (8-9) Vocabulary [list CRUD, quiz mode], (10)
  Attachments, (11-15) Trackers [period, mood, contentment, habit, productivity — period
  first to establish the chart pattern, rest unordered], (16-17) Goals [card grid CRUD with
  Month/Quarter/Yearly horizons, to-do list view toggle sharing the same horizons], (18-19)
  Book Reviews [list CRUD, cover upload], (20) Statistics [cross-tracker dashboard — depends
  on the trackers existing, hence last]. Diary stays ahead of Planner per earlier explicit
  request even though Planner is the spec's default/home tab; global shell/nav and theming
  stay first since every tab depends on them.
