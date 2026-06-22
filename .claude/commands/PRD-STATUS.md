# Aura Fitness Tracker — PRD Build-Status Tracker

> **Purpose:** Single source of truth mapping every PRD feature to its build status.
> **Maintenance:** Update the **Status / Done / To-Do** columns as work lands. Do not delete rows — flip status instead, so history stays in place.
> **Legend:** ✅ Done · 🟡 Partial · ❌ Not built · ➖ N/A / out of scope
> **Last audited:** 2026-06-22 (against working tree on `main`; verified via code search + runtime drive).
> **Last updated:** 2026-06-22 — all 8 previously-open items completed (PR2, PR3, PR7, PR8, PR9, PR10, P2.4/P3.2, M1). 460/460 tests pass; runtime-verified.

---

## 1. Global / App Shell

| # | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|:------:|-------------|--------------|:--------:|
| 1 | 4 components: Log, Plan, Progress, Profile | ✅ | `router.tsx` + `BottomNav.tsx` route all four; bottom nav with icons | — | P0 |

---

## 2. Log Tab

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| L1 | 2.1–2.2 | Week calendar bar holding weekly preset plans | ✅ | `WeekCalendarBar.tsx` renders week, shows planned workout per day | — | P0 |
| L2 | 2.3 | Start workout / log previous workout | ✅ | `ActiveWorkoutView`, `LogPastWorkoutSheet` | — | P0 |
| L3 | 2.4 | Add an extra workout for the day | ✅ | `SourcePickerSheet` → `WorkoutPickerSheet` | — | P1 |
| L4 | 2.5 | Move across weeks + calendar jump to any week | ✅ | `WeekCalendarBar` paging, `CalendarSheet` | — | P1 |
| L5 | 2.10 | "Back to today" button | ✅ | Present in `WeekCalendarBar` | — | P2 |
| L6 | 2.6 | Today's planned-exercises card | ✅ | `TodaysOverview.tsx` | — | P0 |
| L7 | 2.7 | Switch / delete planned workout / mark rest day | ✅ | `ManageTodaySheet.tsx` | — | P1 |
| L8 | 2.8 | On a rest day, still allow adding a workout | ✅ | `ManageTodaySheet` + add flow | — | P2 |
| L9 | 2.9 | Add-workout source picker (predefined / custom / library) | ✅ | `SourcePickerSheet.tsx` | — | P1 |
| L10 | 2.11 | Edit workout: duration, per-exercise sets/reps, remove/substitute/add | ✅ | `WorkoutEditorView.tsx`, `SessionExerciseActionsSheet` | — | P1 |
| L11 | 2.12 | Persist edits across navigation; commit only on Save | ✅ | Draft held in component state; `applyPlanEdit` on save | — | P0 |
| L12 | 2.13 | Start workout: duration timer, exercise list, per-exercise logging, substitute/remove/add | ✅ | `ActiveWorkoutView`, `SessionHeader`, `ExerciseList` | — | P0 |
| L13 | 2.14 | Exercise screen: video, name, muscle group, last-PR card, target card, warm-up, hint, sets w/ auto-finish, add/delete sets | ✅ | `ExerciseDetailView`, `ExerciseVideoCard`, `LastPrCard`, `TargetCard`, `WarmupCard`, `SetRow` (auto-finish on weight+reps blur) | — | P0 |
| L14 | 2.14 | Warm-up: full protocol for 1st exercise, 2 sets for 2nd, none after | ✅ | `WARMUP_SCHEMES[index]` in `pr.ts` — index 0 = 3-set, index 1 = 2-set, else none | — | P1 |
| L15 | 2.15 | Per-exercise set-completion progress bar + complete button | ✅ | `ExerciseDetailView` progress + complete | — | P1 |
| L16 | 2.16 | Auto rest timer between sets as a draggable pill | ✅ | `RestTimerPill.tsx`, `restTimerBus.ts` | — | P1 |
| L17 | 2.17 | No timer after final set; start timer when an empty new set is added | ✅ | Logic in active-session rest handling | — | P2 |
| L18 | 2.18 | 90s rest timer on completing an exercise | ✅ | Rest timer triggered on complete | — | P2 |
| L19 | 2.19 | Celebration based on exercise + workout performance | ✅ | `Celebration.tsx`; workout-level celebration (Gap E) | — | P1 |
| L20 | 2.20 | Drop empty sets on complete-exercise | ✅ | Empty-set pruning on complete | — | P2 |
| L21 | 2.21 | End early / cancel workout, with cancel-and-continue | ✅ | `EndWorkoutSheet.tsx` | — | P1 |
| L22 | 2.22 | Post-workout summary + session notes | ✅ | `PostWorkoutSummary.tsx` | — | P1 |
| L23 | 2.23 | Single vs double pulley selector for cable exercises | ✅ | `CablePulleySelector.tsx`, rendered when `isCable` | — | P2 |
| L24 | 2.24 | Set types: normal, drop set, rest-pause, failure, partials | ✅ | `SetType` union in `workout.ts`; selectable in `SetRow` | — | P2 |
| L25 | 2.25 | Create supersets | ✅ | `SupersetButton.tsx` + store superset engine | — | P2 |
| L26 | 2.26 | Per-set note button + future-reference notes | ✅ | `updateSetNote`, collapsible note input in `ExerciseDetailView` | — | P3 |
| L27 | 2.27 | Save edit → "permanent vs today"; permanent reflects in My Plans, never the predefined program | ✅ | **Safety-critical, verified.** `SaveScopeSheet` + `applyPlanEdit('permanent')` routes to a `myplan-` copy; `state.programs` untouched (unit-tested + runtime-verified byte-identical) | — | P0 |

---

## 3. Plan Tab

### 3.1 My Plans

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| P1.1 | 3.1.1 | Horizontal list, up to 3 programs added from library | ✅ | `MyPlansTab.tsx`; 3-slot guard in `applyPlanEdit` / add flow (Gap B) | — | P0 |
| P1.2 | 3.1.2 | Set one program as default → loads into Log; edits propagate | ✅ | `setActiveProgram` + `userPlan.activeProgramId` | — | P0 |
| P1.3 | 3.1.3 | Create your own plan | ✅ | `ProgramBuilderView.tsx` | — | P1 |
| P1.4 | 3.1.4 | Weekday cards (Sun-start) assignable to workouts | ✅ | `DayAssignmentModal.tsx`; Sunday-start honored | — | P1 |
| P1.5 | 3.1.5 | Workout list under weekdays; add/delete without touching predefined program | ✅ | `WorkoutsTab` scoped editing | — | P1 |
| P1.6 | 3.1.6 | Create your own workouts | ✅ | `WorkoutBuilderView.tsx` | — | P1 |
| P1.7 | 3.1.7 | Edit exercises per workout: sets + rest between sets/exercises | ✅ | `WorkoutEditorView` with rest-interval schema (Gap C) | — | P1 |

### 3.2 Programs

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| P2.1 | 3.2.1 | List of programs | ✅ | `ProgramsTab.tsx` | — | P0 |
| P2.2 | 3.2.2 | Open program → see its workouts/exercises | ✅ | `ProgramDetailView.tsx` | — | P0 |
| P2.3 | 3.2.3 | Edit predefined program only after adding to My Plans | ✅ | "Edit Program Exercises" appears only after "Add to My Plans" | — | P1 |
| P2.4 | 3.2.4 | Programs sourced (PPL, body-part splits, etc.) | ✅ | **Verified:** `data/seedPrograms.ts` has 6 programs — PPL, Upper/Lower, Arnold Split, Full Body 3-Day, Push/Pull, Bro Split (5-Day) | — | P2 |
| P2.5 | 3.2.5 | Create your own programs | ✅ | `ProgramBuilderView` | — | P1 |
| P2.6 | 3.2.6 | Edit exercises/sets/rest per workout | ✅ | `WorkoutEditorView` | — | P1 |
| P2.7 | 3.2.7 | Search bar + filters | ✅ | Search/filter in `ProgramsTab` | — | P2 |

### 3.3 Workouts

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| P3.1 | 3.3.1 | List of workouts | ✅ | `WorkoutsTab.tsx` | — | P0 |
| P3.2 | 3.3.2–3.3.3 | Workouts sourced broadly, not just program-bound | ✅ | **Verified:** `data/seedWorkouts.ts` has 15 workouts — push/pull/legs, upper/lower, chest/back/shoulder/arm days, full body, core, dumbbell-only, bodyweight circuit, chest&triceps, back&biceps | — | P2 |
| P3.3 | 3.3.4 | Create your own workouts | ✅ | `WorkoutBuilderView` / `WorkoutBuilderModal` | — | P1 |
| P3.4 | 3.3.5 | Edit exercises/sets/rest | ✅ | `WorkoutEditorView` | — | P1 |
| P3.5 | 3.3.6 | Search bar + filters | ✅ | In `WorkoutsTab` | — | P2 |

### 3.4 Exercises

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| P4.1 | 3.4.1–3.4.2 | Search + two-row filters (body part, equipment) | ✅ | `ExercisesTab.tsx` | — | P1 |
| P4.2 | 3.4.3 | Create exercise (name, category, equipment, difficulty, muscle, form tips, image/video URLs) | ✅ | `CreateExerciseSheet.tsx` → `createExercise` | — | P1 |
| P4.3 | 3.4.4 | 2-per-row catalog with images + muscles | ✅ | `ExercisesTab` grid; `MediaPlaceholder` | — | P2 |
| P4.4 | 3.4.5–3.4.7 | Exercise page: image+play→video, category/difficulty/equipment row, pro-tips card | ✅ | `ExerciseDetailPage.tsx` | — | P1 |
| P4.5 | 3.4.8 | Muscle-activation horizontal bars + SVG body diagram | ✅ | Activation `ProgressBar`s + `BodyMap.tsx` SVG (Gap D) | — | P1 |
| P4.6 | 3.4.9 | Add to today / add to plan → choose workout → replace or add | ✅ | `replaceExerciseInWorkout` + pick-action/replace-slot sheet | — | P1 |

---

## 4. Progression Tab

### 4.1 Stats

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| S1 | 4.1.2–4.1.3 | GitHub-style consistency heatmap, monthly nav, graded by completion | ✅ | `ConsistencyHeatmap.tsx` | — | P1 |
| S2 | 4.1.4 | Weekly stats: most-targeted muscle group by volume/sets (line chart) | ✅ | `WeeklyVolumeChart.tsx`, `statsDerivations.ts` | — | P1 |
| S3 | 4.1.5 | Lifetime stats cards (sessions, sets, volume, PRs) | ✅ | `LifetimeStatsCards.tsx` | — | P1 |
| S4 | 4.1.6 | Personal records grouped by category | ✅ | `PersonalRecords.tsx` | — | P1 |

### 4.2.1 Measurements

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| M1 | 4.2.1.0 | Progress graph per measurement | ✅ | Weight card + every measurement row is tappable → opens a per-metric trend AreaChart (`view==='measure'` in `BodyTab.tsx`, `buildMeasureSeries`); unit-aware | — | P2 |
| M2 | 4.2.1.1 | Body-fat % card | ✅ | `latestBF` card in `BodyTab` | — | P2 |
| M3 | 4.2.1.2 | Current measurements card (weight, neck, chest, waist, hips, arms, thighs, shoulders) | ✅ | `MEASUREMENT_ROWS` in `BodyTab` | — | P2 |
| M4 | 4.2.1.3 | "?" how-to-measure help | ✅ | `MeasureHelpModal.tsx` | — | P3 |
| M5 | 4.2.1.6 | Log measurements (partial fills allowed) | ✅ | `BodyLogModal.tsx` | — | P2 |
| M6 | 4.2.1.4 | Measurement history | ✅ | History view in `BodyTab` | — | P2 |
| M7 | 4.2.1.5 | Photo progress library w/ side-by-side / up-down compare | ✅ | `PhotoLibrary.tsx` | — | P2 |

### 4.2.2 Nutrition

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| N1 | 4.2.2.0 | Weight-progress graph | ✅ | `NutritionTab.tsx` chart | — | P2 |
| N2 | 4.2.2.1 | Details card (height, weight, age, sex, activity, target weight, add photo) | ✅ | `NutritionTab` biometrics; target weight + photo (Gap F) | — | P1 |
| N3 | 4.2.2.2 | BMI + TDEE cards | ✅ | `calculateTDEE`, BMI calc in `nutritionCalculator.ts` | — | P1 |
| N4 | 4.2.2.3 | Goals: fat loss, gain muscle, lean gain, maintain | ✅ | Goals incl. `lean_gain` (Gap F) | — | P1 |
| N5 | 4.2.2.4 | Macro split (balanced, high carb, high protein, keto) | ✅ | `calculateMacros` + split labels (Gap F) | — | P1 |
| N6 | 4.2.2.5 | Daily targets (protein, carbs, fats, fiber) | ✅ | Macro bars incl. fiber | — | P1 |

---

## 5. Profile Tab

| # | PRD ref | Feature | Status | What's Done | What's To-Do | Priority |
|---|---------|---------|:------:|-------------|--------------|:--------:|
| PR1 | 5.1 | Profile: photo, name, age, height, weight, sex — synced to Body tab | ✅ | `ProfileView` header + shared `userPreferencesStore`; photo upload (Gap G) | — | P1 |
| PR2 | 5.2.1 | General: dark mode, week start Mon/Sun, log strength score/balance/both | ✅ | New `StrengthSummary` card on Log honors `logScoreDisplay` (score / balance / both); `getStrengthScore` + `getStrengthBalance` derivations (unit-tested, runtime-verified) | — | P2 |
| PR3 | 5.3.1 | Workout display: reps/time-first, weight-first, show PRs during workout | ✅ | `showPrsDuringWorkout` gates `LastPrCard` in `ExerciseDetailView`; `showRepsTimeFirst` reorders weight/reps columns in `ExerciseLogger` header + `SetRow` inputs | — | P2 |
| PR4 | 5.3.2 | Exercise target defaults (sets 3, reps 6–10, rest 1m / 1m30s) | ✅ | Defaults in `userPreferencesStore` + used by `WorkoutEditorView` | — | P2 |
| PR5 | 5.3.3–5.3.4 | Auto rest timer, auto-play video toggles | ✅ | `autoRestTimer`, `autoPlayVideo` | — | P2 |
| PR6 | 5.4 | Account details (photo, name, email, phone, birthday, gender, height, country/city/state, export, reset, delete) | ✅ | All fields in `ProfileView`; export JSON; reset-all/reset-workout; delete-account now also deletes cloud backup | — | P1 |
| PR7 | 5.5 | Notifications: enable + rest-timer sound (ding/alarm) | ✅ | `utils/restAlerts.ts`: Web-Audio synth tone (ding/alarm) + Web Notification fired on rest-timer completion in `RestTimerPill` (gated by prefs); toggle requests OS permission; sound dropdown previews. App-level (no native plugin, per scope decision) | — | P2 |
| PR8 | 5.6 | Units: weight kg/lbs, length in/cm | ✅ | `utils/units.ts` + `useUnits()` hook; display-only conversion wired across Log (SetRow/ExerciseLogger/TargetCard/LastPrCard/WarmupCard/Celebration/PostWorkoutSummary/pr.ts), stats (PRs/Lifetime/WeeklyVolume), Body, Nutrition, Profile. Inputs convert back to canonical kg/cm. Unit-tested | — | P2 |
| PR9 | 5.7 | Connected apps: Google Health / Apple Health | ✅ | Connect now requires explicit consent dialog; truthful "Connected · sharing…" / "Not connected" status; disconnect immediate. App-level consent flow (no native HealthKit/Fit bridge, per scope decision) | — | P3 |
| PR10 | 5.8 | User support: guides & FAQ, contact, feature request | ✅ | **Verified reachable** on Connected & Support screen: User Guides & FAQ (link), Contact Us (mailto), Feature Request (link), + Privacy/Terms | — | P3 |
| PR11 | 5.9 | Log out | ✅ | `signOut` in `ProfileView` | — | P1 |

---

## Open Items Summary

**None.** All previously-open items were completed on 2026-06-22. Every PRD row is now ✅.

Two items were completed at **app level by explicit scope decision** (no native Capacitor plugins): PR7 notifications use the Web Notifications/Web Audio APIs, and PR9 health-app "connect" is a consent + status flow, not a HealthKit/Google Fit bridge. If native device integration is later required, re-open PR7/PR9 and add `@capacitor/local-notifications` + a health plugin.

Units (PR8) are **display-only**: all data remains stored canonically in kg/cm; conversion happens at the display/input edges only.

> **Update protocol:** when an open item lands, change its row Status to ✅, move the detail from *To-Do* → *Done*, and update the **Last audited** date. Keep the row.
