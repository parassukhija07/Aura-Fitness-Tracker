import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../components/icons/AuraIcons';
import './design.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  detents?: 'auto' | 'large';
}

export function Sheet({ open, onClose, title, children, detents = 'auto' }: SheetProps) {
  const startY = useRef<number | null>(null);
  const triggerRef = useRef<Element | null>(null);

  // Lock body scroll and capture trigger element while open
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
      triggerRef.current = null;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.changedTouches[0].clientY - startY.current;
    if (delta > 60) onClose();
    startY.current = null;
  };

  const portal = document.getElementById('portal-root') ?? document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="aura-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={`aura-sheet${detents === 'large' ? ' aura-sheet--large' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="aura-sheet__grabber-bar">
              <div className="aura-sheet__grabber" />
            </div>
            {(title != null) && (
              <div className="aura-sheet__header">
                <span className="aura-sheet__title">{title}</span>
                <button type="button" className="aura-sheet__close" onClick={onClose} aria-label="Close">
                  <CloseIcon size={14} />
                </button>
              </div>
            )}
            <div className="aura-sheet__body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portal,
  );
}
