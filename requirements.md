# Me - Planner

## What this is
A personal, ADHD-friendly planning and self-reflection and self-management pp app. One user (me, the product owner).
Not a generic productivity tool — prioritizes balance between structure and spontaneity,
and gentle self-tracking over rigid systems.

## Workflow rule (IMPORTANT)
Only install necessary packages, check if new feature can be developed with existing package, if not, download new one.
Before you implement a new feature tell me what u want to install and the size of it.

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
  all target platforms, fits the mostly-relational data model (journal entries, principles, vocab,
  tracker check-ins, goals, book reviews). No server needed (single user).
- **Charts:** Recharts — for tracker visualizations (mood/contentment over time).
- **File storage:** Tauri's built-in filesystem APIs — sandboxed, consistent across platforms,
  used for attachments/documents and book cover uploads.
- **Responsive design:** Build the React UI responsively from day one (Tailwind breakpoints)
  rather than as a separate mobile app later, so the eventual Android target is mostly wiring,
  not a rebuild.

## Tabs / Features

### 0. Overview
- Sits above Planner in the sidenav (Planner stays the default/home route on launch).
- Future: a card-grid view of every tab in one place, each card previewing that tab's own data
  (upcoming events, latest journal entry, etc.).
- Current state: cards exist and are clickable (jump straight to that tab), but are intentionally
  content-empty — no data preview yet. Icon: a 2x2 grid (8-bit pixel version in retro/kawaii mode).

### 1. Planner (default/home tab)
- Default view: full week, full day, extended hours (not just 9-5)
- ADHD-friendly: minimal friction to add/edit tasks, visual time blocking preferred over lists

### 2. Journal
- Gratitude-style daily reflection, 4 static prompts each entry, plus a 5th dynamic prompt.
  Each prompt has its own placeholder text (shown greyed-out in the empty field, never saved):
  - What went well today, why? — *Something did. Sit here until you remember what.*
  - What will I do differently? — *Future You is reading this. Make it useful for them.*
  - What new thing did I learn? — *Bonus points if it changed your mind about something.*
  - What did I do for someone else today? — *Nothing? Okay, but that's tomorrow's homework then.*
  - 5th prompt: a dropdown picks one at random each day from a pool (below), user can pick a
    different one from the dropdown, or click the pencil/edit icon next to it to write their own
    custom question instead. Pool of 5th-prompt options, each with its own placeholder:
    - What am I grateful for today? — *Gratitude. No fake manifestations.*
    - What's one thing I'm proud of today? — *One thing you handled like a slightly competent adult.*
    - What challenged me today, and how did I handle it? — *Even if "handled it" means avoided it
      until 11pm.*
    - What's one small thing that made today better? — *Small joys are still joys. Don't be a
      snob about it.*
  - Free-form Notes field underneath all 5 questions, styled like dotted journal paper.
- Header: today's date + a calendar icon that opens a year view (12 months, scroll to another
  year) to jump to any date's entry. A search bar (relaxed matching — "20.05" matches that
  day/month across every year, "2026" matches every entry in that year, otherwise free-text
  across questions+notes) with a magnifying-glass icon at its right end; search runs on
  clicking the icon or clicking outside the search bar. A save button/icon to the right of the
  search bar — retro mode shows an old floppy disk, kawaii mode a floppy disk with a heart in
  the middle. Entries save on clicking the save icon or automatically on blur (clicking away
  from a question/notes field). Only non-empty entries are ever stored.
- Entries are editable and deletable.
- Goal: encourage balance between self-management and spontaneity (tone/copy should reflect this, not feel like a chore log)

### 3. Principles
- User-editable list of personal principles, bullet points with editable subtext underneath
- Full CRUD: add, edit, delete, reorder
-Editable questions as headline, with date created and underneath text answers:,
- What matters most to you?
- Where do your blind spots lie?

### 4. Vocabulary
- List of vocabulary entries (word + meaning/notes)
- Training/quiz mode to practice recall

### 5. Attachments/Documents
- Files/notes the user is learning from or has written
- Sorted/organized by topic (needs topic/tag system)
- expandable, and downloadable as pdf

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
- Editable, deletable
- Push notifications? Focus on Windows and Android solutions (needs research in the mockup/
  implementation phase — confirm feasibility before committing to it)

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

### 10. Finance Overview
- Incoming/outgoing money, displayed in red/green tones similar to a banking GUI
- Savings card: editable, inputable
- A slot for single stocks/ETFs — searchable via a free API, one search input field; once a
  stock is picked, show its current value plus a graph of its value since it was picked, and
  a single current-value readout. Deletable.

### 11. Learning
- Upload anything you've been feeding your brain: links (as cleartext), documents, images
- Search bar to filter through everything
- Sort/filter by a topic flag/tag
- Scheduled to be built last, after every other tab
- buildn a memory/ flashcard learning game out of the provided content



## Conventions
- **Language:** TypeScript everywhere in the UI layer (strict mode on).
- **Folder structure (proposed):**
  ```
  src/
    components/     # shared/reusable UI (buttons, cards, modals, theme provider)
    features/       # one folder per tab (planner/, journal/, principles/, vocabulary/,
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
- **Component architecture:** modular, MVC-style separation within each component/feature —
  keep data/state logic, view rendering, and event handling in distinct, single-responsibility
  pieces rather than one large mixed file. Applies to every component going forward.

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
- **[App shell & nav merged]** `feature/app-shell-nav` merged to `dev`. Sidebar (desktop,
  ≥768px) collapsing to a slide-in drawer (mobile) reusing the same `NavList`; used
  `HashRouter` (not `BrowserRouter`) because Tauri's bundled production build has no server to
  rewrite deep links on refresh. Nav order follows the spec's tab order (Planner stays the
  visual default/home tab) independent of build order. Tab icons are small hand-authored
  inline-SVG components in `components/tab-icons/` — no icon library dependency. A
  settings/theme icon is reserved in the sidebar footer and topbar but is non-functional until
  the theming task. Colors used are a temporary neutral + muted-sage placeholder, not a real
  palette decision. Also installed Node 22 via `nvm` in the dev sandbox (system `apt` only had
  Node 12, too old for Vite 6) to actually run and smoke-test the app; `npm install` succeeded
  and `package-lock.json` is now committed.
- **[Backlog order, current]** One feature branch/mockup cycle per item: (1) global shell &
  tab nav — merged, (2) global theme system incl. retro 8-bit toggle, (3-4) Diary
  [entry form, history view], (5-6) Planner [week/day view, add/edit/move tasks], (7)
  Principles [bullet + subtext CRUD/reorder], (8-9) Vocabulary [list CRUD, quiz mode], (10)
  Attachments, (11-15) Trackers [period, mood, contentment, habit, productivity — period
  first to establish the chart pattern, rest unordered], (16-17) Goals [card grid CRUD with
  Month/Quarter/Yearly horizons, to-do list view toggle sharing the same horizons], (18-19)
  Book Reviews [list CRUD, cover upload], (20) Statistics [cross-tracker dashboard — depends
  on the trackers existing, hence last]. Diary stays ahead of Planner per earlier explicit
  request even though Planner is the spec's default/home tab; global shell/nav and theming
  stay first since every tab depends on them.
- **[Finance Overview tab added, 2026-08-12]** New 10th tab, scope intentionally left blank —
  do not ask for details until backlog items 1-20 are done. Added as backlog item (21),
  unordered/undetailed until then.
- **[Learning tab added, 2026-08-12]** New 11th tab: upload links (cleartext)/documents/images,
  search bar, sort/filter by topic flag. Explicitly scheduled to be built **last**, after every
  other tab — backlog item (22).
- **[Statistics / Finance Overview / Learning added to nav]** All three now have real
  `nav-items.ts` entries, routes, and placeholder pages (same empty-state pattern as the
  original 8) — resolves the earlier open question about the nav being behind the spec.
- **[Theme system substantially implemented, still on `feature/theme-system`, not yet merged]**
  `ThemeProvider` (React Context) applies palette/mode/retro/icon-pack as CSS variables,
  persisted to `localStorage` and synced live via the `storage` event so
  `public/mockups/theme-system.html`'s Save button can drive the real running app —
  `public/mockups/` stays dev-only and gets deleted before this merges. Retro gimmicks, each
  independently toggleable: starfield background (dark night sky only in dark mode; light mode
  keeps the customized background color; stars/shooting-stars are pink, not white — white was
  invisible against light palettes), a paw/star pixel-pattern sidebar divider, and a pet bunny
  that sleeps by default, wakes on click for a 2-minute sliding window, and while awake
  wanders near the bottom-right corner (clamped to the viewport so it can never go off-screen)
  with periodic mood pop-ups (yawn/sword/laugh/hearts), vscode-pets-style. A second small idle
  bunny sits next to the "Me planner" brand mark. Everything respects
  `prefers-reduced-motion`.
- **[Goals & Finance Overview scope filled in, 2026-08-12]** Goals: editable/deletable, plus a
  maybe-push-notifications idea (Windows/Android focus) to sanity-check during that task's own
  mockup phase rather than assumed now. Finance Overview: incoming/outgoing money in
  banking-style red/green, an editable savings card, and a searchable stocks/ETFs slot (free
  API, per-stock current value + a since-picked graph, deletable).
- **[Branch-sync gotcha, 2026-08-12]** `requirements.md` edits only ever landed on `dev`
  directly (established pattern: hop to `dev`, edit, commit, hop back), while
  `feature/theme-system` kept branching further ahead without ever merging `dev`'s doc commits
  back in. Working directly on the stale `feature/theme-system` copy nearly lost this entry's
  own content (it got typed onto the old file, under a duplicate/wrong tab number). Lesson: for
  any long-lived feature branch, merge `dev` into it periodically (or merge the branch into
  `dev` sooner) rather than letting `requirements.md` diverge silently across branches.
- **[Theme system merged, 2026-08-12]** `feature/theme-system` merged into `dev` — see the
  "substantially implemented" entry above for what it covers (palettes, mode, retro,
  gimmicks). `public/mockups/theme-system.html` and the gear icon's temporary
  "open the mockup" wiring were removed as part of the merge; the gear icon in the sidebar and
  topbar is now an inert placeholder labeled "panel coming soon" — there is still no in-app
  settings UI to actually change the theme yet, only the underlying engine (Context, storage,
  CSS variables). Building that real settings panel isn't its own backlog item yet; it should
  probably become one before the theme is genuinely user-editable end to end.
- **[Settings access restored, 2026-08-12]** Removing the mockup wiring at merge time was a
  mistake — it left literally no way to change the theme from the app at all (no real panel
  existed to replace it with). Re-restored `public/mockups/theme-system.html` +
  `mockups/index.html` and the gear icon's onClick. Lesson: don't remove the only working path
  to a feature as "cleanup" until its real replacement actually exists.
- **[Kawaii Mode merged, Planner merged, Diary renamed to Journal, 2026-08-13]** Super Kawaii
  Mode (Y2K desktop-widget skin, mutually exclusive with retro, sharing the same gimmicks) and
  the real Planner week/day view (grid, add/edit/delete/repeat/color/priority, mini-calendar,
  year view for jumping to any date) are both merged into `dev`. Diary renamed to **Journal**
  throughout — folder, component, route (`/diary` → `/journal`), nav label, icon, retro pixel
  icon, and both mockups (`public/mockups/diary.html` → `journal.html`,
  `me-planner:mock-diary` → `me-planner:mock-journal`) — following the same
  spec-order-vs-nav-order divergence already established for Diary/Planner: **Trackers now
  sits directly under Journal in the sidenav**, ahead of its listed position in the Tabs/Features
  section above, which is left unrenumbered. Journal's own prompt set was revised directly in
  this file (4 prompts, reordered) — the mockup's prompt content itself hasn't been updated to
  match yet; that happens on `feature/journal` when Journal is actually built for real (still
  mockup-first per the workflow rule).
- **[Branch discipline]** Going forward: after every merge into `dev`, immediately open the next
  feature branch, named after whatever tab is next in the sidenav to actually get built for
  real. Right now that's `feature/journal`.
- **[Journal built for real, 2026-08-14]** Mockup approved; `/journal` now renders a real React
  component (`src/features/journal/`) instead of embedding `public/mockups/journal.html` in an
  iframe — that file stays only as a historical reference, same as `planner-week-day-view.html`.
  Entries persist via `src/lib/journal/journal-storage.ts`, the same localStorage-as-stand-in-for-
  SQLite pattern as `planner-storage.ts` (storage key `me-planner:mock-journal-entries`).
  Read/write/delete all go through `loadEntries()`/`saveEntries()`; delete is a new capability not
  in the original mockup (a trash icon in the header, with a confirm dialog) since the mockup
  never had an explicit way to clear an entry, only auto-delete-when-empty. Theming is inherited
  automatically from the app's real CSS vars — no iframe theme-sync code needed anymore.
- **[Overview tab added, Statistics reordered, 2026-08-15]** New **Overview** tab added above
  Planner in the sidenav (Planner remains the default/home route) — a real route
  (`/overview`, `src/features/overview/`) rendering a clickable card grid, one card per other tab,
  same spec-order-vs-nav-order divergence already established for Trackers: **Statistics now sits
  directly under Trackers in the sidenav**, ahead of its listed position in the Tabs/Features
  section above, which is left unrenumbered. Cards are intentionally content-empty for now
  (icon + label, clickable) — this is the eventual home for a full card-preview dashboard, built
  directly for real rather than mockup-first since an empty-card grid is already effectively
  wireframe-fidelity.
