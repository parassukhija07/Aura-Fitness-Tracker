import { getWeekDays, isSameDay } from './logDates';

interface WeekCalendarBarProps {
  weekOffset: number;
  activeDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onWeekChange: (delta: number) => void;
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekCalendarBar({
  weekOffset,
  activeDate,
  today,
  onSelectDate,
  onWeekChange,
}: WeekCalendarBarProps) {
  const days = getWeekDays(today, weekOffset);
  const monthYearLabel = days[0].toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="log-week">
      <div className="log-week__header">
        <button
          type="button"
          className="log-week__nav"
          onClick={() => onWeekChange(-1)}
          aria-label="Previous week"
        >
          &#8249;
        </button>
        <span className="log-week__label">{monthYearLabel}</span>
        <button
          type="button"
          className="log-week__nav"
          onClick={() => onWeekChange(1)}
          aria-label="Next week"
        >
          &#8250;
        </button>
      </div>
      <div className="log-week__strip">
        {days.map((date, i) => {
          const isActive = isSameDay(date, activeDate);
          const isToday = isSameDay(date, today);
          let cls = 'log-week__day';
          if (isActive) cls += ' log-week__day--active';
          if (isToday) cls += ' log-week__day--today';

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={cls}
              onClick={() => onSelectDate(date)}
            >
              <span className="log-week__dow">{DOW_LABELS[i]}</span>
              <span className="log-week__date">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
