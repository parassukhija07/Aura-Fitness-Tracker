/**
 * @jest-environment jsdom
 */
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

// FileReader does not fully exist in jsdom — provide a minimal mock.
const mockReadAsDataURL = jest.fn();
const mockFileReaderInstance = {
  readAsDataURL: mockReadAsDataURL,
  result: 'data:image/jpeg;base64,MOCK',
  onload: null as ((e: Event) => void) | null,
  onerror: null as ((e: Event) => void) | null,
};
global.FileReader = jest.fn(() => mockFileReaderInstance) as unknown as typeof FileReader;

import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useBodyDataStore } from '../../store/bodyDataStore';
import PhotoLibrary from './PhotoLibrary';

beforeEach(() => {
  useBodyDataStore.setState({ logs: [], photos: [] });
  mockReadAsDataURL.mockClear();
  (global.FileReader as unknown as jest.Mock).mockClear();
  mockFileReaderInstance.onload = null;
  mockFileReaderInstance.onerror = null;
});

// ── Happy path ────────────────────────────────────────────────────────────────

test('renders empty state when no photos exist', () => {
  render(<PhotoLibrary />);
  expect(screen.getByText('No photos yet.')).toBeInTheDocument();
  expect(screen.getByText('Add Photo')).toBeInTheDocument();
});

test('renders photo thumbnails when photos exist in the store', () => {
  useBodyDataStore.setState({
    logs: [],
    photos: [
      { id: 'photo-1', date: '2026-06-01', dataUrl: 'data:image/jpeg;base64,AAA' },
      { id: 'photo-2', date: '2026-06-02', dataUrl: 'data:image/jpeg;base64,BBB' },
    ],
  });
  render(<PhotoLibrary />);
  expect(screen.queryByText('No photos yet.')).toBeNull();
  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBe(2);
});

// ── Add photo via FileReader ──────────────────────────────────────────────────

test('selecting a file triggers FileReader and adds photo to store', async () => {
  render(<PhotoLibrary />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

  Object.defineProperty(input, 'files', { value: [file], configurable: true });

  await act(async () => {
    fireEvent.change(input);
  });

  // FileReader.readAsDataURL must have been called
  expect(mockReadAsDataURL).toHaveBeenCalledWith(file);

  // Simulate the async onload callback
  await act(async () => {
    mockFileReaderInstance.result = 'data:image/jpeg;base64,MOCK';
    mockFileReaderInstance.onload?.({} as Event);
  });

  const photos = useBodyDataStore.getState().photos;
  expect(photos.length).toBe(1);
  expect(photos[0].dataUrl).toBe('data:image/jpeg;base64,MOCK');
  expect(photos[0].id.startsWith('photo-')).toBe(true);
});

test('FileReader.onerror does not call addPhoto', async () => {
  render(<PhotoLibrary />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['content'], 'bad.jpg', { type: 'image/jpeg' });

  Object.defineProperty(input, 'files', { value: [file], configurable: true });

  await act(async () => {
    fireEvent.change(input);
  });

  await act(async () => {
    mockFileReaderInstance.onerror?.({} as Event);
  });

  expect(useBodyDataStore.getState().photos.length).toBe(0);
});

// ── Delete photo ──────────────────────────────────────────────────────────────

test('delete button removes photo from store and does not toggle selection', () => {
  useBodyDataStore.setState({
    logs: [],
    photos: [
      { id: 'photo-1', date: '2026-06-01', dataUrl: 'data:image/jpeg;base64,AAA' },
      { id: 'photo-2', date: '2026-06-02', dataUrl: 'data:image/jpeg;base64,BBB' },
    ],
  });
  render(<PhotoLibrary />);

  const deleteButtons = screen.getAllByRole('button', { name: 'Delete photo' });
  fireEvent.click(deleteButtons[0]);

  expect(useBodyDataStore.getState().photos.length).toBe(1);
  // The remaining photo should still be present
  expect(screen.getAllByRole('img').length).toBe(1);
});

// ── Selection logic ───────────────────────────────────────────────────────────

test('clicking two thumbnails marks both as selected and shows compare view', () => {
  useBodyDataStore.setState({
    logs: [],
    photos: [
      { id: 'p1', date: '2026-06-01', dataUrl: 'data:image/jpeg;base64,A' },
      { id: 'p2', date: '2026-06-02', dataUrl: 'data:image/jpeg;base64,B' },
      { id: 'p3', date: '2026-06-03', dataUrl: 'data:image/jpeg;base64,C' },
    ],
  });
  const { container } = render(<PhotoLibrary />);

  // Click first and second thumbs (sorted desc: p3, p2, p1)
  const thumbButtons = container.querySelectorAll('.photo-lib__thumb');
  fireEvent.click(thumbButtons[0]); // p3 selected
  fireEvent.click(thumbButtons[1]); // p2 selected

  // Both should have --selected class
  expect(thumbButtons[0]).toHaveClass('photo-lib__thumb--selected');
  expect(thumbButtons[1]).toHaveClass('photo-lib__thumb--selected');

  // Compare view must be visible
  expect(container.querySelector('.photo-lib__compare')).toBeInTheDocument();
});

test('clicking a third photo drops the oldest selected id and adds the new one', () => {
  useBodyDataStore.setState({
    logs: [],
    photos: [
      { id: 'p1', date: '2026-06-01', dataUrl: 'data:image/jpeg;base64,A' },
      { id: 'p2', date: '2026-06-02', dataUrl: 'data:image/jpeg;base64,B' },
      { id: 'p3', date: '2026-06-03', dataUrl: 'data:image/jpeg;base64,C' },
    ],
  });
  const { container } = render(<PhotoLibrary />);

  // Sorted descending: p3 at index 0, p2 at index 1, p1 at index 2
  const thumbButtons = container.querySelectorAll('.photo-lib__thumb');
  fireEvent.click(thumbButtons[0]); // select p3
  fireEvent.click(thumbButtons[1]); // select p2 — now [p3, p2]
  fireEvent.click(thumbButtons[2]); // select p1 — should drop p3, become [p2, p1]

  // p3 (index 0) must NOT be selected
  expect(thumbButtons[0]).not.toHaveClass('photo-lib__thumb--selected');
  // p2 and p1 must be selected
  expect(thumbButtons[1]).toHaveClass('photo-lib__thumb--selected');
  expect(thumbButtons[2]).toHaveClass('photo-lib__thumb--selected');
});

test('deleting a selected photo removes it from the selected array too', () => {
  useBodyDataStore.setState({
    logs: [],
    photos: [
      { id: 'p1', date: '2026-06-01', dataUrl: 'data:image/jpeg;base64,A' },
      { id: 'p2', date: '2026-06-02', dataUrl: 'data:image/jpeg;base64,B' },
    ],
  });
  const { container } = render(<PhotoLibrary />);

  const thumbButtons = container.querySelectorAll('.photo-lib__thumb');
  // Select both
  fireEvent.click(thumbButtons[0]); // p2 (desc order)
  fireEvent.click(thumbButtons[1]); // p1
  expect(container.querySelector('.photo-lib__compare')).toBeInTheDocument();

  // Delete p2 via its delete button
  const deleteButtons = screen.getAllByRole('button', { name: 'Delete photo' });
  fireEvent.click(deleteButtons[0]);

  // Compare view must disappear (only 1 selected now)
  expect(container.querySelector('.photo-lib__compare')).toBeNull();
  // Only 1 photo in the store
  expect(useBodyDataStore.getState().photos.length).toBe(1);
});
