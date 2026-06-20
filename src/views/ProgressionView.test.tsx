/**
 * @jest-environment jsdom
 */
jest.mock('../store/statsDataStore');
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressionView from './ProgressionView';
import { useStatsDataStore } from '../store/statsDataStore';

const FAKE_STATE = {
  completedWorkoutDates: [] as string[],
  lifetimeStats: { totalSessions: 1, totalSets: 2, totalVolumeKg: 3, totalPRs: 4 },
};

beforeEach(() => {
  (useStatsDataStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof FAKE_STATE) => unknown) => selector(FAKE_STATE)
  );
});

test('defaults to the Stats tab as active', () => {
  render(<ProgressionView />);
  const statsBtn = screen.getByRole('tab', { name: 'Stats' });
  const bodyBtn = screen.getByRole('tab', { name: 'Body' });
  expect(statsBtn).toHaveClass('prog-tabs__tab--active');
  expect(bodyBtn).not.toHaveClass('prog-tabs__tab--active');
});

test('renders Stats content by default', () => {
  render(<ProgressionView />);
  expect(screen.getByText('Consistency')).toBeInTheDocument();
  expect(screen.getByText('Lifetime')).toBeInTheDocument();
  expect(screen.queryByText('Coming soon')).toBeNull();
});

test('switches active class to Body on click', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  expect(screen.getByRole('tab', { name: 'Body' })).toHaveClass('prog-tabs__tab--active');
  expect(screen.getByRole('tab', { name: 'Stats' })).not.toHaveClass('prog-tabs__tab--active');
});

test('swaps content to BodyTab on click', () => {
  render(<ProgressionView />);
  fireEvent.click(screen.getByRole('tab', { name: 'Body' }));
  expect(screen.getByText('Coming soon')).toBeInTheDocument();
  expect(screen.queryByText('Consistency')).toBeNull();
});
