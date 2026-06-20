# IMPLEMENTATION SPEC

## ⚠️ OPEN QUESTIONS
None. All decisions are locked below.

## 🏗️ ARCHITECTURE & PATTERNS
- **Existing Patterns to Match:**
  - `src/components/BottomNav.tsx` — default-exported function component, BEM class names (`block__element--modifier`), co-located `.css` import at top of file.
  - `src/components/BottomNav.css` — plain CSS file, uses theme CSS variables (`var(--color-surface)` etc.), `-webkit-tap-highlight-color: transparent` for mobile tap flash, `env(safe-area-inset-bottom)` awareness.
  - `src/store/workoutDataStore.ts` — consumed via `useWorkoutDataStore((s) => s.field)` selector calls. Helper selectors `getActiveProgram()` / `getExerciseById(id)` are functions stored ON state; call them as `useWorkoutDataStore((s) => s.getActiveProgram)()` or pull the function then invoke.
  - `src/types/workout.ts` — import all types via `import type`.
  - `src/index.css` — theme tokens: `--color-bg #0D0D0D`, `--color-surface #1A1A1A`, `--color-primary #A855F7`, `--color-text #FFFFFF`, `--color-text-muted #888888`, `--color-border #2A2A2A`. NOTE: the variable is named `--color-bg` (NOT `--color-background`). Use `--color-bg`.

- **Core Strategy:** Replace the `PlanView.tsx` stub entirely. `PlanView` owns sub-tab state via local React `useState` (a tab index — NOT nested routes, NOT react-router). It renders a horizontal sub-tab bar and conditionally mounts one of four presentational sub-views. Each sub-view reads directly from `useWorkoutDataStore`. No editing, no mutations — display + sub-tab switching only.

- **Hard Rules for the Coder:**
  1. No Tailwind. No CSS-in-JS / styled-components. No inline `style={{}}` objects except for one allowed dynamic case noted below. Use plain `.css` files with BEM classes.
  2. All TypeScript. All components are `export default function`.
  3. Do NOT modify the store, types, or seed data. Read-only consumption.
  4. Do NOT add react-router routes for sub-tabs.

## 📝 FILES TO MODIFY

### `src/views/PlanView.tsx`
- **Changes:** Replace the entire file contents (currently a 7-line stub).
- New behavior:
  - `import './PlanView.css';`
  - Define a local const array:
    ```
    const SUB_TABS = ['My Plans', 'Programs', 'Workouts', 'Exercises'] as const;
    type SubTab = typeof SUB_TABS[number];
    ```
  - `const [activeSubTab, setActiveSubTab] = useState<SubTab>('My Plans');`
  - Render structure:
    ```
    <section className="view plan-view">
      <h1 className="plan-view__title">Plan</h1>
      <nav className="plan-tabs" role="tablist">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            className={tab === activeSubTab ? 'plan-tabs__tab plan-tabs__tab--active' : 'plan-tabs__tab'}
            onClick={() => setActiveSubTab(tab)}
          >{tab}</button>
        ))}
      </nav>
      <div className="plan-view__content">
        {activeSubTab === 'My Plans' && <MyPlansTab />}
        {activeSubTab === 'Programs' && <ProgramsTab />}
        {activeSubTab === 'Workouts' && <WorkoutsTab />}
        {activeSubTab === 'Exercises' && <ExercisesTab />}
      </div>
    </section>
    ```
  - Import the four tab components from `./plan/`.
  - Keep the existing `className="view"` on the section (other views use it) and add `plan-view`.

## 📄 FILES TO CREATE

All new component files live under `src/views/plan/`. One shared CSS file `src/views/plan/plan.css` holds card/grid/list styles reused across sub-tabs. `PlanView.css` lives next to `PlanView.tsx` and holds only the sub-tab bar + layout styles.

### `src/views/PlanView.css`
- **Purpose:** Styles for the Plan view title, sub-tab bar, and content wrapper.
- **Required classes & rules:**
  - `.plan-view` → `padding: 16px;`
  - `.plan-view__title` → `font-size: 24px; font-weight: 700; margin-bottom: 16px;`
  - `.plan-tabs` → `display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch;` (horizontal scroll so 4 tabs never overflow on narrow phones).
  - `.plan-tabs__tab` → `flex: 0 0 auto; padding: 8px 14px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface); color: var(--color-text-muted); font-size: 13px; font-weight: 500; white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent;`
  - `.plan-tabs__tab--active` → `background: var(--color-primary); color: var(--color-text); border-color: var(--color-primary);`
  - `.plan-view__content` → `display: block;`

### `src/views/plan/plan.css`
- **Purpose:** Shared catalog/card/list/empty-state styles for all four sub-tabs.
- **Required classes & rules:**
  - `.plan-card` → `background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px;`
  - `.plan-card__name` → `font-size: 16px; font-weight: 600; margin-bottom: 4px;`
  - `.plan-card__sub` → `font-size: 13px; color: var(--color-text-muted); line-height: 1.4;`
  - `.plan-grid` → `display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;`
  - `.plan-list` → `display: flex; flex-direction: column; gap: 12px;`
  - `.plan-badge` → `display: inline-block; margin-top: 8px; padding: 2px 8px; border-radius: 6px; background: rgba(168, 85, 247, 0.15); color: var(--color-primary); font-size: 11px; font-weight: 600;`
  - `.plan-empty` → `padding: 32px 16px; text-align: center; color: var(--color-text-muted); font-size: 14px;`
  - `.plan-progress` → `margin-top: 12px; font-size: 13px; color: var(--color-text);`
  - `.plan-progress__bar` → `margin-top: 6px; height: 6px; border-radius: 3px; background: var(--color-border); overflow: hidden;`
  - `.plan-progress__fill` → `height: 100%; background: var(--color-primary);` (width set inline — see allowed dynamic style below).

### `src/views/plan/MyPlansTab.tsx`
- **Purpose:** Shows the active user plan as a single card.
- **Data flow:**
  - `const userPlan = useWorkoutDataStore((s) => s.userPlan);`
  - `const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram);` then `const activeProgram = getActiveProgram();`
  - `import '../plan/plan.css';` (or `./plan.css` since same dir — use `./plan.css`).
- **Render:**
  - If `userPlan == null` OR `activeProgram == null` → render `<div className="plan-empty">No active plan. Pick a program to get started.</div>`.
  - Else render one `.plan-card`:
    - `.plan-card__name` = `activeProgram.name`
    - `.plan-card__sub` = `activeProgram.description`
    - A `.plan-progress` block:
      - Line text: `Week {userPlan.currentWeek} · Day {userPlan.currentDay} of 7`
      - Sub line: `Started {formatStartDate(userPlan.startDate)}` (see helper below).
      - `.plan-progress__bar` containing `.plan-progress__fill` with **allowed inline style** `style={{ width: `${(userPlan.currentDay / 7) * 100}%` }}`. This is the single permitted inline style in the spec (dynamic width).
- **Helper (define locally in this file):**
  ```
  function formatStartDate(iso: string): string {
    // iso is 'YYYY-MM-DD'. Render as 'Jun 20, 2026'. Parse manually to avoid TZ shift.
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  ```
  Note: parse via the numeric `new Date(y, m-1, d)` form (local time) — do NOT pass the raw ISO string to `new Date()` (that parses as UTC and can shift the day backward on negative-offset timezones).

### `src/views/plan/ProgramsTab.tsx`
- **Purpose:** Grid of all programs.
- **Data flow:** `const programs = useWorkoutDataStore((s) => s.programs);`
- **Render:**
  - If `programs.length === 0` → `.plan-empty` with text `No programs yet.`
  - Else `<div className="plan-grid">` mapping each `program` (key=`program.id`) to a `.plan-card`:
    - `.plan-card__name` = `program.name`
    - `.plan-card__sub` = `program.description`
    - `.plan-badge` = `${program.exercises.length} exercises`

### `src/views/plan/WorkoutsTab.tsx`
- **Purpose:** Display workout sessions. DECISION: the data model has NO explicit workout-session entity. We synthesize a display from the active program's exercises grouped into days. Locked approach: treat each `ProgramExercise` of the active program as one row in a single "Day 1 — Full Session" list. Do NOT invent multiple days (no day field exists). Render the active program's exercises as a flat session list.
- **Data flow:**
  - `const getActiveProgram = useWorkoutDataStore((s) => s.getActiveProgram); const activeProgram = getActiveProgram();`
  - `const getExerciseById = useWorkoutDataStore((s) => s.getExerciseById);`
- **Render:**
  - If `activeProgram == null` OR `activeProgram.exercises.length === 0` → `.plan-empty` with text `No active workout. Select a program first.`
  - Else:
    - A small heading row: a `.plan-card__name` element reading `${activeProgram.name} — Session`.
    - `<div className="plan-list">` mapping each `progEx` (key=`progEx.exerciseId`) to a `.plan-card`:
      - Resolve `const ex = getExerciseById(progEx.exerciseId);`
      - `.plan-card__name` = `ex ? ex.name : progEx.exerciseId` (fallback to id if exercise missing).
      - `.plan-card__sub` = `${progEx.sets} sets × ${progEx.repsMin}–${progEx.repsMax} reps` (use en-dash `–` between reps).

### `src/views/plan/ExercisesTab.tsx`
- **Purpose:** Grid of all 5 exercises.
- **Data flow:** `const exercises = useWorkoutDataStore((s) => s.exercises);`
- **Render:**
  - If `exercises.length === 0` → `.plan-empty` with text `No exercises in catalog.`
  - Else `<div className="plan-grid">` mapping each `ex` (key=`ex.id`) to a `.plan-card`:
    - `.plan-card__name` = `ex.name`
    - `.plan-card__sub` = `ex.muscleGroup`
    - `.plan-badge` = `${ex.defaultSets} × ${ex.defaultRepsMin}–${ex.defaultRepsMax}`

## 🛡️ EDGE CASES TO HANDLE
- **Null active program / null userPlan:** `getActiveProgram()` returns `WorkoutProgram | undefined` and `userPlan` can be `null`. MyPlansTab and WorkoutsTab MUST render the `.plan-empty` fallback rather than crash on property access. Use `== null` checks (covers both `null` and `undefined`).
- **Orphaned exercise reference:** A `ProgramExercise.exerciseId` may not resolve via `getExerciseById` (returns `undefined`). WorkoutsTab must fall back to displaying the raw `exerciseId` string, never `undefined.name`.
- **Sub-tab bar overflow on narrow phones:** Four pill tabs can exceed a 320px viewport. `.plan-tabs` MUST be horizontally scrollable (`overflow-x: auto`, `flex: 0 0 auto` on tabs, `white-space: nowrap`) so tabs never wrap or get clipped. Content area must not shift the fixed bottom nav (the parent `.app-content` already reserves `--bottom-nav-height`).
