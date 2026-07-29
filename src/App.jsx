import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleUserRound,
  CloudOff,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import ChatPanel from './components/ChatPanel';
import DashboardPanel from './components/DashboardPanel';
import PracticeSidebar from './components/PracticeSidebar';
import { EMPTY_DASHBOARD, DEFAULT_TOPICS, WELCOME_MESSAGE } from './data/defaults';
import { authApi, tutorApi } from './services/api';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const LOCAL_DASHBOARD_KEY = 'speakflow_local_dashboard_v2';

const speakText = (text) => {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.94;
  utterance.pitch = 1.02;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => /Samantha|Google US English|Microsoft Aria/i.test(voice.name))
    || voices.find((voice) => voice.lang.startsWith('en'));
  if (preferredVoice) utterance.voice = preferredVoice;
  window.speechSynthesis.speak(utterance);
};

const readLocalDashboard = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DASHBOARD_KEY)) || null;
  } catch {
    return null;
  }
};

const applyLocalMetrics = (dashboard, metrics) => {
  if (!metrics) return dashboard;
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(now);
  const weekly = (dashboard.weekly?.length ? dashboard.weekly : EMPTY_DASHBOARD.weekly).map((item) => (
    item.label === weekday
      ? {
          ...item,
          score: metrics.overall,
          answers: Number(item.answers || 0) + 1,
          words: Number(item.words || 0) + Number(metrics.wordCount || 0),
        }
      : item
  ));

  const next = {
    ...dashboard,
    todayScore: metrics.overall,
    metrics: {
      grammar: metrics.grammar,
      vocabulary: metrics.vocabulary,
      fluency: metrics.fluency,
      pronunciation: metrics.pronunciation,
    },
    totals: {
      ...dashboard.totals,
      answers: Number(dashboard.totals?.answers || 0) + 1,
      words: Number(dashboard.totals?.words || 0) + Number(metrics.wordCount || 0),
      corrections: Number(dashboard.totals?.corrections || 0) + Number(metrics.issueCount > 0),
    },
    weekly,
  };
  localStorage.setItem(LOCAL_DASHBOARD_KEY, JSON.stringify(next));
  return next;
};

const cleanStarter = (value = '') => value.replace(/…/g, '').trim();

function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [topicId, setTopicId] = useState('daily');
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [sentenceSuggestions, setSentenceSuggestions] = useState(DEFAULT_TOPICS[0].starters);
  const [wordSuggestions, setWordSuggestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [interactionId, setInteractionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [dashboard, setDashboard] = useState(() => readLocalDashboard() || EMPTY_DASHBOARD);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const endRef = useRef(null);
  const suggestionRequest = useRef(0);

  const onSpeechResult = useCallback((transcript) => {
    setMessage(transcript);
  }, []);

  const speech = useSpeechRecognition({ onResult: onSpeechResult });

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === topicId)
      || DEFAULT_TOPICS.find((topic) => topic.id === topicId)
      || DEFAULT_TOPICS[0],
    [topicId, topics],
  );

  const loadSessions = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await tutorApi.getSessions();
      setSessions(data.sessions || []);
      if (data.databaseConnected === false) {
        setHistoryError(data.database?.error?.message || 'MongoDB is offline, so cloud chat history is unavailable.');
      } else {
        setHistoryError('');
      }
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await tutorApi.getDashboard();
      const remoteDashboard = data.dashboard || EMPTY_DASHBOARD;
      const localDashboard = readLocalDashboard();
      const useLocal = !remoteDashboard.databaseConnected && localDashboard?.totals?.answers;
      setDashboard(useLocal
        ? { ...remoteDashboard, ...localDashboard, databaseConnected: false, database: remoteDashboard.database }
        : remoteDashboard);
    } catch {
      const localDashboard = readLocalDashboard();
      if (localDashboard) setDashboard({ ...localDashboard, databaseConnected: false });
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const data = await tutorApi.getTopics();
      if (data.topics?.length) {
        setTopics(data.topics);
        const current = data.topics.find((topic) => topic.id === topicId);
        if (current?.starters) setSentenceSuggestions(current.starters);
      }
    } catch {
      setTopics(DEFAULT_TOPICS);
    }
  }, [topicId]);

  const loadWorkspace = useCallback(async () => {
    await Promise.all([loadSessions(), loadDashboard(), loadTopics()]);
  }, [loadDashboard, loadSessions, loadTopics]);

  useEffect(() => {
    const initialise = async () => {
      if (localStorage.getItem('speakflow_token')) {
        try {
          const data = await authApi.me();
          setUser(data.user);
        } catch {
          localStorage.removeItem('speakflow_token');
        }
      }
      await loadWorkspace();
    };
    initialise();
  }, [loadWorkspace]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    const trimmed = message.trimEnd();
    if (!trimmed) {
      setWordSuggestions([]);
      setSentenceSuggestions(selectedTopic.starters || []);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const requestId = suggestionRequest.current + 1;
      suggestionRequest.current = requestId;
      const currentWord = /\s$/.test(message) ? '' : (trimmed.split(/\s+/).at(-1) || '');
      try {
        const data = await tutorApi.getWordSuggestions({
          query: currentWord,
          context: trimmed,
          topic: topicId,
        });
        if (suggestionRequest.current !== requestId) return;
        setWordSuggestions(data.suggestions || []);
        if (data.sentences?.length) setSentenceSuggestions(data.sentences);
      } catch {
        const localPool = ['because', 'however', 'usually', 'really', 'improve'];
        setWordSuggestions(localPool.filter((word) => word.startsWith(currentWord.toLowerCase())).slice(0, 4));
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [message, selectedTopic.starters, topicId]);

  const handleMessageChange = (value) => {
    setMessage(value);
    if (!speech.isListening) speech.markTyped();
  };

  const handleWordSuggestion = (suggestion) => {
    setMessage((current) => {
      if (!current.trim()) return `${suggestion} `;
      if (/\s$/.test(current)) return `${current}${suggestion} `;
      const parts = current.split(/\s+/);
      parts[parts.length - 1] = suggestion;
      return `${parts.join(' ')} `;
    });
  };

  const handleSentenceSuggestion = (suggestion) => {
    setMessage(cleanStarter(suggestion));
    speech.markTyped();
  };

  const sendMessage = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    setMessages((current) => [...current, { role: 'user', text: cleanMessage }]);
    setMessage('');
    setWordSuggestions([]);
    setLoading(true);

    try {
      const data = await tutorApi.respond({
        message: cleanMessage,
        level,
        topic: topicId,
        sessionId,
        interactionId,
        inputMode: speech.lastInputMode,
        speechConfidence: speech.lastConfidence,
      });

      setMessages((current) => {
        const updated = [...current];
        for (let index = updated.length - 1; index >= 0; index -= 1) {
          if (updated[index].role === 'user' && !updated[index].metrics) {
            updated[index] = { ...updated[index], metrics: data.metrics };
            break;
          }
        }
        return [...updated, {
          role: 'assistant',
          reply: data.reply,
          correction: data.correction,
          meaning: data.meaning,
          vocabulary: data.vocabulary,
          encouragement: data.encouragement,
          metrics: data.metrics,
        }];
      });

      setCurrentMetrics(data.metrics || null);
      setDashboard((current) => applyLocalMetrics(current, data.metrics));
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.interactionId) setInteractionId(data.interactionId);

      if (data.saved) {
        setHistoryError('');
        await Promise.all([loadSessions(), loadDashboard()]);
      } else if (data.saveMessage) {
        setHistoryError(data.database?.error?.message || data.saveMessage);
      }

      if (autoSpeak) {
        const spokenFeedback = data.correction
          ? `${data.reply} A better sentence is: ${data.correction.corrected}`
          : data.reply;
        speakText(spokenFeedback);
      }
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        reply: error.message,
        isError: true,
      }]);
    } finally {
      setLoading(false);
      speech.markTyped();
    }
  };

  const startTopic = (newTopicId) => {
    const nextTopic = topics.find((item) => item.id === newTopicId)
      || DEFAULT_TOPICS.find((item) => item.id === newTopicId)
      || DEFAULT_TOPICS[0];
    setTopicId(nextTopic.id);
    setSessionId(null);
    setInteractionId(null);
    setCurrentMetrics(null);
    setMessage('');
    setSentenceSuggestions(nextTopic.starters || []);
    setMessages([{
      role: 'assistant',
      reply: `Great choice. Let’s practise ${nextTopic.label.toLowerCase()}. ${nextTopic.prompt}`,
      correction: null,
    }]);
    setMobileMenuOpen(false);
  };

  const startNewChat = () => {
    setSessionId(null);
    setInteractionId(null);
    setCurrentMetrics(null);
    setMessage('');
    setMessages([{
      role: 'assistant',
      reply: `${selectedTopic.prompt} Your answers will be analysed as you go.`,
      correction: null,
    }]);
  };

  const openSession = async (selectedSessionId) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await tutorApi.getSession(selectedSessionId);
      const savedSession = data.session;
      const restoredMessages = savedSession.messages.map((item) => (
        item.role === 'user'
          ? { role: 'user', text: item.text, metrics: item.metrics }
          : {
              role: 'assistant',
              reply: item.text,
              correction: item.correction,
              meaning: item.meaning,
              vocabulary: item.vocabulary,
              encouragement: item.encouragement,
            }
      ));
      const lastScored = [...savedSession.messages]
        .reverse()
        .find((item) => item.role === 'user' && item.metrics)?.metrics;
      setSessionId(savedSession.id);
      setInteractionId(savedSession.interactionId || null);
      setTopicId(savedSession.topic || 'daily');
      setLevel(savedSession.level || 'Beginner');
      setMessages(restoredMessages.length ? restoredMessages : [WELCOME_MESSAGE]);
      setCurrentMetrics(lastScored || null);
      setHistoryError('');
      setMobileMenuOpen(false);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = authMode === 'register'
        ? await authApi.register(authForm)
        : await authApi.login({ email: authForm.email, password: authForm.password });
      localStorage.setItem('speakflow_token', data.token);
      setUser(data.user);
      setAuthOpen(false);
      setAuthForm({ name: '', email: '', password: '' });
      await tutorApi.claimSessions();
      await loadWorkspace();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('speakflow_token');
    setUser(null);
    setSessionId(null);
    setInteractionId(null);
    setMessages([WELCOME_MESSAGE]);
    await loadWorkspace();
  };

  const speechControls = {
    ...speech,
    speakText,
  };

  return (
    <div className="app-shell">
      <div className="ambient-gradient ambient-one" />
      <div className="ambient-gradient ambient-two" />
      <div className="ambient-grid" />

      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu-button" type="button" onClick={() => setMobileMenuOpen((value) => !value)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a className="brand" href="#top" aria-label="SpeakFlow home">
            <span className="brand-mark"><Sparkles size={20} /></span>
            <span>
              <strong>SpeakFlow</strong>
              <small>English growth studio</small>
            </span>
          </a>
        </div>

        <div className="topbar-status">
          <span className={dashboard.databaseConnected ? 'connected' : ''}>
            {dashboard.databaseConnected ? <ShieldCheck size={16} /> : <CloudOff size={16} />}
            {dashboard.databaseConnected ? 'Cloud tracking active' : 'Local tracking mode'}
          </span>
        </div>

        <div className="header-actions">
          <button type="button" className={`header-voice ${autoSpeak ? 'active' : ''}`} onClick={() => setAutoSpeak((value) => !value)}>
            <Volume2 size={17} />
            <span>Voice replies</span>
          </button>
          {user ? (
            <div className="user-menu">
              <span><CircleUserRound size={18} /> {user.name}</span>
              <button type="button" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
            </div>
          ) : (
            <button type="button" className="sync-button" onClick={() => setAuthOpen(true)}>
              Sync progress
            </button>
          )}
        </div>
      </header>

      <main className="dashboard-layout" id="top">
        <div className={`sidebar-shell ${mobileMenuOpen ? 'open' : ''}`}>
          <PracticeSidebar
            topics={topics}
            selectedTopic={topicId}
            level={level}
            sessions={sessions}
            activeSessionId={sessionId}
            recommendedTopic={dashboard.recommendedTopic}
            historyLoading={historyLoading}
            historyError={historyError}
            onLevelChange={setLevel}
            onTopicChange={startTopic}
            onOpenSession={openSession}
            onNewChat={startNewChat}
          />
        </div>

        <ChatPanel
          topic={selectedTopic}
          level={level}
          messages={messages}
          loading={loading}
          message={message}
          wordSuggestions={wordSuggestions}
          sentenceSuggestions={sentenceSuggestions}
          autoSpeak={autoSpeak}
          speech={speechControls}
          onMessageChange={handleMessageChange}
          onSend={sendMessage}
          onWordSuggestion={handleWordSuggestion}
          onSentenceSuggestion={handleSentenceSuggestion}
          onToggleSpeak={() => setAutoSpeak((value) => !value)}
          endRef={endRef}
        />

        <DashboardPanel
          dashboard={dashboard}
          currentMetrics={currentMetrics}
          onStartRecommended={startTopic}
        />
      </main>

      {authOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}>
          <div className="auth-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setAuthOpen(false)}><X size={20} /></button>
            <span className="brand-mark large"><Sparkles size={24} /></span>
            <span className="mini-label">Your learning account</span>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your profile'}</h2>
            <p>Sync conversations, scores, streaks, and weekly progress across devices.</p>
            <form onSubmit={submitAuth}>
              {authMode === 'register' && (
                <label>Full name<input required value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>
              )}
              <label>Email address<input type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
              <label>Password<input type="password" minLength="6" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
              {authError && <div className="auth-error">{authError}</div>}
              <button className="primary-button" disabled={authLoading}>
                {authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in and sync' : 'Create account'}
              </button>
            </form>
            <button className="switch-auth" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
