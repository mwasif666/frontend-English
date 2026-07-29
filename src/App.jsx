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
import PracticeSidebar from './components/PracticeSidebar';
import Workspace from './components/Workspace';
import { EMPTY_DASHBOARD, DEFAULT_TOPICS, WELCOME_MESSAGE } from './data/defaults';
import { authApi, tutorApi } from './services/api';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const LOCAL_DASHBOARD_KEY = 'speakflow_local_dashboard_v2';
const CUSTOM_TOPICS_KEY = 'speakflow_custom_topics_v1';

const readCustomTopics = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TOPICS_KEY));
    return Array.isArray(saved)
      ? saved.filter((topic) => topic?.id && topic?.label && Array.isArray(topic.questions))
      : [];
  } catch {
    return [];
  }
};

const mergeTopics = (remoteTopics = [], customTopics = readCustomTopics()) => {
  const defaultsById = new Map(DEFAULT_TOPICS.map((topic) => [topic.id, topic]));
  const enrichedRemote = remoteTopics.map((topic) => ({
    ...defaultsById.get(topic.id),
    ...topic,
    questions: topic.questions?.length
      ? topic.questions
      : defaultsById.get(topic.id)?.questions || [topic.prompt].filter(Boolean),
  }));
  const builtIn = enrichedRemote.length ? enrichedRemote : DEFAULT_TOPICS;
  const ids = new Set(builtIn.map((topic) => topic.id));
  return [...builtIn, ...customTopics.filter((topic) => !ids.has(topic.id))];
};

const createCustomTopic = (label) => {
  const cleanLabel = label.trim().replace(/\s+/g, ' ').slice(0, 60);
  const slug = cleanLabel.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'practice';

  return {
    id: `custom-${slug}-${Date.now().toString(36)}`,
    label: cleanLabel,
    description: `Personal practice for ${cleanLabel}.`,
    prompt: `Let's practise ${cleanLabel}. Explain the situation and what you want to achieve.`,
    questions: [],
    questionMeanings: [],
    starters: [],
    accent: 'green',
    isCustom: true,
  };
};

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
  const [topics, setTopics] = useState(() => mergeTopics());
  const [sentenceSuggestions, setSentenceSuggestions] = useState(DEFAULT_TOPICS[0].starters);
  const [practiceQuestion, setPracticeQuestion] = useState(DEFAULT_TOPICS[0].questions[0]);
  const [wordSuggestions, setWordSuggestions] = useState([]);
  const [grammarIssues, setGrammarIssues] = useState([]);
  const [grammarSuggestion, setGrammarSuggestion] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceRevision, setPracticeRevision] = useState(0);
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
  const writingRequest = useRef(0);
  const practiceRequest = useRef(0);
  const speechBaseRef = useRef('');

  const onSpeechResult = useCallback((transcript) => {
    const base = speechBaseRef.current.trim();
    setMessage([base, transcript].filter(Boolean).join(base ? ' ' : ''));
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
      setTopics(mergeTopics(data.topics || []));
    } catch {
      setTopics(mergeTopics());
    }
  }, []);

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
    setSentenceSuggestions(selectedTopic.starters || []);
    setPracticeQuestion((current) => (
      selectedTopic.questions?.includes(current)
        ? current
        : selectedTopic.questions?.[0] || selectedTopic.prompt
    ));
  }, [selectedTopic]);

  useEffect(() => {
    const requestId = practiceRequest.current + 1;
    practiceRequest.current = requestId;
    setPracticeLoading(true);

    const refreshPractice = async () => {
      try {
        const data = await tutorApi.generatePractice({
          topic: selectedTopic.id,
          topicLabel: selectedTopic.label,
          level,
        });
        if (practiceRequest.current !== requestId || !data.practice?.questions?.length) return;
        const practice = data.practice;
        setTopics((current) => current.map((item) => (
          item.id === selectedTopic.id
            ? {
                ...item,
                description: practice.description || item.description,
                questions: practice.questions,
                questionMeanings: practice.questionMeanings || [],
                starters: practice.starters?.length ? practice.starters : item.starters,
                grounded: practice.grounded,
              }
            : item
        )));
        setPracticeQuestion(practice.questions[0]);
        setSentenceSuggestions(practice.starters || []);
      } catch {
        // Existing local prompts remain available when AI generation is offline.
      } finally {
        if (practiceRequest.current === requestId) setPracticeLoading(false);
      }
    };

    refreshPractice();
  // A new set is intentionally generated only when the selected topic or level changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, level, practiceRevision]);

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

  useEffect(() => {
    const text = message.trim();
    if (text.length < 3) {
      setGrammarIssues([]);
      setGrammarSuggestion(null);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const requestId = writingRequest.current + 1;
      writingRequest.current = requestId;
      try {
        const data = await tutorApi.checkWriting(message);
        if (writingRequest.current !== requestId) return;
        setGrammarIssues(data.issues || []);
        setGrammarSuggestion(data.issues?.length ? {
          corrected: data.corrected,
          explanation: data.explanation,
        } : null);
      } catch {
        setGrammarIssues([]);
        setGrammarSuggestion(null);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [message]);

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

  const applyGrammarSuggestion = () => {
    if (!grammarSuggestion?.corrected) return;
    setMessage(grammarSuggestion.corrected);
    setGrammarIssues([]);
    setGrammarSuggestion(null);
    speech.markTyped();
  };

  const sendMessage = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    setMessages((current) => [...current, { role: 'user', text: cleanMessage }]);
    setMessage('');
    setGrammarIssues([]);
    setGrammarSuggestion(null);
    setWordSuggestions([]);
    setLoading(true);

    try {
      const data = await tutorApi.respond({
        message: cleanMessage,
        level,
        topic: topicId,
        topicLabel: selectedTopic.label,
        practiceQuestion,
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
          replyMeaning: data.replyMeaning,
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

  const startTopic = (topicOrId) => {
    const newTopicId = typeof topicOrId === 'string' ? topicOrId : topicOrId.id;
    const nextTopic = (typeof topicOrId === 'object' ? topicOrId : null)
      || topics.find((item) => item.id === newTopicId)
      || DEFAULT_TOPICS.find((item) => item.id === newTopicId)
      || DEFAULT_TOPICS[0];
    setTopicId(nextTopic.id);
    setPracticeRevision((current) => current + 1);
    setSessionId(null);
    setInteractionId(null);
    setCurrentMetrics(null);
    setMessage('');
    setGrammarIssues([]);
    setGrammarSuggestion(null);
    setSentenceSuggestions(nextTopic.starters || []);
    setPracticeQuestion(nextTopic.questions?.[0] || nextTopic.prompt);
    setMessages([{
      role: 'assistant',
      reply: `Great choice. Let’s practise ${nextTopic.label.toLowerCase()}. ${nextTopic.prompt}`,
      correction: null,
    }]);
    setMobileMenuOpen(false);
  };

  const addCustomTopic = (label) => {
    const cleanLabel = label.trim().replace(/\s+/g, ' ');
    if (cleanLabel.length < 3) return;

    const existing = topics.find((topic) => topic.label.toLowerCase() === cleanLabel.toLowerCase());
    if (existing) {
      startTopic(existing.id);
      return;
    }

    const customTopic = createCustomTopic(cleanLabel);
    const customTopics = [...readCustomTopics(), customTopic];
    localStorage.setItem(CUSTOM_TOPICS_KEY, JSON.stringify(customTopics));
    setTopics((current) => [...current, customTopic]);
    startTopic(customTopic);
  };

  const startNewChat = () => {
    setSessionId(null);
    setInteractionId(null);
    setCurrentMetrics(null);
    setMessage('');
    setGrammarIssues([]);
    setGrammarSuggestion(null);
    setMessages([WELCOME_MESSAGE]);
    setMobileMenuOpen(false);
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
              replyMeaning: item.replyMeaning,
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
    startListening: async () => {
      speechBaseRef.current = message.trimEnd();
      await speech.startListening();
    },
    speakText,
  };

  const resetLocalProgress = () => {
    localStorage.removeItem(LOCAL_DASHBOARD_KEY);
    setCurrentMetrics(null);
    setDashboard({ ...EMPTY_DASHBOARD, databaseConnected: dashboard.databaseConnected });
    loadDashboard();
  };

  return (
    <div className="app-shell">
      <div className="ambient-green ambient-green-one" />
      <div className="ambient-green ambient-green-two" />

      <main className="app-frame" id="top">
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
            autoSpeak={autoSpeak}
            speech={speechControls}
            onLevelChange={setLevel}
            onTopicChange={startTopic}
            onAddTopic={addCustomTopic}
            onOpenSession={openSession}
            onNewChat={startNewChat}
            onToggleSpeak={() => setAutoSpeak((value) => !value)}
            onResetProgress={resetLocalProgress}
          />
        </div>

        {mobileMenuOpen && (
          <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />
        )}

        <section className="workspace-shell">
          <header className="workspace-topbar">
            <div className="workspace-title-group">
              <button className="mobile-menu-button" type="button" onClick={() => setMobileMenuOpen((value) => !value)}>
                {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
              <div>
                <span>English learning workspace</span>
                <h1>{selectedTopic.label}</h1>
              </div>
              <span className="level-badge">{level}</span>
            </div>

            <div className="workspace-header-actions">
              <span className={`cloud-pill ${dashboard.databaseConnected ? 'connected' : ''}`}>
                {dashboard.databaseConnected ? <ShieldCheck size={15} /> : <CloudOff size={15} />}
                {dashboard.databaseConnected ? 'Cloud saved' : 'Local mode'}
              </span>
              <button type="button" className={`header-voice ${autoSpeak ? 'active' : ''}`} onClick={() => setAutoSpeak((value) => !value)}>
                <Volume2 size={16} />
              </button>
              {user ? (
                <div className="user-menu">
                  <span><CircleUserRound size={17} /> {user.name}</span>
                  <button type="button" onClick={logout} aria-label="Log out"><LogOut size={17} /></button>
                </div>
              ) : (
                <button type="button" className="sync-button" onClick={() => setAuthOpen(true)}>Sync progress</button>
              )}
            </div>
          </header>

          <Workspace
            topic={selectedTopic}
            topicId={topicId}
            topics={topics}
            level={level}
            messages={messages}
            loading={loading}
            message={message}
            wordSuggestions={wordSuggestions}
            grammarIssues={grammarIssues}
            grammarSuggestion={grammarSuggestion}
            sentenceSuggestions={sentenceSuggestions}
            practiceQuestion={practiceQuestion}
            practiceLoading={practiceLoading}
            autoSpeak={autoSpeak}
            speech={speechControls}
            dashboard={dashboard}
            currentMetrics={currentMetrics}
            onMessageChange={handleMessageChange}
            onSend={sendMessage}
            onWordSuggestion={handleWordSuggestion}
            onApplyGrammar={applyGrammarSuggestion}
            onSentenceSuggestion={handleSentenceSuggestion}
            onQuestionChange={setPracticeQuestion}
            onToggleSpeak={() => setAutoSpeak((value) => !value)}
            onTopicChange={startTopic}
            onAddTopic={addCustomTopic}
            onLevelChange={setLevel}
            onStartRecommended={startTopic}
            endRef={endRef}
          />
        </section>
      </main>

      {authOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}>
          <div className="auth-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setAuthOpen(false)}><X size={20} /></button>
            <span className="brand-mark large"><Sparkles size={24} /></span>
            <span className="mini-label">Your learning account</span>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your profile'}</h2>
            <p>Sync conversations, scores, streaks and weekly progress across devices.</p>
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
