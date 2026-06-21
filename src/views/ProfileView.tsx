import './profile/profile.css';
import { useState } from 'react';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { useWorkoutDataStore } from '../store/workoutDataStore';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { backupToCloud, restoreFromCloud } from '../services/cloudSync';
import { triggerSuccess } from '../utils/haptics';

export default function ProfileView() {
  // ── Existing prefs ──────────────────────────────────────────────────────────
  const darkMode = useUserPreferencesStore((s) => s.darkMode);
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const toggleDarkMode = useUserPreferencesStore((s) => s.toggleDarkMode);
  const toggleCalendarStartOnMonday = useUserPreferencesStore((s) => s.toggleCalendarStartOnMonday);

  // ── Biometrics (existing) ───────────────────────────────────────────────────
  const heightCm = useUserPreferencesStore((s) => s.heightCm);
  const weightKg = useUserPreferencesStore((s) => s.weightKg);
  const ageYears = useUserPreferencesStore((s) => s.ageYears);
  const sex = useUserPreferencesStore((s) => s.sex);
  const setBiometrics = useUserPreferencesStore((s) => s.setBiometrics);

  // ── New general ─────────────────────────────────────────────────────────────
  const logScoreDisplay = useUserPreferencesStore((s) => s.logScoreDisplay);
  const setLogScoreDisplay = useUserPreferencesStore((s) => s.setLogScoreDisplay);

  // ── Workout › Display ───────────────────────────────────────────────────────
  const showRepsTimeFirst = useUserPreferencesStore((s) => s.showRepsTimeFirst);
  const toggleShowRepsTimeFirst = useUserPreferencesStore((s) => s.toggleShowRepsTimeFirst);
  const showPrsDuringWorkout = useUserPreferencesStore((s) => s.showPrsDuringWorkout);
  const toggleShowPrsDuringWorkout = useUserPreferencesStore((s) => s.toggleShowPrsDuringWorkout);

  // ── Workout › Exercise Targets ──────────────────────────────────────────────
  const defaultSets = useUserPreferencesStore((s) => s.defaultSets);
  const setDefaultSets = useUserPreferencesStore((s) => s.setDefaultSets);
  const defaultRepsRange = useUserPreferencesStore((s) => s.defaultRepsRange);
  const setDefaultRepsRange = useUserPreferencesStore((s) => s.setDefaultRepsRange);
  const defaultRestBetweenSetsSec = useUserPreferencesStore((s) => s.defaultRestBetweenSetsSec);
  const setDefaultRestBetweenSetsSec = useUserPreferencesStore((s) => s.setDefaultRestBetweenSetsSec);
  const defaultRestBetweenExercisesSec = useUserPreferencesStore((s) => s.defaultRestBetweenExercisesSec);
  const setDefaultRestBetweenExercisesSec = useUserPreferencesStore((s) => s.setDefaultRestBetweenExercisesSec);

  // ── Workout › Automation ────────────────────────────────────────────────────
  const autoRestTimer = useUserPreferencesStore((s) => s.autoRestTimer);
  const toggleAutoRestTimer = useUserPreferencesStore((s) => s.toggleAutoRestTimer);
  const autoPlayVideo = useUserPreferencesStore((s) => s.autoPlayVideo);
  const toggleAutoPlayVideo = useUserPreferencesStore((s) => s.toggleAutoPlayVideo);

  // ── Account Details ─────────────────────────────────────────────────────────
  const firstName = useUserPreferencesStore((s) => s.firstName);
  const lastName = useUserPreferencesStore((s) => s.lastName);
  const phone = useUserPreferencesStore((s) => s.phone);
  const birthday = useUserPreferencesStore((s) => s.birthday);
  const gender = useUserPreferencesStore((s) => s.gender);
  const country = useUserPreferencesStore((s) => s.country);
  const city = useUserPreferencesStore((s) => s.city);
  const stateRegion = useUserPreferencesStore((s) => s.stateRegion);
  const setAccountDetails = useUserPreferencesStore((s) => s.setAccountDetails);

  // ── Units & Measurements ────────────────────────────────────────────────────
  const weightUnit = useUserPreferencesStore((s) => s.weightUnit);
  const setWeightUnit = useUserPreferencesStore((s) => s.setWeightUnit);
  const lengthUnit = useUserPreferencesStore((s) => s.lengthUnit);
  const setLengthUnit = useUserPreferencesStore((s) => s.setLengthUnit);

  // ── Notifications ───────────────────────────────────────────────────────────
  const notificationsEnabled = useUserPreferencesStore((s) => s.notificationsEnabled);
  const toggleNotificationsEnabled = useUserPreferencesStore((s) => s.toggleNotificationsEnabled);
  const restTimerSound = useUserPreferencesStore((s) => s.restTimerSound);
  const setRestTimerSound = useUserPreferencesStore((s) => s.setRestTimerSound);

  // ── Reset actions ───────────────────────────────────────────────────────────
  const resetPreferences = useUserPreferencesStore((s) => s.resetPreferences);
  const resetToSeed = useWorkoutDataStore((s) => s.resetToSeed);

  // ── Auth & cloud state ──────────────────────────────────────────────────────
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Auth handlers ───────────────────────────────────────────────────────────
  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setBusy(true);
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBackup() {
    if (!user) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      await backupToCloud(user.uid);
      triggerSuccess();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Backup failed.');
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleRestore() {
    if (!user) return;
    if (!window.confirm('This will overwrite your current local data. Are you sure?')) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      await restoreFromCloud(user.uid);
      triggerSuccess();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Restore failed.');
    } finally {
      setIsSyncing(false);
    }
  }

  // ── Data management handlers ────────────────────────────────────────────────
  function handleExport() {
    setExportError(null);
    let objectUrl: string | null = null;
    try {
      const obj = {
        preferences: useUserPreferencesStore.getState(),
        workoutData: useWorkoutDataStore.getState(),
      };
      const json = JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? undefined : v), 2);
      const blob = new Blob([json], { type: 'application/json' });
      objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'aura-data-export.json';
      a.click();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  function handleResetWorkoutData() {
    if (!window.confirm('Reset all workout data? This cannot be undone.')) return;
    resetToSeed();
    triggerSuccess();
  }

  function handleResetAllData() {
    if (!window.confirm('Erase ALL data including settings? This cannot be undone.')) return;
    resetToSeed();
    resetPreferences();
    triggerSuccess();
  }

  async function handleLogOut() {
    if (!window.confirm('Log out of Aura?')) return;
    setError(null);
    setBusy(true);
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed.');
    } finally {
      setBusy(false);
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName = (firstName + ' ' + lastName).trim() || user?.email || 'Guest';
  const metaParts = [
    heightCm != null ? `${heightCm} cm` : '—',
    weightKg != null ? `${weightKg} kg` : '—',
    ageYears != null ? `${ageYears} yrs` : '—',
    sex ?? '—',
  ];
  const metaLine = metaParts.join(' · ');
  const firstInitial = (firstName || user?.email || 'G').charAt(0).toUpperCase();

  // ── Number input helpers ────────────────────────────────────────────────────
  function parseSets(raw: string, current: number): number {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return current;
    return Math.min(20, Math.max(1, n));
  }

  function parseRest(raw: string, current: number, max: number): number {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return current;
    return Math.min(max, Math.max(0, n));
  }

  return (
    <motion.section className="view profile-view" {...pageTransition}>
      <h1 className="profile-view__title">Profile</h1>

      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-header__avatar">{firstInitial}</div>
        <div>
          <div className="profile-header__name">{displayName}</div>
          <div className="profile-header__meta">{metaLine}</div>
        </div>
      </div>

      {/* ── Account ────────────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Account</h2>
        <div className="profile-list">
          {user ? (
            <>
              <div className="profile-row">
                <span className="profile-row__label">Signed in as</span>
                <span className="profile-row__value">{user.email ?? user.uid}</span>
              </div>
              <div className="profile-row profile-row--stack">
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={handleSignOut}
                  disabled={busy}
                >
                  Sign Out
                </button>
              </div>
              <div className="profile-row profile-row--stack">
                <button
                  type="button"
                  className="auth-button auth-button--primary"
                  onClick={handleBackup}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing…' : 'Backup Data to Cloud'}
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={handleRestore}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing…' : 'Restore Data from Cloud'}
                </button>
                {syncError && <p className="auth-error">{syncError}</p>}
              </div>
            </>
          ) : (
            <div className="profile-row profile-row--stack">
              <input
                type="email"
                className="auth-input"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <div className="auth-actions">
                <button
                  type="button"
                  className="auth-button auth-button--primary"
                  onClick={handleSignIn}
                  disabled={busy || !email || !password}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={handleRegister}
                  disabled={busy || !email || !password}
                >
                  Register
                </button>
              </div>
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>

      {/* ── General ────────────────────────────────────────────────────────── */}
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

          <div className="profile-row">
            <span className="profile-row__label">Log Page Score Display</span>
            <select
              className="profile-select"
              aria-label="Log Page Score Display"
              value={logScoreDisplay}
              onChange={(e) => setLogScoreDisplay(e.target.value as 'strength_score' | 'strength_balance' | 'both')}
            >
              <option value="strength_score">Strength Score</option>
              <option value="strength_balance">Strength Balance</option>
              <option value="both">Both</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── Workout · Display ───────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Workout · Display</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Show Reps/Time First</span>
            <button
              type="button"
              role="switch"
              aria-checked={showRepsTimeFirst}
              aria-label="Show Reps/Time First"
              className={showRepsTimeFirst ? 'toggle toggle--on' : 'toggle'}
              onClick={toggleShowRepsTimeFirst}
            >
              <span className="toggle__knob" />
            </button>
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Show PRs During Workout</span>
            <button
              type="button"
              role="switch"
              aria-checked={showPrsDuringWorkout}
              aria-label="Show PRs During Workout"
              className={showPrsDuringWorkout ? 'toggle toggle--on' : 'toggle'}
              onClick={toggleShowPrsDuringWorkout}
            >
              <span className="toggle__knob" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Workout · Exercise Targets ──────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Workout · Exercise Targets</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Default Sets</span>
            <input
              type="number"
              min="1"
              max="20"
              inputMode="numeric"
              className="profile-input"
              aria-label="Default Sets"
              value={defaultSets}
              onChange={(e) => setDefaultSets(parseSets(e.target.value, defaultSets))}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Default Reps Range</span>
            <input
              type="text"
              className="profile-input"
              aria-label="Default Reps Range"
              value={defaultRepsRange}
              onChange={(e) => setDefaultRepsRange(e.target.value)}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Rest Between Sets (sec)</span>
            <input
              type="number"
              min="0"
              max="600"
              inputMode="numeric"
              className="profile-input"
              aria-label="Rest Between Sets"
              value={defaultRestBetweenSetsSec}
              onChange={(e) => setDefaultRestBetweenSetsSec(parseRest(e.target.value, defaultRestBetweenSetsSec, 600))}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Rest Between Exercises (sec)</span>
            <input
              type="number"
              min="0"
              max="600"
              inputMode="numeric"
              className="profile-input"
              aria-label="Rest Between Exercises"
              value={defaultRestBetweenExercisesSec}
              onChange={(e) => setDefaultRestBetweenExercisesSec(parseRest(e.target.value, defaultRestBetweenExercisesSec, 600))}
            />
          </div>

        </div>
      </div>

      {/* ── Workout · Automation ────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Workout · Automation</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Auto Rest Timer</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRestTimer}
              aria-label="Auto Rest Timer"
              className={autoRestTimer ? 'toggle toggle--on' : 'toggle'}
              onClick={toggleAutoRestTimer}
            >
              <span className="toggle__knob" />
            </button>
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Auto Play Video</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoPlayVideo}
              aria-label="Auto Play Video"
              className={autoPlayVideo ? 'toggle toggle--on' : 'toggle'}
              onClick={toggleAutoPlayVideo}
            >
              <span className="toggle__knob" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Account Details ─────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Account Details</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">First Name</span>
            <input
              type="text"
              className="profile-input"
              aria-label="First Name"
              value={firstName}
              onChange={(e) => setAccountDetails({ firstName: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Last Name</span>
            <input
              type="text"
              className="profile-input"
              aria-label="Last Name"
              value={lastName}
              onChange={(e) => setAccountDetails({ lastName: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Phone</span>
            <input
              type="tel"
              className="profile-input"
              aria-label="Phone"
              value={phone}
              onChange={(e) => setAccountDetails({ phone: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Birthday</span>
            <input
              type="date"
              className="profile-input"
              aria-label="Birthday"
              value={birthday}
              onChange={(e) => setAccountDetails({ birthday: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Height (cm)</span>
            <input
              type="number"
              className="profile-input"
              aria-label="Height"
              value={heightCm ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                setBiometrics({ heightCm: isNaN(n) ? null : n });
              }}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Gender</span>
            <select
              className="profile-select"
              aria-label="Gender"
              value={gender ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setAccountDetails({ gender: val === '' ? null : (val as 'male' | 'female' | 'other') });
              }}
            >
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Country</span>
            <input
              type="text"
              className="profile-input"
              aria-label="Country"
              value={country}
              onChange={(e) => setAccountDetails({ country: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">City</span>
            <input
              type="text"
              className="profile-input"
              aria-label="City"
              value={city}
              onChange={(e) => setAccountDetails({ city: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">State/Region</span>
            <input
              type="text"
              className="profile-input"
              aria-label="State/Region"
              value={stateRegion}
              onChange={(e) => setAccountDetails({ stateRegion: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Email</span>
            <span className="profile-row__value">{user?.email ?? '—'}</span>
          </div>

        </div>
      </div>

      {/* ── Units & Measurements ────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Units & Measurements</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Weight Unit</span>
            <select
              className="profile-select"
              aria-label="Weight Unit"
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Length Unit</span>
            <select
              className="profile-select"
              aria-label="Length Unit"
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value as 'cm' | 'in')}
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Notifications</h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Enable Notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Enable Notifications"
              className={notificationsEnabled ? 'toggle toggle--on' : 'toggle'}
              onClick={toggleNotificationsEnabled}
            >
              <span className="toggle__knob" />
            </button>
          </div>

          <div className="profile-row">
            <span className="profile-row__label">Rest Timer Sound</span>
            <select
              className="profile-select"
              aria-label="Rest Timer Sound"
              value={restTimerSound}
              onChange={(e) => setRestTimerSound(e.target.value as 'ding' | 'alarm')}
            >
              <option value="ding">Ding</option>
              <option value="alarm">Alarm</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── User Support ────────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">User Support</h2>
        <div className="profile-list">

          <a
            className="profile-row profile-row--link"
            href="https://auratracker.app/faq"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="profile-row__label">User Guides &amp; FAQ</span>
          </a>

          <a
            className="profile-row profile-row--link"
            href="mailto:support@auratracker.app"
          >
            <span className="profile-row__label">Contact Us</span>
          </a>

          <a
            className="profile-row profile-row--link"
            href="https://auratracker.app/feature-request"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="profile-row__label">Feature Request</span>
          </a>

        </div>
      </div>

      {/* ── Data Management ─────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h2 className="profile-section__header">Data Management</h2>
        <div className="profile-list">
          <div className="profile-row profile-row--stack">
            <button
              type="button"
              className="auth-button auth-button--secondary"
              onClick={handleExport}
            >
              Export Data
            </button>
            {exportError && <p className="auth-error">{exportError}</p>}
          </div>
          <div className="profile-row profile-row--stack">
            <button
              type="button"
              className="auth-button auth-button--secondary"
              onClick={handleResetWorkoutData}
            >
              Reset Workout Data
            </button>
          </div>
          <div className="profile-row profile-row--stack">
            <button
              type="button"
              className="auth-button auth-button--danger"
              onClick={handleResetAllData}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Session / Log Out ────────────────────────────────────────────────── */}
      {user && (
        <div className="profile-section">
          <h2 className="profile-section__header">Session</h2>
          <div className="profile-list">
            <div className="profile-row profile-row--stack">
              <button
                type="button"
                className="auth-button auth-button--danger"
                onClick={handleLogOut}
                disabled={busy}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.section>
  );
}
