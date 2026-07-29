import { useMemo, useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  Folder,
  Headphones,
  History,
  Languages,
  LoaderCircle,
  MessageSquare,
  Mic,
  Monitor,
  PhoneCall,
  Plane,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { LEVELS } from '../data/defaults';

const ICONS = {
  daily: Languages,
  interview: BriefcaseBusiness,
  business: Building2,
  'client-project': BriefcaseBusiness,
  presentation: Monitor,
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
  onAddTopic,
  onOpenSession,
  onNewChat,
}) {
  const [query, setQuery] = useState('');
  const normalisedQuery = query.trim().toLowerCase();
  const queryTerms = normalisedQuery.split(/\s+/).filter(Boolean);

  const filteredTopics = useMemo(() => (
    topics.filter((item) => {
      const searchableText = `${item.label} ${item.description}`.toLowerCase();
      return !queryTerms.length || queryTerms.every((term) => searchableText.includes(term));
    })
  ), [queryTerms, topics]);

  const filteredSessions = useMemo(() => (
    sessions.filter((item) => !normalisedQuery
      || item.title.toLowerCase().includes(normalisedQuery)
      || item.preview?.toLowerCase().includes(normalisedQuery))
  ), [normalisedQuery, sessions]);
  const canCreateTopic = normalisedQuery.length >= 3 && filteredTopics.length === 0;

  return (
    <aside className="practice-sidebar">
      <div className="sidebar-brand-row">
        <a className="sidebar-brand" href="#top" aria-label="SpeakFlow home">
          <span className="sidebar-brand-mark"><Sparkles size={18} /></span>
          <span>
            <strong>SpeakFlow</strong>
            <small>English tutor</small>
          </span>
        </a>
        <button type="button" className="sidebar-settings" aria-label="Workspace settings">
          <SlidersHorizontal size={17} />
        </button>
      </div>

      <div className="sidebar-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or create a topic"
          aria-label="Search topics or chats"
        />
      </div>

      <section className="sidebar-block level-block">
        <div className="sidebar-label-row">
          <span>English level</span>
          <BarChart3 size={14} />
        </div>
        <div className="compact-level-selector">
          {LEVELS.map((item) => (
            <button
              type="button"
              key={item}
              className={level === item ? 'active' : ''}
              onClick={() => onLevelChange(item)}
            >
              {level === item && <Check size={12} />}
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-block topic-folder-block">
        <div className="sidebar-label-row">
          <span>Practice folders</span>
          <Mic size={14} />
        </div>
        <div className="sidebar-topic-list">
          {filteredTopics.map((item) => {
            const Icon = ICONS[item.id] || MessageSquare;
            const selected = selectedTopic === item.id;
            const recommended = recommendedTopic === item.id || item.recommended;
            return (
              <button
                type="button"
                key={item.id}
                className={selected ? 'active' : ''}
                onClick={() => onTopicChange(item.id)}
              >
                <span className="sidebar-topic-icon"><Icon size={16} /></span>
                <span className="sidebar-topic-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                {recommended && !selected ? <span className="best-pill">Best</span> : <Folder size={14} />}
              </button>
            );
          })}
          {canCreateTopic && (
            <button
              type="button"
              className="create-topic-result"
              onClick={() => {
                onAddTopic(query);
                setQuery('');
              }}
            >
              <span className="sidebar-topic-icon"><Plus size={16} /></span>
              <span className="sidebar-topic-copy">
                <strong>Add “{query.trim()}”</strong>
                <small>Create questions and practise this situation</small>
              </span>
              <span className="create-pill">Create</span>
            </button>
          )}
        </div>
      </section>

      <section className="sidebar-block chats-block">
        <div className="sidebar-label-row">
          <span>Recent chats</span>
          <History size={14} />
        </div>

        {historyError && <div className="inline-warning">{historyError}</div>}
        {historyLoading ? (
          <div className="history-placeholder"><LoaderCircle className="spin" size={16} /> Loading chats…</div>
        ) : filteredSessions.length ? (
          <div className="conversation-list">
            {filteredSessions.slice(0, 7).map((session) => (
              <button
                type="button"
                key={session.id}
                className={activeSessionId === session.id ? 'active' : ''}
                onClick={() => onOpenSession(session.id)}
              >
                <MessageSquare size={15} />
                <span>
                  <strong>{session.title}</strong>
                  <small>{formatSessionDate(session.updatedAt)} · {session.averageScore || 0}% score</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="history-placeholder">Your saved conversations will appear here.</div>
        )}
      </section>

      <button className="sidebar-new-chat" type="button" onClick={onNewChat}>
        <span>New conversation</span>
        <i><Plus size={18} /></i>
      </button>
    </aside>
  );
}
