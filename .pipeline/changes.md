# IMPLEMENTATION SUMMARY

## WHAT CHANGED
Added a persisted `userPreferencesStore` with dark mode and calendar start-day toggles. The dark mode preference drives a `dark-theme` class on `<html>` via a `RootLayout` effect, and the calendar preference flows through `WeekCalendarBar` to `getWeekDays`/`startOfWeek`.

## MODIFIED FILES
- `src/views/log/logDates.ts`: Added optional `startOnMonday: boolean = true` parameter to `startOfWeek` and `getWeekDays`, forwarded through the call chain.
- `src/views/log/WeekCalendarBar.tsx`: Imported `useUserPreferencesStore`, reads `calendarStartOnMonday` selector, uses it in `getWeekDays` call, and selects `dowLabels` from `MON_LABELS`/`SUN_LABELS` arrays instead of a single hardcoded constant.
- `src/layouts/RootLayout.tsx`: Imported `useUserPreferencesStore`, reads `darkMode` selector, added a second `useEffect` that adds/removes the `dark-theme` class on `document.documentElement`.
- `src/views/ProfileView.tsx`: Replaced the 7-line placeholder with the full settings UI — a "General" section containing Dark Mode and Start Week on Monday toggle rows bound to `userPreferencesStore`.
- `src/index.css`: Refactored `:root` to the light palette and added a `.dark-theme` block with the original dark values.

## NEW FILES
- `src/store/userPreferencesStore.ts`: Persisted Zustand store (immer + capacitorStorage) holding `darkMode` and `calendarStartOnMonday` booleans with toggle/set actions; defaults to `true` for both to preserve current app appearance.
- `src/views/profile/profile.css`: BEM-styled CSS for the profile settings list using only theme tokens, covering `.profile-view`, `.profile-section`, `.profile-list`, `.profile-row`, and `.toggle` / `.toggle--on` switch styles.

## TESTER FOCUS AREAS
- Verify that toggling Dark Mode in ProfileView adds/removes the `dark-theme` class on `document.documentElement` and that the palette visually switches between light and dark.
- Verify that toggling "Start Week on Monday" to false causes `WeekCalendarBar` to display Sunday as the first column with the `SUN_LABELS` header row correctly aligned to the date cells returned by `getWeekDays`.
- Verify that existing `logDates.test.ts` tests pass without modification — `startOfWeek` and `getWeekDays` called with no third argument must still return Monday-anchored weeks.
