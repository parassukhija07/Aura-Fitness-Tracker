/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsistencyHeatmap from './ConsistencyHeatmap';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

const firstOfMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

const priorMonthDate = new Date(currentYear, currentMonth - 1, 1);
const priorMonthLabel = priorMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

test('renders one day cell per day of the current month', () => {
  const { container } = render(<ConsistencyHeatmap completedDates={[]} />);
  expect(container.querySelectorAll('.heatmap__day').length).toBe(daysInCurrentMonth);
});

test('marks completed dates in the current month at full intensity', () => {
  const { container } = render(
    <ConsistencyHeatmap completedDates={[firstOfMonthKey]} />
  );
  expect(container.querySelectorAll('.heatmap__day.heatmap__cell--l4').length).toBe(1);
});

test('marks partial dates as medium intensity', () => {
  const { container } = render(
    <ConsistencyHeatmap completedDates={[]} partialDates={[firstOfMonthKey]} />
  );
  expect(container.querySelectorAll('.heatmap__day.heatmap__cell--l2').length).toBe(1);
});

test('next button is disabled on the current month', () => {
  render(<ConsistencyHeatmap completedDates={[]} />);
  expect(screen.getByLabelText('Next month')).toBeDisabled();
});

test('clicking previous navigates to prior month', () => {
  render(<ConsistencyHeatmap completedDates={[]} />);
  fireEvent.click(screen.getByLabelText('Previous month'));
  expect(screen.getByText(priorMonthLabel)).toBeInTheDocument();
});
