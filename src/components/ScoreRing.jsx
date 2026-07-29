export default function ScoreRing({ score = 0, size = 124, label = 'Today', compact = false }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const stroke = compact ? 8 : 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className={`score-ring ${compact ? 'compact' : ''}`} style={{ '--score-size': `${size}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="score-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-copy">
        <strong>{safeScore || '—'}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
