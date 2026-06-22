# Security & Privacy

A factual map of how Aura Tracker handles data, for the pre-launch checklist.

## Architecture

Aura Tracker is an **offline-first Capacitor app**. The overwhelming majority of
user data never leaves the device. The only network surface is optional Firebase
sign-in + a single cloud backup document.

## Where data is stored

| Data | Location | Notes |
|---|---|---|
| Workouts, plans, exercises, sessions, stats, body metrics, progress photos | **On-device** via `@capacitor/preferences` (native) / `localStorage` (web), through Zustand `persist` | Never transmitted unless the user taps **Backup to Cloud** |
| Optional cloud backup | **Firebase Firestore**, document `users/{uid}` | A full copy of the local data, written via `setDoc` (full overwrite). Created only on explicit user action |
| Authentication | **Firebase Auth** (email/password) | Tokens managed by the Firebase SDK; no hand-rolled sessions |
| Usage analytics | **Firebase Analytics** | Loaded only in supported browser environments |

Firebase project/region: configured per deployment via `.env` (`VITE_FIREBASE_*`).
Update this table with your actual Firestore region before launch.

## Access control

- Firestore access is governed by [`firestore.rules`](./firestore.rules):
  a signed-in user can read/write **only** their own `users/{uid}` document;
  everything else is **default-deny**.
- Deploy rules with: `firebase deploy --only firestore:rules`
  (config in [`firebase.json`](./firebase.json)).
- The Firebase Web `apiKey` shipped in the client is a **public project
  identifier**, not a secret. Security is enforced by Auth + the rules above,
  not by hiding it. (Optionally enable **Firebase App Check** to bind requests
  to genuine app instances.)

## Secrets

- `.env` is gitignored and has never been committed (verified against history).
- No third-party secret keys live in client code. There is no server you operate,
  so there are no server-side secrets in this repo.

## Data minimization & user rights (GDPR/CCPA)

- The app collects only what it needs to function; account fields (name, phone,
  location, etc.) are **optional** and user-entered.
- **Export**: Profile → Account → *Export Data* produces a full JSON dump.
- **Deletion**: Profile → Account → *Reset Workout Data* / *Reset All Data*
  clears local data; deleting the Firestore `users/{uid}` document removes the
  cloud copy. (A self-serve "delete cloud backup" action is a recommended
  follow-up.)
- Before public launch, add a **Privacy Policy** and **Terms of Service** and link
  them from Profile → Support.

## Abuse / cost controls (Firebase console — not in this repo)

Because there is no custom server, abuse limits are configured in Firebase:

- Enable **App Check** to block scripted access to Firestore/Auth.
- Firebase Auth enforces its own brute-force throttling; keep it on.
- Set **Firestore usage budgets/alerts** in Google Cloud Billing before launch.

## Content Security Policy

A CSP is set in [`index.html`](./index.html), restricting `connect-src` to the
app origin and Firebase endpoints, `script-src` to the app bundle, `frame-src` to
`none`, and `object-src` to `none`. Update `connect-src` if you add new backends.

## What does NOT apply

- **SQL injection** — no SQL database is used anywhere.
- **Server rate limiting / security response headers (HSTS, X-Frame-Options)** —
  there is no origin server under your control; the app is served from the
  Capacitor webview. Use Firebase App Check + console limits instead.
