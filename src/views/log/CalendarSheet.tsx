import { useState } from 'react';
import { Sheet } from '../../design/Sheet';
import { isSameDay } from './logDates';

interface CalendarSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
}

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDotColor(date: Date, today: Date): string | null {
  if (date > today) return null;
  if (isSameDay(date, today)) return 'var(--accent)';
  return 'var(--green)';
}

function buildCalendarCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  return cells;
}

export function CalendarSheet({ open, onClose, selectedDate, today, onSelectDate }: CalendarSheetProps) {
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  const cells = buildCalendarCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(today);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Calendar">
      <div className="log-cal-month-header">
        <button className="log-cal-nav" onClick={prevMonth}>‹</button>
        <span className="log-cal-month-label">{monthLabel}</span>
        <button className="log-cal-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="log-cal-dow-row">
        {DOW_LABELS.map((d, i) => (
          <div key={i} className="log-cal-dow">{d}</div>
        ))}
      </div>

      <div className="log-cal-grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dotColor = getDotColor(date, today);
          const cls = [
            'log-cal-cell',
            isSelected ? 'log-cal-cell--active' : '',
            isToday && !isSelected ? 'log-cal-cell--today' : '',
          ].filter(Boolean).join(' ');
          return (
            <button key={date.toISOString()} className={cls} onClick={() => { onSelectDate(date); onClose(); }}>
              {date.getDate()}
              {dotColor && (
                <span className="log-cal-cell__dot" style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : dotColor }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--s4)' }}>
        <button
          style={{
            width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
            border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)',
            fontFamily: 'var(--font)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
          onClick={goToToday}
        >
          Go to Today
        </button>
      </div>
    </Sheet>
  );
}
