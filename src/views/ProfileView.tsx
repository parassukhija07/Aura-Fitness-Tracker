import './profile/profile.css';
import { useUserPreferencesStore } from '../store/userPreferencesStore';

export default function ProfileView() {
  const darkMode = useUserPreferencesStore((s) => s.darkMode);
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const toggleDarkMode = useUserPreferencesStore((s) => s.toggleDarkMode);
  const toggleCalendarStartOnMonday = useUserPreferencesStore((s) => s.toggleCalendarStartOnMonday);

  return (
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
  );
}
