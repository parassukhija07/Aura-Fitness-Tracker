// App-level rest-timer alerts: a synthesized sound (ding | alarm) plus an
// optional Web Notification. No native Capacitor plugins — works in the
// browser/WebView today and degrades silently where APIs are unavailable.
import { useUserPreferencesStore } from '../store/userPreferencesStore';

let _ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!_ctx) _ctx = new Ctor();
  return _ctx;
}

function beep(ctx: AudioContext, freq: number, startAt: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

/** Play the configured rest-timer sound (ding = single chime, alarm = triple). */
export function playRestSound(sound: 'ding' | 'alarm'): void {
  const ctx = audioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  if (sound === 'alarm') {
    beep(ctx, 880, t, 0.18);
    beep(ctx, 880, t + 0.25, 0.18);
    beep(ctx, 1175, t + 0.5, 0.3);
  } else {
    beep(ctx, 988, t, 0.18);
    beep(ctx, 1319, t + 0.16, 0.28);
  }
}

/** Show a local Web Notification if enabled + permitted (best-effort). */
export function showRestNotification(body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification('Aura — Rest complete', { body });
    } catch {
      /* some WebViews throw on direct construction; ignore */
    }
  }
}

/** Request notification permission (call from a user gesture, e.g. the toggle). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Fire the full alert chain when a rest timer completes, gated by user prefs.
 * Reads prefs non-reactively so it can be called from timers/effects.
 */
export function fireRestComplete(message: string): void {
  const { autoRestTimer, notificationsEnabled, restTimerSound } = useUserPreferencesStore.getState();
  if (!autoRestTimer) return;
  playRestSound(restTimerSound);
  if (notificationsEnabled) showRestNotification(message);
}
