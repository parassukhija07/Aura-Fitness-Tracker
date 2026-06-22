// In-app legal copy. Bundled so it works offline and on device.
//
// ⚠️ Before public launch, replace the bracketed placeholders ([Company],
// [contact email], [jurisdiction], [Firestore region]) with your real details
// and have the final text reviewed. This is a solid starting draft tailored to
// how Aura Tracker actually handles data — not legal advice.

export const APP_NAME = 'Aura Tracker';
export const LEGAL_CONTACT = 'support@auratracker.app';
export const LEGAL_EFFECTIVE = '2026-06-22';

export interface LegalSection {
  heading: string;
  body: string[];
}

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'Overview',
    body: [
      `${APP_NAME} is an offline-first fitness app. The data you create — workouts, plans, exercises, logged sessions, statistics, body measurements, and progress photos — is stored on your device by default and is not transmitted to us unless you explicitly choose to back it up.`,
    ],
  },
  {
    heading: 'Data we store on your device',
    body: [
      'Your training and body data is saved locally using your device storage. It never leaves your device unless you tap “Backup Data to Cloud”.',
      'Progress photos you add stay on your device unless included in a cloud backup.',
    ],
  },
  {
    heading: 'Data stored in the cloud (optional)',
    body: [
      'If you create an account and use cloud backup, we store a single copy of your app data in Firebase Firestore under your user ID, hosted by Google Cloud ([Firestore region]). Authentication (email and password) is handled by Firebase Authentication.',
      'You control this: backups only happen when you tap “Backup Data to Cloud”, and you can permanently delete the cloud copy at any time via Profile → Account → “Delete Cloud Backup”.',
    ],
  },
  {
    heading: 'Analytics',
    body: [
      'We may use Firebase Analytics to understand aggregate, anonymized usage (for example, which screens are used) to improve the app. This is processed by Google. Analytics runs only in supported environments.',
    ],
  },
  {
    heading: 'What we do NOT do',
    body: [
      'We do not sell your data.',
      'We do not require personal details to use the app; account profile fields (name, phone, location, etc.) are optional and entered by you.',
      'We do not use a SQL database or share your training data with third parties for advertising.',
    ],
  },
  {
    heading: 'Your rights (GDPR / CCPA)',
    body: [
      'Access & portability: export all your data as JSON via Profile → Account → “Export Data”.',
      'Erasure: clear local data via “Reset Workout Data” / “Reset All Data”, and delete your cloud copy via “Delete Cloud Backup”. To delete your account entirely, contact us.',
      'If you are in the EU/EEA or California, you have additional rights to access, correct, and delete your personal data; contact us to exercise them.',
    ],
  },
  {
    heading: 'Data retention',
    body: [
      'Local data persists until you clear it or uninstall the app. Cloud backups persist until you delete them or delete your account.',
    ],
  },
  {
    heading: 'Children',
    body: [
      `${APP_NAME} is not directed to children under 13 (or the minimum age in your jurisdiction). We do not knowingly collect data from children.`,
    ],
  },
  {
    heading: 'Changes & contact',
    body: [
      'We may update this policy; material changes will be reflected here with a new effective date.',
      `Questions or requests: ${LEGAL_CONTACT}.`,
    ],
  },
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: 'Acceptance',
    body: [
      `By using ${APP_NAME}, you agree to these Terms. If you do not agree, do not use the app.`,
    ],
  },
  {
    heading: 'The service',
    body: [
      `${APP_NAME} is a personal fitness-tracking tool that helps you plan and log workouts and track body metrics. Optional features include creating an account and backing up your data to the cloud.`,
    ],
  },
  {
    heading: 'Not medical advice',
    body: [
      `${APP_NAME} provides general fitness information and training suggestions (including automated progression and warm-up recommendations) for informational purposes only. It is NOT medical advice. Consult a qualified professional before starting any exercise program. You use the app and perform exercises at your own risk.`,
    ],
  },
  {
    heading: 'Your responsibilities',
    body: [
      'You are responsible for the accuracy of the data you enter and for keeping your account credentials secure.',
      'You agree not to misuse the app, attempt to breach its security, or use it for any unlawful purpose.',
    ],
  },
  {
    heading: 'Your content',
    body: [
      'You retain ownership of the data and photos you create. You grant us only the limited permission needed to store and sync your data so the app can function (for example, saving your cloud backup).',
    ],
  },
  {
    heading: 'Availability & changes',
    body: [
      'The app is provided “as is” and “as available”. We may modify, suspend, or discontinue features at any time. We do not guarantee uninterrupted or error-free operation.',
    ],
  },
  {
    heading: 'Limitation of liability',
    body: [
      'To the maximum extent permitted by law, [Company] is not liable for any indirect, incidental, or consequential damages, for any injury arising from exercise, or for any loss of data. Our total liability is limited to the amount you paid for the app (which may be zero).',
    ],
  },
  {
    heading: 'Governing law & contact',
    body: [
      'These Terms are governed by the laws of [jurisdiction], without regard to conflict-of-law rules.',
      `Questions: ${LEGAL_CONTACT}.`,
    ],
  },
];
