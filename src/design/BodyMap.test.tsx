/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BodyMap } from './BodyMap';
import type { MuscleGroup } from '../types/workout';

describe('BodyMap — Gap D', () => {
  it('renders without throwing when highlighted is empty', () => {
    const { container } = render(<BodyMap highlighted={[]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('highlighted Chest element gets fill=var(--accent)', () => {
    const { container } = render(<BodyMap highlighted={['Chest']} />);
    const chestEl = container.querySelector('[data-muscle="Chest"]') as SVGElement | null;
    expect(chestEl).not.toBeNull();
    expect(chestEl!.getAttribute('fill')).toBe('var(--accent)');
  });

  it('non-highlighted Chest element gets default surface fill', () => {
    const { container } = render(<BodyMap highlighted={[]} />);
    const chestEl = container.querySelector('[data-muscle="Chest"]') as SVGElement | null;
    expect(chestEl).not.toBeNull();
    expect(chestEl!.getAttribute('fill')).toContain('surface');
  });

  it('highlighted Legs element gets fill=var(--accent)', () => {
    const { container } = render(<BodyMap highlighted={['Legs']} />);
    const legsEl = container.querySelector('[data-muscle="Legs-L"]') as SVGElement | null;
    expect(legsEl).not.toBeNull();
    expect(legsEl!.getAttribute('fill')).toBe('var(--accent)');
  });

  it('Back highlighted — dashed accent stroke element rendered', () => {
    const { container } = render(<BodyMap highlighted={['Back']} />);
    const backEl = container.querySelector('[data-muscle="Back"]') as SVGElement | null;
    expect(backEl).not.toBeNull();
    expect(backEl!.getAttribute('stroke')).toBe('var(--accent)');
  });

  it('unknown muscle string passed in highlighted does not throw', () => {
    // MuscleGroup union does not include 'Unknown' — cast to bypass type
    expect(() =>
      render(<BodyMap highlighted={['Unknown' as MuscleGroup]} />)
    ).not.toThrow();
  });

  it('intensity < 1 sets opacity below 1 for highlighted muscle', () => {
    const { container } = render(
      <BodyMap highlighted={['Core']} intensity={{ Core: 0.5 }} />
    );
    const coreEl = container.querySelector('[data-muscle="Core"]') as SVGElement | null;
    expect(coreEl).not.toBeNull();
    const op = parseFloat(coreEl!.getAttribute('opacity') ?? '1');
    expect(op).toBe(0.5);
  });
});
