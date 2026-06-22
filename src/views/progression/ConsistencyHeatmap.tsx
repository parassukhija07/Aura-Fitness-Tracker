import { useState } from 'react';

interface Props {
  completedDates: string[];
  partialDates?: string[];
}

const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const daysInMonth = (y: number, m: number): number => new Date(y, m + 1, 0).getDate();

export default function ConsistencyHeatmap({ completedDates, partialDates = [] }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);

  const cells: Date[] = [];
  for (let day = 1; day <= totalDays; day++) {
    cells.push(new Date(year, month, day));
  }

  const completedSet = new Set(completedDates);
  const partialSet = new Set(partialDates);

  const activeDays = cells.filter(
    (d) => completedSet.has(toKey(d)) || partialSet.has(toKey(d)),
  ).length;

  // Leading blanks so day 1 lands in the correct weekday column (Sun-start).
  const leadingBlanks = new Date(year, month, 1).getDay();

  return (
    <div className="heatmap">
      <div className="heatmap__nav">
        <button
          type="button"
          className="heatmap__nav-btn"
          aria-label="Previous month"
          onClick={() => setMonthOffset((o) => o - 1)}
        >
          ‹
        </button>
        <span className="heatmap__nav-label">
          {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          className="heatmap__nav-btn"
          aria-label="Next month"
          disabled={monthOffset >= 0}
          onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
        >
          ›
        </button>
      </div>
      <div className="card card-pad">
        <div className="heatmap__grid heatmap__grid--month">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="heatmap__cell heatmap__cell--off" />
          ))}
          {cells.map((cellDate) => {
            const key = toKey(cellDate);
            let cellClass = 'heatmap__cell heatmap__day heatmap__cell--empty';
            if (completedSet.has(key)) {
              cellClass = 'heatmap__cell heatmap__day heatmap__cell--l4';
            } else if (partialSet.has(key)) {
              cellClass = 'heatmap__cell heatmap__day heatmap__cell--l2';
            }
            return <div key={key} className={cellClass} title={key} />;
          })}
        </div>
        <div className="heatmap__footer">
          <span className="heatmap__count">{activeDays} active days</span>
          <span className="heatmap__legend">
            <span className="heatmap__legend-label">Less</span>
            <span className="heatmap__cell heatmap__cell--empty heatmap__leg" />
            <span className="heatmap__cell heatmap__cell--l1 heatmap__leg" />
            <span className="heatmap__cell heatmap__cell--l2 heatmap__leg" />
            <span className="heatmap__cell heatmap__cell--l3 heatmap__leg" />
            <span className="heatmap__cell heatmap__cell--l4 heatmap__leg" />
            <span className="heatmap__legend-label">More</span>
          </span>
        </div>
      </div>
    </div>
  );
}
