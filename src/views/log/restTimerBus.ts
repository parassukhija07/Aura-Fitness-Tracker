/** Minimal pub/sub for inter-set rest timer. No store deps. */

type Listener = (state: { seconds: number; running: boolean }) => void;

let _seconds = 0;
let _running = false;
let _intervalId: ReturnType<typeof setInterval> | null = null;
const _listeners = new Set<Listener>();

function _notify() {
  const snapshot = { seconds: _seconds, running: _running };
  _listeners.forEach((cb) => cb(snapshot));
}

function _clearInterval() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function start(seconds: number): void {
  _clearInterval();
  _seconds = seconds;
  _running = true;
  _notify();
  _intervalId = setInterval(() => {
    _seconds -= 1;
    if (_seconds <= 0) {
      _seconds = 0;
      _running = false;
      _clearInterval();
    }
    _notify();
  }, 1000);
}

export function stop(): void {
  _clearInterval();
  _running = false;
  _seconds = 0;
  _notify();
}

export function subscribe(cb: (s: { seconds: number; running: boolean }) => void): () => void {
  _listeners.add(cb);
  // Immediately emit current state so new subscribers are in sync
  cb({ seconds: _seconds, running: _running });
  return () => {
    _listeners.delete(cb);
  };
}
