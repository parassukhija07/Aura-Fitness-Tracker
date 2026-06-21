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
      <div className="heatmap__grid heatmap__grid--month">
        {cells.map((cellDate) => {
          const key = toKey(cellDate);
          let cellClass = 'heatmap__cell heatmap__cell--empty';
          if (completedSet.has(key)) {
            cellClass = 'heatmap__cell heatmap__cell--active';
          } else if (partialSet.has(key)) {
            cellClass = 'heatmap__cell heatmap__cell--partial';
          }
          return <div key={key} className={cellClass} title={key} />;
        })}
      </div>
    </div>
  );
}
