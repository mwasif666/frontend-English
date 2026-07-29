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
  grammar: 'Grammar accuracy',
  vocabulary: 'Vocabulary range',
  fluency: 'Fluency',
  pronunciation: 'Pronunciation',
};

const buildPolyline = (weekly = []) => {
  const values = weekly.map((item) => Number(item.score) || 0);
  const width = 640;
  const height = 180;
  const padding = 16;
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
    <div className="analytics-dashboard view-enter">
      <div className="view-heading dashboard-heading">
        <div>
          <span className="section-kicker">Learning analytics</span>
          <h2>Your English progress</h2>
          <p>Track how your grammar, vocabulary, fluency and speaking confidence improve over time.</p>
        </div>
        <div className={`dashboard-cloud-state ${dashboard.databaseConnected ? 'connected' : ''}`}>
          <i />
          {dashboard.databaseConnected ? 'Cloud history connected' : 'Local progress mode'}
        </div>
      </div>

      <div className="dashboard-summary-grid">
        <section className="dashboard-score-card">
          <div>
            <span className="mini-label"><Sparkles size={13} /> Today’s English</span>
            <h3>{effectiveScore ? 'You are sounding stronger.' : 'Complete your first answer.'}</h3>
            <p>
              {effectiveScore
                ? `Your latest answer scored ${Math.round(effectiveScore)}%. Keep practising to strengthen your weakest skill.`
                : 'Your score will appear after you type or speak an English answer.'}
            </p>
            <span className={`trend-pill ${improvement < 0 ? 'down' : ''}`}>
              <TrendingUp size={15} />
              {improvement ? `${improvement > 0 ? '+' : ''}${improvement}% compared with earlier answers` : 'Live score updates'}
            </span>
          </div>
          <ScoreRing score={effectiveScore} size={150} label="overall" />
        </section>

        <section className="dashboard-stat-grid">
          <article>
            <span className="stat-icon orange"><Flame size={18} /></span>
            <strong>{dashboard.totals?.streak || 0}</strong>
            <small>day streak</small>
          </article>
          <article>
            <span className="stat-icon green"><MessageCircle size={18} /></span>
            <strong>{dashboard.totals?.answers || 0}</strong>
            <small>answers</small>
          </article>
          <article>
            <span className="stat-icon blue"><Type size={18} /></span>
            <strong>{dashboard.totals?.words || 0}</strong>
            <small>words used</small>
          </article>
          <article>
            <span className="stat-icon purple"><BookOpen size={18} /></span>
            <strong>{dashboard.totals?.sessions || 0}</strong>
            <small>sessions</small>
          </article>
        </section>
      </div>

      <div className="dashboard-detail-grid">
        <section className="dashboard-chart-card">
          <div className="card-heading compact">
            <div>
              <span className="mini-label">Last seven days</span>
              <h3>Practice momentum</h3>
            </div>
            <TrendingUp size={19} />
          </div>
          <div className="line-chart-wrap">
            <svg className="line-chart" viewBox="0 0 640 190" preserveAspectRatio="none" aria-label="Weekly English score graph">
              <defs>
                <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#54e85d" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#54e85d" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline className="line-chart-shadow" points={polyline} fill="none" />
              <polyline className="line-chart-line" points={polyline} fill="none" />
            </svg>
            <div className="chart-labels">
              {weekly.map((item) => <span key={item.date || item.label}>{item.label}</span>)}
            </div>
          </div>
        </section>

        <section className="metric-card">
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
      </div>

      <section className="coach-tip-card">
        <span className="tip-icon"><Award size={20} /></span>
        <div>
          <span className="mini-label">Coach recommendation</span>
          <h3>Practise your next weak area</h3>
          <p>
            {dashboard.recommendedTopic
              ? `A short ${dashboard.recommendedTopic.replaceAll('-', ' ')} conversation can improve your balance.`
              : 'Complete a few answers and SpeakFlow will recommend your next topic.'}
          </p>
        </div>
        <button type="button" onClick={() => onStartRecommended?.(dashboard.recommendedTopic || 'daily')}>Start practice</button>
      </section>

      {!dashboard.databaseConnected && (
        <section className="database-alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Cloud history is currently offline</strong>
            <p>Your live scores still work locally. Connect MongoDB to save chats and analytics across browsers and devices.</p>
          </div>
        </section>
      )}
    </div>
  );
}
