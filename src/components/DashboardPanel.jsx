import {
  AlertTriangle,
  Award,
  BookOpen,
  Flame,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Type,
} from 'lucide-react';
import ScoreRing from './ScoreRing';

const metricLabels = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  fluency: 'Fluency',
  pronunciation: 'Pronunciation',
};

const buildPolyline = (weekly = []) => {
  const values = weekly.map((item) => Number(item.score) || 0);
  const width = 280;
  const height = 92;
  const padding = 8;
  const max = Math.max(100, ...values);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : width;
  return values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
};

function MetricBar({ name, value }) {
  const numericValue = value === null ? null : Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="metric-row">
      <div className="metric-row-head">
        <span>{metricLabels[name]}</span>
        <strong>{numericValue === null ? 'Not measured' : `${Math.round(numericValue)}%`}</strong>
      </div>
      <div className="metric-track">
        <span style={{ width: `${numericValue || 0}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPanel({ dashboard, currentMetrics, onStartRecommended }) {
  const effectiveScore = currentMetrics?.overall || dashboard.todayScore || 0;
  const effectiveMetrics = currentMetrics || dashboard.metrics;
  const weekly = dashboard.weekly?.length ? dashboard.weekly : [];
  const polyline = buildPolyline(weekly);
  const improvement = Number(dashboard.improvement) || 0;

  return (
    <aside className="insights-panel">
      <section className="dashboard-hero-card reveal-card">
        <div className="dashboard-hero-copy">
          <span className="mini-label"><Sparkles size={13} /> Today’s English</span>
          <h2>{effectiveScore ? 'You are sounding stronger.' : 'Your progress starts here.'}</h2>
          <p>
            {effectiveScore
              ? `Your latest answer scored ${Math.round(effectiveScore)}%. Keep the conversation going.`
              : 'Speak or type your first answer to unlock live coaching analytics.'}
          </p>
          <div className={`trend-pill ${improvement < 0 ? 'down' : ''}`}>
            <TrendingUp size={15} />
            {improvement ? `${improvement > 0 ? '+' : ''}${improvement}% vs earlier answers` : 'Live score updates'}
          </div>
        </div>
        <ScoreRing score={effectiveScore} size={132} label="score" />
      </section>

      <section className="metric-card reveal-card delay-1">
        <div className="card-heading compact">
          <div>
            <span className="mini-label">Skill breakdown</span>
            <h3>How your English sounds</h3>
          </div>
          <Target size={19} />
        </div>
        <div className="metric-stack">
          {Object.keys(metricLabels).map((name) => (
            <MetricBar key={name} name={name} value={effectiveMetrics?.[name] ?? null} />
          ))}
        </div>
      </section>

      <section className="trend-card reveal-card delay-2">
        <div className="card-heading compact">
          <div>
            <span className="mini-label">Last seven days</span>
            <h3>Practice momentum</h3>
          </div>
          <TrendingUp size={19} />
        </div>
        <div className="line-chart-wrap">
          <svg className="line-chart" viewBox="0 0 280 100" preserveAspectRatio="none" aria-label="Weekly English score graph">
            <polyline className="line-chart-shadow" points={polyline} fill="none" />
            <polyline className="line-chart-line" points={polyline} fill="none" />
          </svg>
          <div className="chart-labels">
            {weekly.map((item) => (
              <span key={item.date || item.label}>{item.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-stat-grid reveal-card delay-3">
        <article>
          <span className="stat-icon orange"><Flame size={18} /></span>
          <strong>{dashboard.totals?.streak || 0}</strong>
          <small>day streak</small>
        </article>
        <article>
          <span className="stat-icon purple"><MessageCircle size={18} /></span>
          <strong>{dashboard.totals?.answers || 0}</strong>
          <small>answers</small>
        </article>
        <article>
          <span className="stat-icon blue"><Type size={18} /></span>
          <strong>{dashboard.totals?.words || 0}</strong>
          <small>words used</small>
        </article>
        <article>
          <span className="stat-icon green"><BookOpen size={18} /></span>
          <strong>{dashboard.totals?.sessions || 0}</strong>
          <small>sessions</small>
        </article>
      </section>

      <section className="coach-tip-card reveal-card delay-4">
        <div className="tip-icon"><Award size={20} /></div>
        <div>
          <span className="mini-label">Coach recommendation</span>
          <h3>Try your next weak area</h3>
          <p>
            {dashboard.recommendedTopic
              ? `A short ${dashboard.recommendedTopic.replaceAll('-', ' ')} practice can improve your balance.`
              : 'Complete a few answers and Nova will recommend your next topic.'}
          </p>
        </div>
        <button type="button" onClick={() => onStartRecommended?.(dashboard.recommendedTopic || 'daily')}>
          Start
        </button>
      </section>

      {!dashboard.databaseConnected && (
        <section className="database-alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Cloud tracking is offline</strong>
            <p>Your live score still works. Connect MongoDB to save charts and chats across visits.</p>
          </div>
        </section>
      )}
    </aside>
  );
}
