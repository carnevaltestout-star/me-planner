---
name: mobile-feature-tester
description: Thoroughly test a newly implemented feature in mobile viewport widths, verifying mobile-first layout, scroll behavior, sidenav/tab/icon integrity, and that no content overflows or gets clipped. Use this skill whenever the user asks to "test on mobile," "check the mobile view," "verify responsive layout," says a feature should be "mobile friendly," or right after implementing/changing UI that could affect small-screen rendering (new page, new component, sidenav change, modal, form, table, etc.) even if they don't explicitly say "mobile." Also use when the user reports mobile bugs like text getting cut off, overlapping elements, or a broken sidenav on small screens.
---

# Mobile Feature Tester

Verify a just-implemented (or just-changed) feature renders correctly on mobile viewports, fix what's broken, and re-verify — in a loop, without asking the user to do the visual QA themselves.

## When to use this

Trigger this any time UI work just happened and mobile correctness matters:
- User explicitly asks to test/check/verify mobile view or responsive layout
- User says a feature should be "mobile-first" or "mobile friendly"
- You just finished implementing/editing a page, component, nav, modal, form, or table
- User reports mobile-specific bugs (cut-off text, overlap, broken nav, horizontal scroll)

Don't wait to be asked with the word "mobile" — if you just shipped UI, run this before declaring the task done.

## Assumptions

- The project already has a browser automation dependency installed (e.g. Playwright or Puppeteer). Don't install a new one — detect what's already in `package.json` / lockfile and use that. If genuinely nothing is available, tell the user what's missing and ask before installing anything new.
- A dev server can be started (or is already running) so the feature is reachable at a local URL.

## Viewports to test

Test at all three of these widths (mobile-only, portrait):

| Label | Width x Height | Notes |
|---|---|---|
| small | 360 x 800 | common Android baseline |
| mid | 390 x 844 | iPhone 12/13/14-class |
| large | 414 x 896 | iPhone Plus/Max-class |

Run the full check at each width — a fix that works at 414 can still break at 360.

## Workflow

1. **Find the dev server / start it.** Check for a running server first (common ports: 3000, 5173, 8080). If none, start it in the background and wait for it to be ready. Identify the route(s)/page(s) the new feature lives on.

2. **Detect the automation tool.** Look in `package.json` for `playwright`, `@playwright/test`, `puppeteer`, or similar. Use whichever is present. If a Playwright config already exists, reuse it rather than writing a parallel one-off script.

3. **For each of the 3 viewport widths, load the relevant page(s) and check:**
   - **Sidenav / tabs / icons present and intact**: the existing sidenav with all previously generated tabs and icons must still be there — collapsed into a mobile pattern (hamburger/drawer/bottom-nav) if that's the app's existing mobile convention, not silently dropped. Don't invent a new nav pattern if the codebase already has one; match it.
   - **No horizontal overflow**: `document.documentElement.scrollWidth` should not exceed the viewport width anywhere on the page. Flag any element wider than its container.
   - **No clipped/overwritten text**: check for `overflow: hidden` + fixed-height combinations, negative margins, or absolutely-positioned elements colliding with text. Take a screenshot and visually confirm no label, button text, or heading is truncated or overlapped when it shouldn't be (ellipsis truncation is fine if that's an intentional design choice; unintentional clipping is not).
   - **Scrolling works as expected**: the page (or the correct scroll container, if it's a fixed-header/fixed-nav layout) scrolls vertically to reach all content; nothing needed is trapped off-screen with no way to reach it.
   - **Interactive elements are reachable and usably sized**: buttons/links aren't hidden behind other elements, and hit targets aren't absurdly small (rule of thumb: ~44px touch target).
   - **New feature itself**: whatever was just built — form, card, table, modal, etc. — should follow mobile-first patterns (stacked layout instead of multi-column, no fixed pixel widths wider than viewport, appropriate font sizes).

   Take a screenshot at each width for your own reference and for reporting to the user.

4. **When you find a problem, fix it, then re-test that width.** Prefer minimal, targeted CSS/layout fixes (flex/grid wrapping, `min-width: 0`, `max-width: 100%`, responsive breakpoints, `overflow-wrap`/`text-overflow`, moving fixed widths to relative units) over rewriting components. After a fix, re-run the check at the width that failed — and spot check the other two widths so the fix didn't regress them.

5. **Repeat until all three widths pass** the checklist above, or until you hit a fix that would require a design decision only the user can make (e.g., there's no sane place to put the sidenav content at 360px) — in that case, stop and ask rather than guessing.

6. **Report back concisely**: what was tested, what was broken, what you changed, and the final screenshots at each width. Don't just say "looks good" — name the specific things you verified (sidenav intact, no overflow, no clipped text, scroll works).

## Common mobile-first pitfalls to actively check for

- Fixed pixel widths on containers (`width: 800px`) instead of `max-width: 100%` / fluid units
- Multi-column CSS Grid/Flexbox that doesn't collapse to a single column below a breakpoint
- Sidenav implemented only as a permanently-visible side panel with no mobile/drawer variant
- Tables that don't scroll horizontally or reflow on small screens
- `white-space: nowrap` on labels/buttons that then clip with `overflow: hidden`
- Modals/dialogs taller than the viewport with no internal scroll
- Font sizes or paddings that were only tuned for desktop, causing text to wrap awkwardly or overflow buttons

## Notes

- Always test against the *existing* sidenav/tabs/icons that were already generated in prior work — the goal is confirming they survived the new feature, not redesigning them.
- If the project has no automated screenshot/browser tooling at all, say so explicitly and fall back to a careful code-level review of the CSS/layout for the patterns above, flagging that this is a lower-confidence check than a visual one.
