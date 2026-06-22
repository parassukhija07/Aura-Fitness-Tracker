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
  deleteUser,
} from 'firebase/auth';
import { backupToCloud, restoreFromCloud, deleteCloudBackup } from '../services/cloudSync';
import { LegalSheet } from './profile/LegalSheet';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../content/legal';
import { triggerSuccess } from '../utils/haptics';
import { useStatsDataStore } from '../store/statsDataStore';
import { useUnits } from '../utils/units';
import { requestNotificationPermission, playRestSound } from '../utils/restAlerts';
import {
  GearIcon,
  DumbbellIcon,
  PersonIcon,
  BellIcon,
  GlobeIcon,
  HeartIcon,
  InfoIcon,
  LogoutIcon,
  EditIcon,
} from '../components/icons/AuraIcons';

// Longest run of consecutive days ending today (or most recent), from completed dates.
function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const sorted = [...dates].sort();
  let cursor = new Date(sorted[sorted.length - 1] + 'T00:00:00');
  let streak = 0;
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  while (set.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ProfileView() {
  // ── Existing prefs ──────────────────────────────────────────────────────────
  const darkMode = useUserPreferencesStore((s) => s.darkMode);
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const toggleDarkMode = useUserPreferencesStore((s) => s.toggleDarkMode);
  const toggleCalendarStartOnMonday = useUserPreferencesStore((s) => s.toggleCalendarStartOnMonday);

  const { fmtWeight, fmtLength, lengthToCm, lengthInput, lengthSuffix } = useUnits();

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

  // Turning notifications ON requests OS permission first; only flip the toggle
  // on success so the stored state reflects what will actually fire.
  async function handleToggleNotifications() {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    toggleNotificationsEnabled();
  }

  // ── Gap F/G new store values ────────────────────────────────────────────────
  const avatarDataUrl = useUserPreferencesStore((s) => s.avatarDataUrl);
  const setAvatar = useUserPreferencesStore((s) => s.setAvatar);

  // ── Reset actions ───────────────────────────────────────────────────────────
  const resetPreferences = useUserPreferencesStore((s) => s.resetPreferences);
  const resetToSeed = useWorkoutDataStore((s) => s.resetToSeed);

  // ── Connected apps ──────────────────────────────────────────────────────────
  const appleHealthEnabled = useUserPreferencesStore((s) => s.appleHealthEnabled);
  const googleHealthEnabled = useUserPreferencesStore((s) => s.googleHealthEnabled);
  const toggleAppleHealth = useUserPreferencesStore((s) => s.toggleAppleHealth);
  const toggleGoogleHealth = useUserPreferencesStore((s) => s.toggleGoogleHealth);

  // Connecting a health app requires explicit consent. Disconnecting is immediate.
  function handleConnectHealth(provider: 'apple' | 'google') {
    const enabled = provider === 'apple' ? appleHealthEnabled : googleHealthEnabled;
    const toggle = provider === 'apple' ? toggleAppleHealth : toggleGoogleHealth;
    const name = provider === 'apple' ? 'Apple Health' : 'Google Health';
    if (!enabled) {
      const ok = window.confirm(
        `Connect ${name}? Aura will share your workout and weight data with ${name} so your records stay in sync. You can disconnect anytime.`
      );
      if (!ok) return;
    }
    toggle();
  }

  // ── Sub-screen navigation (hub-and-spoke, PROF-01 → PROF-02…05) ──────────────
  const [screen, setScreen] = useState<'home' | 'workout' | 'account' | 'preferences' | 'connected'>('home');
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null);

  // ── Lifetime stats (read-only, for identity card) ───────────────────────────
  const lifetimeStats = useStatsDataStore((s) => s.lifetimeStats);
  const completedWorkoutDates = useStatsDataStore((s) => s.completedWorkoutDates);
  const streak = computeStreak(completedWorkoutDates);

  // ── Auth & cloud state ──────────────────────────────────────────────────────
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDeleteCloud() {
    if (!user) return;
    if (!window.confirm('Permanently delete your cloud backup? Local data is kept.')) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      await deleteCloudBackup(user.uid);
      triggerSuccess();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Delete failed.');
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

  // ── Gap G: Avatar upload ────────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Compress via canvas to keep data URL small
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 120; // 120x120 px max
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setAvatar(compressed);
        } else {
          setAvatar(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  // ── Gap G: Delete account ───────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!user || !auth.currentUser) return;
    if (!window.confirm('Permanently delete your account and all cloud data? This cannot be undone.')) return;
    setDeleteError(null);
    setBusy(true);
    try {
      // Delete the Firestore users/{uid} doc first, while still authenticated —
      // deleteUser revokes the credential that the security rules require.
      await deleteCloudBackup(user.uid);
      await deleteUser(auth.currentUser);
      resetToSeed();
      resetPreferences();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed.';
      if (msg.includes('requires-recent-login') || msg.includes('recent-login')) {
        setDeleteError('Please sign out and sign in again before deleting your account.');
      } else {
        setDeleteError(msg);
      }
    } finally {
      setBusy(false);
    }
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
    ageYears != null ? `${ageYears}` : null,
    heightCm != null ? fmtLength(heightCm) : null,
    weightKg != null ? fmtWeight(weightKg) : null,
    sex ? sex.charAt(0).toUpperCase() + sex.slice(1) : null,
  ].filter(Boolean) as string[];
  const metaLine = metaParts.length ? metaParts.join(' · ') : 'Add your details';
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

  const SCREEN_TITLES: Record<typeof screen, string> = {
    home: 'Profile',
    workout: 'Workout',
    account: 'Account',
    preferences: 'Preferences',
    connected: 'Connected & Support',
  };

  return (
    <motion.section className="view profile-view" {...pageTransition}>
      {screen === 'home' ? (
        <h1 className="profile-view__title t-large-title">Profile</h1>
      ) : (
        <div className="profile-nav">
          <button type="button" className="profile-nav__back" onClick={() => setScreen('home')}>
            ‹ Profile
          </button>
          <h1 className="profile-nav__title">{SCREEN_TITLES[screen]}</h1>
          <span className="profile-nav__spacer" aria-hidden="true" />
        </div>
      )}

      {/* ── Identity card (PROF-01) ─────────────────────────────────────── */}
      {screen === 'home' && (
      <div className="profile-id-card">
        <div className="profile-id-card__top">
          <label className="profile-id-card__avatar profile-id-card__avatar--btn" aria-label="Change profile photo">
            {avatarDataUrl
              ? <img src={avatarDataUrl} alt="Profile" className="profile-id-card__avatar-img" />
              : firstInitial}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </label>
          <div className="profile-id-card__text">
            <div className="profile-id-card__name">{displayName}</div>
            <div className="profile-id-card__meta">{metaLine}</div>
          </div>
          <span className="profile-id-card__edit" aria-hidden="true">
            <EditIcon size={18} />
          </span>
        </div>
        <div className="profile-id-card__stats">
          <div className="profile-id-stat">
            <div className="profile-id-stat__num">{lifetimeStats.totalSessions.toLocaleString('en-US')}</div>
            <div className="profile-id-stat__label">Sessions</div>
          </div>
          <div className="profile-id-stat__sep" />
          <div className="profile-id-stat">
            <div className="profile-id-stat__num">{lifetimeStats.totalPRs.toLocaleString('en-US')}</div>
            <div className="profile-id-stat__label">PRs</div>
          </div>
          <div className="profile-id-stat__sep" />
          <div className="profile-id-stat">
            <div className="profile-id-stat__num">{streak}</div>
            <div className="profile-id-stat__label">Day streak</div>
          </div>
        </div>
      </div>
      )}

      {/* ── Home nav list (PROF-01) ─────────────────────────────────────── */}
      {screen === 'home' && (
        <>
          <div className="sec-label profile-home-label">Settings</div>
          <div className="profile-list profile-nav-list">
            <button type="button" className="profile-nav-row" onClick={() => setScreen('preferences')}>
              <span className="profile-sec-ic" style={{ background: 'var(--text-2)' }}><GearIcon size={15} /></span>
              <span className="profile-nav-row__label">General &amp; Preferences</span>
              <span className="profile-nav-row__chev">›</span>
            </button>
            <button type="button" className="profile-nav-row" onClick={() => setScreen('workout')}>
              <span className="profile-sec-ic" style={{ background: 'var(--accent)' }}><DumbbellIcon size={15} /></span>
              <span className="profile-nav-row__label">Workout</span>
              <span className="profile-nav-row__chev">›</span>
            </button>
            <button type="button" className="profile-nav-row" onClick={() => setScreen('account')}>
              <span className="profile-sec-ic" style={{ background: 'var(--blue)' }}><PersonIcon size={15} /></span>
              <span className="profile-nav-row__label">Account Details</span>
              <span className="profile-nav-row__chev">›</span>
            </button>
            <button type="button" className="profile-nav-row" onClick={() => setScreen('connected')}>
              <span className="profile-sec-ic" style={{ background: 'var(--green)' }}><HeartIcon size={15} /></span>
              <span className="profile-nav-row__label">Connected &amp; Support</span>
              <span className="profile-nav-row__chev">›</span>
            </button>
          </div>
          {user && (
            <button
              type="button"
              className="auth-button auth-button--danger profile-logout profile-home-logout"
              onClick={handleLogOut}
              disabled={busy}
            >
              <LogoutIcon size={17} /> Log Out
            </button>
          )}
        </>
      )}

      {/* ── Account (auth/cloud) ───────────────────────────────────────────── */}
      {screen === 'account' && (
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
                <button
                  type="button"
                  className="auth-button auth-button--danger"
                  onClick={handleDeleteCloud}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Working…' : 'Delete Cloud Backup'}
                </button>
                {syncError && <p className="auth-error">{syncError}</p>}
              </div>
              {/* Gap G: Delete Account */}
              <div className="profile-row profile-row--stack">
                <button
                  type="button"
                  className="auth-button auth-button--danger"
                  onClick={handleDeleteAccount}
                  disabled={busy}
                >
                  Delete Account
                </button>
                {deleteError && <p className="auth-error">{deleteError}</p>}
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
      )}

      {/* ── General ────────────────────────────────────────────────────────── */}
      {screen === 'preferences' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--text-2)' }}><GearIcon size={15} /></span>
          General
        </h2>
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
      )}

      {/* ── Workout · Display ───────────────────────────────────────────────── */}
      {screen === 'workout' && (
      <>
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--accent)' }}><DumbbellIcon size={15} /></span>
          Workout · Display
        </h2>
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
      </>
      )}

      {/* ── Account Details ─────────────────────────────────────────────────── */}
      {screen === 'account' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--blue)' }}><PersonIcon size={15} /></span>
          Account Details
        </h2>
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
            <span className="profile-row__label">Height ({lengthSuffix})</span>
            <input
              type="number"
              className="profile-input"
              aria-label="Height"
              defaultValue={lengthInput(heightCm)}
              key={lengthSuffix}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                setBiometrics({ heightCm: isNaN(n) ? null : lengthToCm(n) });
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
      )}

      {/* ── Units & Measurements ────────────────────────────────────────────── */}
      {screen === 'preferences' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--purple)' }}><GlobeIcon size={15} /></span>
          Units & Measurements
        </h2>
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
      )}

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      {screen === 'preferences' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--red)' }}><BellIcon size={15} /></span>
          Notifications
        </h2>
        <div className="profile-list">

          <div className="profile-row">
            <span className="profile-row__label">Enable Notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Enable Notifications"
              className={notificationsEnabled ? 'toggle toggle--on' : 'toggle'}
              onClick={handleToggleNotifications}
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
              onChange={(e) => {
                const v = e.target.value as 'ding' | 'alarm';
                setRestTimerSound(v);
                playRestSound(v); // preview the chosen sound
              }}
            >
              <option value="ding">Ding</option>
              <option value="alarm">Alarm</option>
            </select>
          </div>

        </div>
      </div>
      )}

      {/* ── Connected Apps (PROF-05) ────────────────────────────────────────── */}
      {screen === 'connected' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--green)' }}><HeartIcon size={15} /></span>
          Connected Apps
        </h2>
        <div className="profile-list">
          <div className="profile-row">
            <span className="profile-row__label">
              Apple Health
              <span className="profile-row__sub">{appleHealthEnabled ? 'Connected · sharing workouts & weight' : 'Not connected'}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={appleHealthEnabled}
              aria-label="Apple Health"
              className={appleHealthEnabled ? 'toggle toggle--on' : 'toggle'}
              onClick={() => handleConnectHealth('apple')}
            >
              <span className="toggle__knob" />
            </button>
          </div>
          <div className="profile-row">
            <span className="profile-row__label">
              Google Health
              <span className="profile-row__sub">{googleHealthEnabled ? 'Connected · sharing workouts & weight' : 'Not connected'}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={googleHealthEnabled}
              aria-label="Google Health"
              className={googleHealthEnabled ? 'toggle toggle--on' : 'toggle'}
              onClick={() => handleConnectHealth('google')}
            >
              <span className="toggle__knob" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── User Support ────────────────────────────────────────────────────── */}
      {screen === 'connected' && (
      <div className="profile-section">
        <h2 className="profile-section__header">
          <span className="profile-sec-ic" style={{ background: 'var(--text-3)' }}><InfoIcon size={15} /></span>
          User Support
        </h2>
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

          <button
            type="button"
            className="profile-row profile-row--link"
            onClick={() => setLegal('privacy')}
          >
            <span className="profile-row__label">Privacy Policy</span>
          </button>

          <button
            type="button"
            className="profile-row profile-row--link"
            onClick={() => setLegal('terms')}
          >
            <span className="profile-row__label">Terms of Service</span>
          </button>

        </div>
      </div>
      )}

      {/* ── Data Management ─────────────────────────────────────────────────── */}
      {screen === 'account' && (
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
      )}

      {/* ── Session / Log Out ────────────────────────────────────────────────── */}
      {screen === 'account' && user && (
        <div className="profile-section">
          <h2 className="profile-section__header">Session</h2>
          <div className="profile-list">
            <div className="profile-row profile-row--stack">
              <button
                type="button"
                className="auth-button auth-button--danger profile-logout"
                onClick={handleLogOut}
                disabled={busy}
              >
                <LogoutIcon size={17} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <LegalSheet
        open={legal === 'privacy'}
        title="Privacy Policy"
        sections={PRIVACY_POLICY}
        onClose={() => setLegal(null)}
      />
      <LegalSheet
        open={legal === 'terms'}
        title="Terms of Service"
        sections={TERMS_OF_SERVICE}
        onClose={() => setLegal(null)}
      />

    </motion.section>
  );
}
