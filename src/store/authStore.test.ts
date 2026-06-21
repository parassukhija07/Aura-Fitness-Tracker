// Capture the onAuthStateChanged callback so tests can drive auth state.
let authCallback: ((user: unknown) => void) | null = null;

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth: unknown, cb: (user: unknown) => void) => {
    authCallback = cb;
    return jest.fn(); // unsubscribe fn
  }),
}));

jest.mock('../lib/firebase', () => ({
  auth: {},
}));

import { useAuthStore } from './authStore';

beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: true });
});

test('initial state — user is null and isLoading is true', () => {
  useAuthStore.setState({ user: null, isLoading: true });
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().isLoading).toBe(true);
});

test('setUser — stores a mapped user and clears loading', () => {
  useAuthStore.getState().setUser({ uid: 'abc', email: 'a@b.com' });
  expect(useAuthStore.getState().user).toEqual({ uid: 'abc', email: 'a@b.com' });
  expect(useAuthStore.getState().isLoading).toBe(false);
});

test('setUser — null clears the user and clears loading', () => {
  useAuthStore.getState().setUser({ uid: 'abc', email: 'a@b.com' });
  useAuthStore.getState().setUser(null);
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().isLoading).toBe(false);
});

test('onAuthStateChanged listener — maps a firebase user into the store', () => {
  expect(authCallback).not.toBeNull();
  authCallback!({ uid: 'xyz', email: 'x@y.com', displayName: 'ignored' });
  expect(useAuthStore.getState().user).toEqual({ uid: 'xyz', email: 'x@y.com' });
  expect(useAuthStore.getState().isLoading).toBe(false);
});

test('onAuthStateChanged listener — null firebase user yields null store user', () => {
  authCallback!(null);
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().isLoading).toBe(false);
});
