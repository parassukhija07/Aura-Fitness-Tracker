import { useStatsDataStore } from '../../store/statsDataStore';
import { useUserPreferencesStore } from '../../store/userPreferencesStore';
import { getStrengthScore, getStrengthBalance } from '../progression/statsDerivations';

/**
 * Log-page strength gauge (PRD 5.2.1). Honors the user's General setting:
 * show the Strength Score, the Strength Balance bars, or both.
 */
export default function StrengthSummary() {
  const sessions = useStatsDataStore((s) => s.completedSessions);
  const mode = useUserPreferencesStore((s) => s.logScoreDisplay);

  const score = getStrengthScore(sessions);
  const balance = getStrengthBalance(sessions);
  const trained = balance.filter((b) => b.share > 0);

  // Nothing logged yet → no gauge to show.
  if (score === 0 && trained.length === 0) return null;

  const showScore = mode === 'strength_score' || mode === 'both';
  const showBalance = mode === 'strength_balance' || mode === 'both';

  return (
    <div className="log-strength card card-pad" aria-label="Strength summary">
      {showScore && (
        <div className="log-strength__score-row">
          <div className="log-strength__score-meta">
            <div className="log-strength__label">STRENGTH SCORE</div>
            <div className="log-strength__sub">Last 28 days</div>
          </div>
          <div className="log-strength__score" aria-label={`Strength score ${score} out of 100`}>
            {score}<span>/100</span>
          </div>
        </div>
      )}

      {showScore && showBalance && <div className="log-card__divider" />}

      {showBalance && (
        <div className="log-strength__balance">
          <div className="log-strength__label">STRENGTH BALANCE</div>
          {trained.length === 0 ? (
            <p className="log-strength__sub">Log a workout to see your balance.</p>
          ) : (
            balance.map((b) => (
              <div className="mbar-row" key={b.muscleGroup}>
                <div className="mbar-lab">{b.muscleGroup}</div>
                <div className="mbar">
                  <i style={{ width: `${Math.max(4, Math.round(b.share * 100))}%` }} />
                </div>
                <div className="mbar-pct">{Math.round(b.share * 100)}%</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
