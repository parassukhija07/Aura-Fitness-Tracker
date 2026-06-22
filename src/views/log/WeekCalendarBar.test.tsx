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

jest.mock('../../store/userPreferencesStore', () => ({
  useUserPreferencesStore: jest.fn(),
}));

jest.mock('../../utils/haptics', () => ({
  triggerLightImpact: jest.fn(),
  triggerSuccess: jest.fn(),
  triggerSelection: jest.fn(),
}));

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import WeekCalendarBar from './WeekCalendarBar';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { triggerSelection } from '../../utils/haptics';

beforeEach(() => {
  jest.clearAllMocks();
  (useUserPreferencesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: { calendarStartOnMonday: boolean }) => unknown) =>
      selector({ calendarStartOnMonday: true }),
  );
});

// Use a fixed Monday as "today" so weeks are predictable
const TODAY = new Date('2026-06-15T12:00:00.000Z'); // Monday

function renderBar(
  activeDate: Date = TODAY,
  weekOffset = 0,
  showReturnToToday = false,
  onReturnToToday = jest.fn(),
) {
  const onSelectDate = jest.fn();
  const onWeekChange = jest.fn();
  const result = render(
    <WeekCalendarBar
      weekOffset={weekOffset}
      activeDate={activeDate}
      today={TODAY}
      onSelectDate={onSelectDate}
      onWeekChange={onWeekChange}
      showReturnToToday={showReturnToToday}
      onReturnToToday={onReturnToToday}
    />,
  );
  return { ...result, onSelectDate, onWeekChange };
}

// ---------------------------------------------------------------------------
// Happy path — clicking an inactive date triggers haptic and calls onSelectDate
// ---------------------------------------------------------------------------

test('clicking a different (non-active) date fires triggerSelection and calls onSelectDate', () => {
  // active is Monday; click Tuesday button
  const { onSelectDate } = renderBar(TODAY);

  const dayButtons = screen.getAllByRole('button').filter(
    (b) => !b.getAttribute('aria-label'), // exclude nav buttons which have aria-labels
  );
  // dayButtons[1] is Tuesday (index 1 with Mon start)
  fireEvent.click(dayButtons[1]);

  expect(triggerSelection).toHaveBeenCalledTimes(1);
  expect(onSelectDate).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Edge case — clicking the already-active date does NOT fire triggerSelection
// ---------------------------------------------------------------------------

test('clicking the already-active date does NOT fire triggerSelection', () => {
  // active is Monday; click the Monday button (index 0)
  const { onSelectDate } = renderBar(TODAY);

  const dayButtons = screen.getAllByRole('button').filter(
    (b) => !b.getAttribute('aria-label'),
  );
  // dayButtons[0] is Monday (the active date)
  fireEvent.click(dayButtons[0]);

  expect(triggerSelection).not.toHaveBeenCalled();
  // onSelectDate is still called
  expect(onSelectDate).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Header jump button — "Next week" advances the week without a haptic
// ---------------------------------------------------------------------------

test('clicking the "Next week" jump button does NOT fire triggerSelection', () => {
  const { onWeekChange } = renderBar();

  fireEvent.click(screen.getByRole('button', { name: /next week/i }));

  expect(triggerSelection).not.toHaveBeenCalled();
  expect(onWeekChange).toHaveBeenCalledWith(1);
});

// ---------------------------------------------------------------------------
// Header jump button — when viewing another day, the jump button returns to today
// ---------------------------------------------------------------------------

test('clicking the "Today" jump button calls onReturnToToday', () => {
  const onReturnToToday = jest.fn();
  // viewing a future date this week => showReturnToToday true, offset 0 => label "Today"
  renderBar(new Date('2026-06-17T12:00:00.000Z'), 0, true, onReturnToToday);

  fireEvent.click(screen.getByRole('button', { name: /today/i }));

  expect(triggerSelection).not.toHaveBeenCalled();
  expect(onReturnToToday).toHaveBeenCalledTimes(1);
});
