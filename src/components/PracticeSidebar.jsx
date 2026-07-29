import {
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Headphones,
  History,
  Languages,
  LoaderCircle,
  MessageSquareText,
  Mic2,
  PhoneCall,
  Plane,
  Plus,
  Presentation,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { LEVELS } from '../data/defaults';

const ICONS = {
  daily: Languages,
  interview: BriefcaseBusiness,
  business: Building2,
  presentation: Presentation,
  travel: Plane,
  phone: PhoneCall,
  shopping: ShoppingBag,
  pronunciation: Headphones,
};

const formatSessionDate = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

export default function PracticeSidebar({
  topics,
  selectedTopic,
  level,
  sessions,
  activeSessionId,
  recommendedTopic,
  historyLoading,
  historyError,
  onLevelChange,
  onTopicChange,
  onOpenSession,
  onNewChat,
}) {
  return (
    <aside className="practice-sidebar">
      <section className="welcome-panel reveal-card">
        <div className="welcome-orb orb-one" />
        <div className="welcome-orb orb-two" />
        <span className="welcome-badge"><Sparkles size={14} /> AI speaking studio</span>
        <h1>Speak clearly.<br />Grow daily.</h1>
        <p>Real conversations, instant corrections, and progress you can actually see.</p>
        <div className="welcome-wave" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => <span key={index} />)}
        </div>
      </section>

      <section className="sidebar-card reveal-card delay-1">
        <div className="sidebar-card-title">
          <div>
            <span className="mini-label">Difficulty</span>
            <h2>Choose your level</h2>
          </div>
          <ChartNoAxesCombined size={19} />
        </div>
        <div className="level-selector">
          {LEVELS.map((item) => (
            <button
              type="button"
              key={item}
              className={level === item ? 'active' : ''}
              onClick={() => onLevelChange(item)}
            >
              {level === item && <Check size={13} />}
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section reveal-card delay-2">
        <div className="section-label-row">
          <span className="mini-label">Suggested practice</span>
          <Mic2 size={17} />
        </div>
        <div className="topic-stack">
          {topics.map((item) => {
            const Icon = ICONS[item.id] || MessageSquareText;
            const selected = selectedTopic === item.id;
            const recommended = recommendedTopic === item.id || item.recommended;
            return (
              <button
                type="button"
                key={item.id}
                className={`topic-tile accent-${item.accent || 'violet'} ${selected ? 'active' : ''}`}
                onClick={() => onTopicChange(item.id)}
              >
                <span className="topic-tile-icon"><Icon size={19} /></span>
                <span className="topic-tile-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                {recommended && !selected ? <span className="recommended-dot">Best</span> : <ChevronRight size={17} />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="sidebar-card history-panel reveal-card delay-3">
        <div className="sidebar-card-title history-title">
          <div>
            <span className="mini-label">Saved chats</span>
            <h2><History size={17} /> Recent conversations</h2>
          </div>
          <button className="square-action" type="button" onClick={onNewChat} aria-label="Start new chat">
            <Plus size={18} />
          </button>
        </div>

        {historyError && <div className="inline-warning">{historyError}</div>}
        {historyLoading ? (
          <div className="history-placeholder"><LoaderCircle className="spin" size={17} /> Loading conversations…</div>
        ) : sessions.length ? (
          <div className="conversation-list">
            {sessions.slice(0, 6).map((session) => (
              <button
                type="button"
                key={session.id}
                className={activeSessionId === session.id ? 'active' : ''}
                onClick={() => onOpenSession(session.id)}
              >
                <span className="conversation-dot" />
                <span>
                  <strong>{session.title}</strong>
                  <small>{formatSessionDate(session.updatedAt)} · {session.averageScore || 0}% score</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="history-placeholder">Your first conversation will appear here.</div>
        )}
      </section>
    </aside>
  );
}
