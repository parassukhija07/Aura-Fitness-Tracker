interface Props {
  completedDates: string[];
}

const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ConsistencyHeatmap({ completedDates }: Props) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const arr: Date[] = [];
  for (let i = 89; i >= 0; i--) {
    arr.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
  }

  const activeSet = new Set(completedDates);

  const monthLabels = [arr[0], arr[45], arr[89]].map((d) =>
    d.toLocaleString('en-US', { month: 'short' })
  );

  return (
    <div className="heatmap">
      <div className="heatmap__months">
        {monthLabels.map((label, idx) => (
          <span key={idx} className="heatmap__month">{label}</span>
        ))}
      </div>
      <div className="heatmap__grid">
        {arr.map((cellDate) => {
          const key = toKey(cellDate);
          const isActive = activeSet.has(key);
          return (
            <div
              key={key}
              className={isActive ? 'heatmap__cell heatmap__cell--active' : 'heatmap__cell heatmap__cell--empty'}
              title={key}
            />
          );
        })}
      </div>
    </div>
  );
}
