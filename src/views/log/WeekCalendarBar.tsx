import { getWeekDays, isSameDay } from './logDates';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { triggerSelection } from '../../utils/haptics';

interface WeekCalendarBarProps {
  weekOffset: number;
  activeDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onWeekChange: (delta: number) => void;
  showReturnToToday: boolean;
  onReturnToToday: () => void;
  /** Optional per-day status resolver: 'done' | 'plan' | 'rest' | null */
  getDayStatus?: (date: Date) => 'done' | 'plan' | 'rest' | null;
}

const MON_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SUN_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DOT_COLOR: Record<string, string> = {
  done: 'var(--green)',
  plan: 'var(--accent)',
  rest: 'var(--text-3)',
};

// Default heuristic when the host doesn't pass an explicit resolver:
// past = done, today/future-with-plan = planned. Mirrors the template states.
function defaultStatus(date: Date, today: Date): 'done' | 'plan' | 'rest' | null {
  const d = date.getTime();
  const t = today.getTime();
  if (d < t) return 'done';
  if (isSameDay(date, today)) return 'plan';
  return null;
}

function formatRange(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  if (first.getMonth() === last.getMonth()) {
    return `${month(first)} ${first.getDate()} – ${last.getDate()}`;
  }
  return `${month(first)} ${first.getDate()} – ${month(last)} ${last.getDate()}`;
}

export default function WeekCalendarBar({
  weekOffset,
  activeDate,
  today,
  onSelectDate,
  onWeekChange,
  showReturnToToday,
  onReturnToToday,
  getDayStatus,
}: WeekCalendarBarProps) {
  const calendarStartOnMonday = useUserPreferencesStore((s) => s.calendarStartOnMonday);
  const dowLabels = calendarStartOnMonday ? MON_LABELS : SUN_LABELS;
  const days = getWeekDays(today, weekOffset, calendarStartOnMonday);

  return (
    <div className="log-week">
      <div className="log-week__header">
        <span className="log-week__label">{formatRange(days)}</span>
        {showReturnToToday ? (
          <button
            type="button"
            className="log-week__jump"
            aria-label={weekOffset > 0 ? 'Go to this week' : 'Go to today'}
            onClick={onReturnToToday}
          >
            {weekOffset > 0 ? '‹ This week' : 'Today'}
          </button>
        ) : (
          <button
            type="button"
            className="log-week__jump"
            aria-label="Next week"
            onClick={() => onWeekChange(1)}
          >
            Next week ›
          </button>
        )}
      </div>
      <div className="log-week__strip">
        {days.map((date, i) => {
          const isActive = isSameDay(date, activeDate);
          const isToday = isSameDay(date, today);
          const status = getDayStatus ? getDayStatus(date) : defaultStatus(date, today);
          let cls = 'log-week__day';
          if (isActive) cls += ' log-week__day--active';
          if (isToday) cls += ' log-week__day--today';

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={cls}
              onClick={() => {
                if (!isActive) triggerSelection();
                onSelectDate(date);
              }}
            >
              <span className="log-week__dow">{dowLabels[i]}</span>
              <span className="log-week__date">{date.getDate()}</span>
              <span
                className="log-week__dot"
                style={{
                  background: status
                    ? isActive
                      ? 'rgba(255,255,255,0.8)'
                      : DOT_COLOR[status]
                    : 'transparent',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
