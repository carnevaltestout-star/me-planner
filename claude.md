
## Workflow rule (IMPORTANT)
-on the start of each new chat, run the app in localhost
- read this md file, then the requirements.md to know which step you currently are at, before continuing mention your next steps to me.
- Only install necessary packages, check if new feature can be developed with existing package, if not, download new one.
- Before you implement a new feature tell me what u want to install and the size of it.
-
Before implementing any new feature/tab, send a GUI mockup (ASCII/wireframe description or
an HTML/React preview) for approval first.
After developing a feature, do a thorough testing, also in mobile view. If for example the save, edit, etc doesnt work, redo the feature
or do a bugfix.
- Prefer clean, readable code over clever code: clear names, small functions, no dead code or commented-out blocks.
- Never hardcode secrets, API keys, or tokens — use environment variables and confirm they're gitignored.
- Add or update tests for any behavior change; don't mark something done if tests fail or are skipped.
- when Implementing a mockup, do not add a mockup banner on the html page or anywhere else, assume the use knows its a mockup.
- Always create a mockup as an endpoint that can be viewed on the browser like: localhost:1420/+mockup sth sth
- only nedit the files that need editing for a new feature and according to the rules of clean coding and MVP pattern.
-keep your developments modular, so if u generate custom gifs, place them in one folder for visibility and maintenance, and mention what size and format u used.
-only update the requirements.md if absolutely necessary, with minimal token usage as goal.
-If you develop a new feature, make sure, all themes still work with the new feature.
-If you implement a new feature, stick to the style, behavior, design of existing identical features for example search bars, download button, save buttons, since we want to keep the throughout usability of the application identical.

Mobile-View Requirements:
1. Responsive Design:
   - Ensure the layout switches cleanly to a mobile-friendly view 
   -adjust the feature view, so the entire window is visible in mobile view and uses mobile first principles on how to save, scroll , display items.
   - Desktop view must remain unchanged.
   - Do NOT modify underlying date calculation logic or state management.
   - Keep styling consistent with our existing design system/CSS setup (e.g., Tailwind / CSS Modules).
   - keep the button sizes in mobile view small, remove redundant text 
   -keep consistency in the height of global elements such as a top bar, side nav bar, etc. throughout all features and views / components


## Code Quality & Testing Workflow
When asked to write or modify code for a feature or fix:
1. **Implement:** Make the required code changes.
2. **Review:** Delegate a review to `@code-reviewer` to audit `git diff`.
3. **Fix:** If `@code-reviewer` reports `REJECTED`, fix the issues and run `@code-reviewer` again.
4. **Final Review:** Once `@code-reviewer` reports `PASSED`, stop editing and present a summary to the user for final approval before merge.