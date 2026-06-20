/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import LifetimeStatsCards from './LifetimeStatsCards';
import type { LifetimeStats } from '../../store/statsDataStore';

const STATS: LifetimeStats = {
  totalSessions: 142,
  totalSets: 3680,
  totalVolumeKg: 1284500,
  totalPRs: 37,
};

const fmt = (n: number) => n.toLocaleString('en-US');

test('renders all four cards in order', () => {
  const { container } = render(<LifetimeStatsCards stats={STATS} />);
  const labels = Array.from(container.querySelectorAll('.stat-card__label')).map(
    (e) => e.textContent
  );
  expect(labels).toEqual(['Total Sessions', 'Total Sets', 'Total Volume', 'Total PRs']);
});

test('renders comma-formatted values', () => {
  const { getByText } = render(<LifetimeStatsCards stats={STATS} />);
  expect(getByText(fmt(142))).toBeInTheDocument();
  expect(getByText(fmt(3680))).toBeInTheDocument();
  expect(getByText(fmt(37))).toBeInTheDocument();
});

test('appends " kg" to total volume', () => {
  const { getByText } = render(<LifetimeStatsCards stats={STATS} />);
  expect(getByText(fmt(1284500) + ' kg')).toBeInTheDocument();
});

test('renders four stat-card elements', () => {
  const { container } = render(<LifetimeStatsCards stats={STATS} />);
  expect(container.querySelectorAll('.stat-card').length).toBe(4);
});
