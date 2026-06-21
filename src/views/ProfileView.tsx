import './profile/profile.css';
import { useState } from 'react';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/motion';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export default function ProfileView() {
  const darkMode = useUserPreferencesStore((s) => s.darkMode);
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const toggleDarkMode = useUserPreferencesStore((s) => s.toggleDarkMode);
  const toggleCalendarStartOnMonday = useUserPreferencesStore((s) => s.toggleCalendarStartOnMonday);

  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <motion.section className="view profile-view" {...pageTransition}>
      <h1 className="profile-view__title">Profile</h1>

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
    </motion.section>
  );
}
