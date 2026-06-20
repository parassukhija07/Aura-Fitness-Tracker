# TEST EXECUTION REPORT

## STATUS
PASS

## TESTS IMPLEMENTED

- `src/store/userPreferencesStore.test.ts`:
  - Initial state: darkMode defaults to true
  - Initial state: calendarStartOnMonday defaults to true
  - toggleDarkMode flips darkMode from true to false
  - toggleDarkMode flips darkMode back to true on second call
  - toggleCalendarStartOnMonday flips calendarStartOnMonday from true to false
  - setDarkMode sets darkMode to an explicit value (true and false)
  - setCalendarStartOnMonday sets calendarStartOnMonday to an explicit value
  - Store is persisted under the key "aura-user-preferences" (via persist.getOptions().name)

- `src/views/log/logDates.sundayStart.test.ts`:
  - getWeekDays(startOnMonday=false): Sunday input returns same Sunday as day[0]
  - getWeekDays(startOnMonday=false): Wednesday input starts on the preceding Sunday
  - getWeekDays(startOnMonday=false): consecutive days are +1 apart
  - getWeekDays(startOnMonday=false): weekOffset=1 shifts window by 7 days
  - getWeekDays(startOnMonday=false): Monday input starts on the preceding Sunday
  - getWeekDays(no third arg): still Monday-anchored (backward compatibility)

- `src/views/ProfileView.test.tsx`:
  - Renders the "Profile" h1 heading
  - Renders the "General" h2 section header
  - Renders Dark Mode toggle switch (role=switch)
  - Renders Start Week on Monday toggle switch (role=switch)
  - Dark Mode toggle has aria-checked=true and toggle--on class when darkMode=true
  - Start Week on Monday toggle has aria-checked=true and toggle--on class when calendarStartOnMonday=true
  - Clicking Dark Mode toggle calls toggleDarkMode action
  - Clicking Start Week on Monday toggle calls toggleCalendarStartOnMonday action
  - Dark Mode toggle has aria-checked=false and no toggle--on class when darkMode=false
  - Start Week on Monday toggle has no toggle--on class when calendarStartOnMonday=false

- `src/layouts/RootLayout.test.tsx`:
  - Adds dark-theme class to document.documentElement when darkMode is true
  - Does not add dark-theme class when darkMode is false
  - Removes pre-existing dark-theme class when darkMode is false

## EXECUTION LOG
```
PASS src/store/userPreferencesStore.test.ts (10.87 s)
PASS src/store/workoutDataStore.test.ts (11.052 s)
PASS src/views/log/logDates.sundayStart.test.ts (11.959 s)
PASS src/views/log/logDates.test.ts (11.687 s)
PASS src/views/progression/LifetimeStatsCards.test.tsx (11.932 s)
PASS src/views/progression/ConsistencyHeatmap.test.tsx (12.377 s)
PASS src/layouts/RootLayout.test.tsx (12.22 s)
PASS src/views/ProgressionView.test.tsx (12.97 s)
PASS src/views/ProfileView.test.tsx (13.219 s)

Test Suites: 9 passed, 9 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        18.2 s, estimated 27 s
Ran all test suites.
```

## BLOCKERS (If Failed)
None.
