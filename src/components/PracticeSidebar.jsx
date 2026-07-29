import { useEffect, useMemo, useState } from 'react';
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
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
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

const describeMicrophone = (speech) => {
  if (!speech?.supported) return 'Not available in this browser';
  if (speech.permission === 'granted') return 'Allowed for this site';
  if (speech.permission === 'denied') return 'Blocked in browser settings';
  return 'Permission not requested yet';
};

function SettingsPanel({ autoSpeak, onToggleSpeak, speech, onResetProgress, onClose }) {
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className="settings-popover" role="dialog" aria-label="Workspace settings">
      <div className="settings-heading">
        <strong>Workspace settings</strong>
        <button type="button" onClick={onClose} aria-label="Close settings"><X size={15} /></button>
      </div>

      <button
        type="button"
        className={`settings-row toggle-row ${autoSpeak ? 'on' : ''}`}
        onClick={onToggleSpeak}
        aria-pressed={autoSpeak}
      >
        <span className="settings-row-icon"><Volume2 size={15} /></span>
        <span className="settings-row-copy">
          <strong>Voice replies</strong>
          <small>{autoSpeak ? 'SpeakFlow reads its answers aloud' : 'Replies stay silent'}</small>
        </span>
        <i className="settings-switch" aria-hidden="true"><em /></i>
      </button>

      <div className={`settings-row ${speech?.permission === 'denied' || !speech?.supported ? 'alert' : ''}`}>
        <span className="settings-row-icon"><Mic size={15} /></span>
        <span className="settings-row-copy">
          <strong>Microphone</strong>
          <small>{describeMicrophone(speech)}</small>
        </span>
        {speech?.supported && speech.permission !== 'granted' && (
          <button
            type="button"
            className="settings-action"
            onClick={speech.requestMicrophone}
            disabled={speech.requestingPermission}
          >
            {speech.requestingPermission ? 'Asking…' : 'Allow'}
          </button>
        )}
      </div>

      {!speech?.supported && speech?.unsupportedReason && (
        <p className="settings-note">{speech.unsupportedReason}</p>
      )}

      <button
        type="button"
        className="settings-row"
        onClick={() => {
          onResetProgress?.();
          setResetDone(true);
        }}
      >
        <span className="settings-row-icon"><RotateCcw size={15} /></span>
        <span className="settings-row-copy">
          <strong>Reset local progress</strong>
          <small>{resetDone ? 'Local scores cleared' : 'Clear scores saved in this browser'}</small>
        </span>
      </button>
    </div>
  );
}

export default function PracticeSidebar({
  topics,
  selectedTopic,
  level,
  sessions,
  activeSessionId,
  recommendedTopic,
  historyLoading,
  historyError,
  autoSpeak,
  speech,
  onLevelChange,
  onTopicChange,
  onAddTopic,
  onOpenSession,
  onNewChat,
  onToggleSpeak,
  onResetProgress,
}) {
  const [query, setQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const normalisedQuery = query.trim().toLowerCase();
  const queryTerms = normalisedQuery.split(/\s+/).filter(Boolean);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [settingsOpen]);

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
        <div className="sidebar-settings-wrap">
          <button
            type="button"
            className={`sidebar-settings ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen((value) => !value)}
            aria-expanded={settingsOpen}
            aria-label="Workspace settings"
          >
            <SlidersHorizontal size={17} />
          </button>
          {settingsOpen && (
            <SettingsPanel
              autoSpeak={autoSpeak}
              onToggleSpeak={onToggleSpeak}
              speech={speech}
              onResetProgress={onResetProgress}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      {settingsOpen && (
        <button
          type="button"
          className="settings-backdrop"
          aria-label="Close settings"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      <div className="sidebar-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or create a topic"
          aria-label="Search topics or chats"
        />
      </div>

      <div className="sidebar-scroll">
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
      </div>

      <button className="sidebar-new-chat" type="button" onClick={onNewChat}>
        <span>New conversation</span>
        <i><Plus size={18} /></i>
      </button>
    </aside>
  );
}
