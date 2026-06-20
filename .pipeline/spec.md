# IMPLEMENTATION SPEC

## ⚠️ OPEN QUESTIONS
None.

## 🏗️ ARCHITECTURE & PATTERNS
- **Existing Patterns to Match:**
  - `src/store/navStore.ts` — closest template for the new preferences store: `create()` + `persist(immer(...))`, simple boolean/enum state, persisted under a `name` key. COPY THIS STRUCTURE.
  - `src/store/workoutDataStore.ts` — reference for using the Capacitor storage engine: `storage: createJSONStorage(() => capacitorStorage)` (lines 148-158). Use this engine (NOT `localStorage`) per the feature request.
  - `src/store/capacitorStorage.ts` — the persistence engine to import (`capacitorStorage`).
  - `src/views/log/WeekCalendarBar.tsx` — consumer of `getWeekDays`; DOW labels live here (line 11). DO NOT rewrite this component (boundary rule), but it is affected — see note in FILES TO MODIFY.
  - `src/views/LogView.tsx` — example of reading from a Zustand store via selectors and a view's outer `<section className="view ...">` wrapper.
  - `src/views/log/log.css` — BEM + theme-token CSS convention. Match this style in the new `profile.css`.
  - `src/index.css` — defines the CSS variable palette on `:root`. Dark mode toggling hooks here.
  - `src/store/workoutDataStore.test.ts` (lines 1-12) — pattern for mocking `@capacitor/preferences` in Jest. Reuse if writing a store test.

- **Core Strategy:** Add a new persisted Zustand store `userPreferencesStore` holding two booleans. A small effect in `RootLayout` reads `darkMode` and toggles a `dark-theme` class on `<html>`. The CSS palette is refactored so light is the `:root` default and `.dark-theme` is the override (defaulting `darkMode` to `true` preserves today's appearance). `getWeekDays`/`startOfWeek` gain an optional `startOnMonday` parameter that the calendar passes through from the preference.

---

## 📝 FILES TO MODIFY

### `src/views/log/logDates.ts`
- **`startOfWeek` (lines 39-43):** add a second parameter `startOnMonday: boolean = true`. Compute the offset based on the preference.
  - BEFORE:
    ```
    export function startOfWeek(d: Date): Date {
      const base = startOfDay(d);
      const mondayOffset = (base.getDay() + 6) % 7;
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() - mondayOffset);
    }
    ```
  - AFTER (logic, not final code style — Coder writes it):
    ```
    export function startOfWeek(d: Date, startOnMonday: boolean = true): Date {
      const base = startOfDay(d);
      // getDay(): Sun=0..Sat=6
      const offset = startOnMonday
        ? (base.getDay() + 6) % 7   // Mon=0..Sun=6
        : base.getDay();            // Sun=0..Sat=6
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset);
    }
    ```
- **`getWeekDays` (lines 47-55):** add a third parameter `startOnMonday: boolean = true` and forward it to `startOfWeek`.
  - AFTER (logic):
    ```
    export function getWeekDays(today: Date, weekOffset: number, startOnMonday: boolean = true): Date[] {
      const base = startOfWeek(today, startOnMonday);
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const offset = weekOffset * 7 + i;
        days.push(new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset));
      }
      return days;
    }
    ```
- **DO NOT** touch `getDayWorkout`, `parseIsoDate`, `startOfDay`, or `isSameDay`.
- **NOTE on defaults:** Both new params default to `true` (Monday start), preserving every existing call site and the current `logDates.test.ts` expectations. Do not change existing tests.

### `src/views/log/WeekCalendarBar.tsx`
- This component is the bridge that supplies `startOnMonday` to `getWeekDays`. Per the boundary rule, make only the MINIMAL changes below — do not restructure the component.
  - **Add an import:** `import { useUserPreferencesStore } from '../../store/userPreferencesStore';`
  - **Read the preference** inside the component body:
    ```
    const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
    ```
  - **Update line 20** to pass it through:
    ```
    const days = getWeekDays(today, weekOffset, calendarStartOnMonday);
    ```
  - **Update `DOW_LABELS` (line 11)** so labels follow the chosen start. Replace the single hardcoded constant with two arrays + a derived selection:
    ```
    const MON_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const SUN_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // inside component:
    const dowLabels = calendarStartOnMonday ? MON_LABELS : SUN_LABELS;
    ```
    Then in the `.map` (line 62) use `dowLabels[i]` instead of `DOW_LABELS[i]`.

### `src/layouts/RootLayout.tsx`
- Add the dark-mode class-toggling effect here (this is the single global mount point wrapping all routed views).
  - **Add import:** `import { useUserPreferencesStore } from '../store/userPreferencesStore';`
  - **Inside `RootLayout`, read the value:**
    ```
    const darkMode = useUserPreferencesStore((s) => s.darkMode);
    ```
  - **Add a second `useEffect`** (keep the existing nav-sync effect untouched):
    ```
    useEffect(() => {
      const root = document.documentElement; // the <html> element
      if (darkMode) root.classList.add('dark-theme');
      else root.classList.remove('dark-theme');
    }, [darkMode]);
    ```
  - This effect re-runs whenever the toggle flips, and also runs again after the store hydrates from Capacitor storage.

### `src/views/ProfileView.tsx`
- Replace the current 7-line placeholder entirely with the full settings UI (see exact structure in FILES TO CREATE → ProfileView structure below). It already exists and is already routed at `/profile` in `src/router.tsx` (line 19) — DO NOT touch the router.

### `src/index.css`
- Refactor the palette so dark is a class override rather than the hardcoded default. The four routed views currently render correctly on the dark palette; defaulting `darkMode` to `true` keeps that behavior, while a user can toggle to light.
  - **Change the `:root` block (lines 2-10)** to hold the LIGHT palette:
    ```
    :root {
      --color-bg: #FFFFFF;
      --color-surface: #F2F2F2;
      --color-primary: #A855F7;
      --color-text: #111111;
      --color-text-muted: #666666;
      --color-border: #DDDDDD;
      --bottom-nav-height: 60px;
    }
    ```
  - **Add a new `.dark-theme` block immediately after** holding the existing dark values (these are the CURRENT `:root` values — preserve them exactly):
    ```
    .dark-theme {
      --color-bg: #0D0D0D;
      --color-surface: #1A1A1A;
      --color-primary: #A855F7;
      --color-text: #FFFFFF;
      --color-text-muted: #888888;
      --color-border: #2A2A2A;
    }
    ```
  - Leave everything else in the file unchanged. The `dark-theme` class is applied to `<html>` (`document.documentElement`), so the override cascades to `body` and `#root`.
  - The leading comment `/* Keep in sync with src/constants/theme.ts */` still applies; `theme.ts` mirrors the DARK values — leave `theme.ts` unchanged (it is not imported by any of the affected files).

---

## 📄 FILES TO CREATE

### `src/store/userPreferencesStore.ts`
- **Purpose:** Persisted global store for user UI preferences. Persists through the Capacitor `Preferences` engine.
- **Exact implementation (model on `src/store/navStore.ts`, but use `capacitorStorage`):**
  ```ts
  import { create } from 'zustand';
  import { persist, createJSONStorage } from 'zustand/middleware';
  import { immer } from 'zustand/middleware/immer';
  import { capacitorStorage } from './capacitorStorage';

  interface UserPreferencesState {
    darkMode: boolean;
    calendarStartOnMonday: boolean;
    toggleDarkMode: () => void;
    toggleCalendarStartOnMonday: () => void;
    setDarkMode: (value: boolean) => void;
    setCalendarStartOnMonday: (value: boolean) => void;
  }

  export const useUserPreferencesStore = create<UserPreferencesState>()(
    persist(
      immer((set) => ({
        // Defaults: dark on (preserves current app appearance),
        // week starts Monday (preserves current calendar behavior).
        darkMode: true,
        calendarStartOnMonday: true,

        toggleDarkMode: () =>
          set((state) => { state.darkMode = !state.darkMode; }),
        toggleCalendarStartOnMonday: () =>
          set((state) => { state.calendarStartOnMonday = !state.calendarStartOnMonday; }),
        setDarkMode: (value) =>
          set((state) => { state.darkMode = value; }),
        setCalendarStartOnMonday: (value) =>
          set((state) => { state.calendarStartOnMonday = value; }),
      })),
      {
        name: 'aura-user-preferences',
        storage: createJSONStorage(() => capacitorStorage),
        version: 1,
        partialize: (state) => ({
          darkMode: state.darkMode,
          calendarStartOnMonday: state.calendarStartOnMonday,
        }),
      }
    )
  );
  ```
- **Hydration note:** `capacitorStorage` is async, so on first render the store shows the in-memory defaults (`darkMode: true`, `calendarStartOnMonday: true`), then re-renders with persisted values once hydration resolves. The `RootLayout` effect and `WeekCalendarBar` selector both react to that update automatically. No manual `onRehydrateStorage` handling is required.

### `src/views/profile/profile.css`
- **Purpose:** BEM-styled settings-list using theme tokens only (match `src/views/log/log.css` conventions). No hardcoded colors — only `var(--color-*)`, except the knob may use `#fff`.
- **Required class names + intent:**
  - `.profile-view` — padding `16px` (match `.log-view`).
  - `.profile-view__title` — font-size `24px`, font-weight `700`, margin-bottom `16px`.
  - `.profile-section` — margin-bottom `24px`.
  - `.profile-section__header` — font-size `13px`, uppercase, letter-spacing, color `var(--color-text-muted)`, margin-bottom `8px`.
  - `.profile-list` — `background: var(--color-surface)`, border-radius `12px`, overflow hidden.
  - `.profile-row` — flex row, `justify-content: space-between`, `align-items: center`, padding `14px 16px`, border-bottom `1px solid var(--color-border)`.
  - `.profile-row:last-child` — `border-bottom: none`.
  - `.profile-row__label` — font-size `15px`, color `var(--color-text)`.
  - `.toggle` — switch track: width `48px`, height `28px`, border-radius `999px`, `background: var(--color-border)`, position relative, transition `background .15s`, cursor pointer, border none, padding 0.
  - `.toggle--on` — `background: var(--color-primary)`.
  - `.toggle__knob` — `22px` circle, `background: #fff`, border-radius `50%`, position absolute, top `3px`, left `3px`, transition `transform .15s`.
  - `.toggle--on .toggle__knob` — `transform: translateX(20px)`.

### `src/views/ProfileView.tsx` (REPLACE existing placeholder)
- **Purpose:** Profile tab with the "General" settings block bound to `userPreferencesStore`. ONLY the General section — no Account Details, Connected Apps, or Units (boundary rule).
- **Imports:** the new `./profile/profile.css`, and `useUserPreferencesStore` from `../store/userPreferencesStore`.
- **Store bindings (read at top of component, use individual selectors like `LogView` does):**
  ```
  const darkMode = useUserPreferencesStore((s) => s.darkMode);
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const toggleDarkMode = useUserPreferencesStore((s) => s.toggleDarkMode);
  const toggleCalendarStartOnMonday = useUserPreferencesStore((s) => s.toggleCalendarStartOnMonday);
  ```
- **Exact UI structure (JSX shape):**
  ```
  <section className="view profile-view">
    <h1 className="profile-view__title">Profile</h1>

    <div className="profile-section">
      <h2 className="profile-section__header">General</h2>
      <div className="profile-list">

        <div className="profile-row">
          <span className="profile-row__label">Dark Mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label="Dark Mode"
            className={darkMode ? 'toggle toggle--on' : 'toggle'}
            onClick={toggleDarkMode}
          >
            <span className="toggle__knob" />
          </button>
        </div>

        <div className="profile-row">
          <span className="profile-row__label">Start Week on Monday</span>
          <button
            type="button"
            role="switch"
            aria-checked={calendarStartOnMonday}
            aria-label="Start Week on Monday"
            className={calendarStartOnMonday ? 'toggle toggle--on' : 'toggle'}
            onClick={toggleCalendarStartOnMonday}
          >
            <span className="toggle__knob" />
          </button>
        </div>

      </div>
    </div>
  </section>
  ```

---

## 🛡️ EDGE CASES TO HANDLE
- **Async hydration flash:** Capacitor `Preferences` is async, so the first paint uses in-memory defaults. Because defaults are `darkMode: true` / `calendarStartOnMonday: true` (identical to today's behavior), there is no visible flash on the common path. Do NOT block rendering on hydration and do NOT add a loading spinner; the reactive selectors in `RootLayout` and `WeekCalendarBar` update the UI automatically when hydration completes.
- **DOW labels must match the start day:** When `calendarStartOnMonday` is `false`, the weekday header labels in `WeekCalendarBar` MUST switch to the Sunday-first array (`SUN_LABELS`) so headers line up with the dates from `getWeekDays`. Forgetting this produces an off-by-one mislabeled calendar — the highest-risk correctness bug in this feature.
- **Class toggle cleanup / idempotency:** Use `classList.add` / `classList.remove` on `document.documentElement` (never `className = '...'`) so the effect never clobbers other classes and is safe to run repeatedly. The `else` branch MUST remove `dark-theme` so toggling to light mode actually reverts the palette.
- **Existing tests must stay green:** `src/views/log/logDates.test.ts` calls `startOfWeek`/`getWeekDays` with no extra arg. Keeping the new params optional with a `true` default preserves Monday-start behavior so those tests pass unchanged. Do not modify that test file.
