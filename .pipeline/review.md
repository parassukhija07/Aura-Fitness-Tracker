# PIPELINE REVIEW

## VERDICT
NEEDS WORK

## FINDINGS

### MAJOR
- `src/store/workoutDataStore.ts` contains out-of-scope additions (`addSet`, `deleteSet`, `updateSetField`, `updateSetType` actions and `completeSet` cleanup filter) that belong to a separate "active workout set editing" feature. These were not specced, not listed in `changes.md`, and have zero test coverage in this pipeline run.
- `src/views/LogView.tsx` contains out-of-scope modifications: an `ActiveWorkoutView` early-return rendering path and new `dayExercises`/`activeProgram` props passed to `LogActions`. These are untested in this pipeline.

### MINOR
- `package.json` / `package-lock.json` add `@capacitor/core` and `@capacitor/preferences` as declared dependencies. This is legitimate (fixes a pre-existing missing-dependency bug) but was not listed in `changes.md`. Add them to the changes log.
- `dist/` untracked build artifact is present in the working tree. Confirm it is gitignored and not staged.

## IN-SCOPE QUALITY (all PASS)
- `src/store/userPreferencesStore.ts`: Correct Zustand + immer + capacitorStorage setup. `partialize` and `version` used correctly. Defaults to `darkMode: true` / `calendarStartOnMonday: true` per spec, preserving current appearance.
- `src/layouts/RootLayout.tsx`: `useEffect` correctly calls `classList.add/remove` on `document.documentElement` (idempotent). Else-branch reverts to light theme correctly.
- `src/views/log/logDates.ts`: Optional `startOnMonday: boolean = true` parameter is backward-compatible. All existing tests pass.
- `src/views/log/WeekCalendarBar.tsx`: `MON_LABELS`/`SUN_LABELS` selection keyed off same preference as `getWeekDays` — DOW alignment is correct.
- `src/views/ProfileView.tsx`: Full General settings section with two toggle rows, correct aria attributes, bound to store actions.
- `src/index.css`: Light `:root` palette + `.dark-theme` block with original dark values. Correct refactor.
- `src/views/profile/profile.css`: BEM conventions, uses only `var(--color-*)` tokens.
- Tests: 60 passing across 9 suites. New test files are meaningful.

## ACTION ITEMS
1. Remove the `workoutDataStore.ts` set-editing additions from this changeset (or split to its own branch with tests).
2. Remove the `LogView.tsx` `ActiveWorkoutView` path from this changeset.
3. Add `package.json` / `package-lock.json` to `changes.md`.
4. Confirm `dist/` is in `.gitignore`.

Once items 1 & 2 are resolved, this feature is a clean SHIP.
