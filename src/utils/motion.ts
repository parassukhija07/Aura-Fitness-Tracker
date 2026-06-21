import type { MotionProps } from 'framer-motion';

/** Page-level enter transition: fast fade + subtle upward slide. */
export const pageTransition: MotionProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

/** Modal overlay/backdrop: pure fade-in. */
export const overlayTransition: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

/** Modal panel: slide up from bottom + fade. */
export const panelTransition: MotionProps = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};
