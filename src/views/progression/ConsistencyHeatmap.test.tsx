/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ConsistencyHeatmap from './ConsistencyHeatmap';

const pad = (n: number) => String(n).padStart(2, '0');
// local-midnight today minus N days, formatted to match component's toKey()
const dateKeyMinus = (days: number): string => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

test('renders exactly 90 day cells', () => {
  const { container } = render(<ConsistencyHeatmap completedDates={[]} />);
  expect(container.querySelectorAll('.heatmap__cell').length).toBe(90);
});

test('marks in-window completed dates as active', () => {
  const d5 = dateKeyMinus(5);
  const d15 = dateKeyMinus(15);
  const d30 = dateKeyMinus(30);
  const { container } = render(
    <ConsistencyHeatmap completedDates={[d5, d15, d30]} />
  );
  expect(container.querySelectorAll('.heatmap__cell--active').length).toBe(3);
  const titles = Array.from(container.querySelectorAll('.heatmap__cell--active')).map(
    (el) => el.getAttribute('title')
  );
  expect(titles).toEqual(expect.arrayContaining([d5, d15, d30]));
});

test('ignores dates outside the 90-day window', () => {
  const { container } = render(
    <ConsistencyHeatmap completedDates={[dateKeyMinus(91)]} />
  );
  expect(container.querySelectorAll('.heatmap__cell--active').length).toBe(0);
  expect(container.querySelectorAll('.heatmap__cell--empty').length).toBe(90);
});

test('renders three month labels', () => {
  const { container } = render(<ConsistencyHeatmap completedDates={[]} />);
  expect(container.querySelectorAll('.heatmap__month').length).toBe(3);
});
