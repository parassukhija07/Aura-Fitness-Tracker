import { motion } from 'framer-motion';
import { overlayTransition, panelTransition } from '../../utils/motion';

interface MeasureHelpModalProps {
  onClose: () => void;
}

const HELP_ITEMS = [
  {
    part: 'Weight',
    desc: 'Weigh yourself first thing in the morning, after using the bathroom and before eating or drinking, for consistency.',
  },
  {
    part: 'Body Fat %',
    desc: 'Use calipers, a smart scale, or a BF% formula. Measure under the same conditions each time.',
  },
  {
    part: 'Neck',
    desc: "Measure around the middle of the neck, below the Adam's apple, keeping the tape level.",
  },
  {
    part: 'Shoulders',
    desc: 'Measure around the widest part of the shoulders, keeping arms relaxed at your sides.',
  },
  {
    part: 'Chest',
    desc: 'Measure around the fullest part of the chest, across the nipples, keeping the tape level and breathing normally.',
  },
  {
    part: 'Waist',
    desc: "Measure around the narrowest part of the waist, usually just above the belly button. Don't suck in.",
  },
  {
    part: 'Hips',
    desc: 'Measure around the widest part of the hips and buttocks with feet together.',
  },
  {
    part: 'Arms',
    desc: 'Flex the bicep and measure around the largest part of the upper arm.',
  },
  {
    part: 'Thighs',
    desc: 'Measure around the widest part of the upper thigh, just below the buttock.',
  },
];

export default function MeasureHelpModal({ onClose }: MeasureHelpModalProps): JSX.Element {
  return (
    <motion.div
      className="body-modal__backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      {...overlayTransition}
    >
      <motion.div
        className="body-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="How to Measure"
        {...panelTransition}
      >
        <header className="body-modal__header">
          <h2 className="body-modal__title">How to Measure</h2>
          <button type="button" className="body-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <div className="body-modal__body">
          {HELP_ITEMS.map((item) => (
            <div className="measure-help__item" key={item.part}>
              <p className="measure-help__part">{item.part}</p>
              <p className="measure-help__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
