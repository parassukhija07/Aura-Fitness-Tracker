/**
 * @jest-environment jsdom
 */
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(
        (
          { children, onClick, role, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { [k: string]: unknown },
          ref: React.Ref<HTMLDivElement>
        ) => React.createElement('div', { ref, onClick, role, className }, children)
      ),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import MeasureHelpModal from './MeasureHelpModal';

test('renders the modal title "How to Measure"', () => {
  render(<MeasureHelpModal onClose={() => {}} />);
  expect(screen.getByText('How to Measure')).toBeInTheDocument();
});

test('renders at least one body part instruction (Neck)', () => {
  render(<MeasureHelpModal onClose={() => {}} />);
  expect(screen.getByText('Neck')).toBeInTheDocument();
});

test('renders all 9 body part headings', () => {
  render(<MeasureHelpModal onClose={() => {}} />);
  const parts = ['Weight', 'Body Fat %', 'Neck', 'Shoulders', 'Chest', 'Waist', 'Hips', 'Arms', 'Thighs'];
  for (const part of parts) {
    expect(screen.getByText(part)).toBeInTheDocument();
  }
});

test('close button calls onClose', () => {
  const onClose = jest.fn();
  render(<MeasureHelpModal onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking backdrop calls onClose', () => {
  const onClose = jest.fn();
  const { container } = render(<MeasureHelpModal onClose={onClose} />);
  // The backdrop is the outermost div (role="presentation")
  const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;
  fireEvent.click(backdrop);
  expect(onClose).toHaveBeenCalledTimes(1);
});
