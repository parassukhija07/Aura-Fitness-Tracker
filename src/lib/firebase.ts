import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDWKZZ5hlr1etti51rhbTad5qSuOW7-4XY',
  authDomain: 'aura-fitness-tracker.firebaseapp.com',
  projectId: 'aura-fitness-tracker',
  storageBucket: 'aura-fitness-tracker.firebasestorage.app',
  messagingSenderId: '107015641993',
  appId: '1:107015641993:web:6d8f1cec4155ab35539f58',
  measurementId: 'G-L75BEG2SBS',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is only available in real browser environments. Guard against
// jsdom / node (tests) and unsupported environments to avoid runtime errors.
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}
