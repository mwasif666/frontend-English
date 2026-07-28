import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleUserRound,
  Headphones,
  Languages,
  LoaderCircle,
  LogOut,
  Mic,
  MicOff,
  Plane,
  Send,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { authApi, tutorApi } from './services/api';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const TOPICS = [
  { id: 'daily', label: 'Daily conversation', icon: Languages, description: 'Everyday situations and natural phrases' },
  { id: 'interview', label: 'Job interview', icon: BriefcaseBusiness, description: 'Confident professional answers' },
  { id: 'travel', label: 'Travel English', icon: Plane, description: 'Airport, hotel, and directions' },
  { id: 'pronunciation', label: 'Pronunciation', icon: Headphones, description: 'Clear sentences and repeat practice' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const WELCOME = {
  role: 'assistant',
  reply: "Hi! I’m your English speaking coach. Choose a topic, then type or speak your answer. I’ll correct it gently and keep the conversation moving.",
  correction: null,
};

const speakText = (text) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;
  window.speechSynthesis.speak(utterance);
};

function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [topic, setTopic] = useState('daily');
  const [sessionId, setSessionId] = useState(null);
  const [interactionId, setInteractionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const endRef = useRef(null);

  const onSpeechResult = useCallback((transcript) => {
    setMessage(transcript);
  }, []);

  const speech = useSpeechRecognition({ onResult: onSpeechResult });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const restoreUser = async () => {
      if (!localStorage.getItem('speakflow_token')) return;
      try {
        const data = await authApi.me();
        setUser(data.user);
        const progressData = await tutorApi.getProgress();
        setProgress(progressData.progress);
      } catch {
        localStorage.removeItem('speakflow_token');
      }
    };
    restoreUser();
  }, []);

  const selectedTopic = useMemo(
    () => TOPICS.find((item) => item.id === topic) || TOPICS[0],
    [topic],
  );

  const sendMessage = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    setMessages((current) => [...current, { role: 'user', text: cleanMessage }]);
    setMessage('');
    setLoading(true);

    try {
      const data = await tutorApi.respond({
        message: cleanMessage,
        level,
        topic,
        sessionId,
        interactionId,
      });
      const tutorMessage = {
        role: 'assistant',
        reply: data.reply,
        correction: data.correction,
        meaning: data.meaning,
        vocabulary: data.vocabulary,
        encouragement: data.encouragement,
      };
      setMessages((current) => [...current, tutorMessage]);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.interactionId) setInteractionId(data.interactionId);
      if (autoSpeak) {
        const spokenFeedback = data.correction
          ? `${data.reply} You said: ${data.correction.original}. A better way to say it is: ${data.correction.corrected}.`
          : data.reply;
        speakText(spokenFeedback);
      }
      if (user && data.progress) setProgress(data.progress);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        reply: error.message,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startTopic = (newTopic) => {
    setTopic(newTopic);
    setSessionId(null);
    setInteractionId(null);
    const item = TOPICS.find((entry) => entry.id === newTopic);
    setMessages([{
      role: 'assistant',
      reply: `Great choice. Let’s practise ${item.label.toLowerCase()}. ${getTopicStarter(newTopic, level)}`,
      correction: null,
    }]);
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
      setSessionId(null);
      setInteractionId(null);
      setAuthOpen(false);
      setAuthForm({ name: '', email: '', password: '' });
      const progressData = await tutorApi.getProgress();
      setProgress(progressData.progress);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('speakflow_token');
    setUser(null);
    setProgress(null);
    setSessionId(null);
    setInteractionId(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SpeakFlow home">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span>SpeakFlow</span>
        </a>
        <div className="header-actions">
          <button className={`sound-toggle ${autoSpeak ? 'active' : ''}`} onClick={() => setAutoSpeak((value) => !value)}>
            <Volume2 size={17} />
            <span>Voice replies</span>
          </button>
          {user ? (
            <div className="user-menu">
              <span><CircleUserRound size={18} /> {user.name}</span>
              <button className="icon-button" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
            </div>
          ) : (
            <button className="secondary-button" onClick={() => setAuthOpen(true)}>Save progress</button>
          )}
        </div>
      </header>

      <main className="layout" id="top">
        <aside className="sidebar">
          <section className="welcome-card">
            <span className="eyebrow">Your daily English coach</span>
            <h1>Speak more.<br />Fear less.</h1>
            <p>Practise real conversations and receive simple, useful corrections instantly.</p>
          </section>

          <section className="control-card">
            <div className="section-heading">
              <div>
                <span className="label">Difficulty</span>
                <h2>Choose your level</h2>
              </div>
              <ChevronDown size={18} />
            </div>
            <div className="level-tabs">
              {LEVELS.map((item) => (
                <button
                  key={item}
                  className={level === item ? 'selected' : ''}
                  onClick={() => setLevel(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="topics-section">
            <span className="label">Practice mode</span>
            <div className="topic-list">
              {TOPICS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`topic-card ${topic === item.id ? 'selected' : ''}`}
                    onClick={() => startTopic(item.id)}
                  >
                    <span className="topic-icon"><Icon size={20} /></span>
                    <span className="topic-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="progress-card">
            <div className="progress-title">
              <span className="topic-icon"><BarChart3 size={19} /></span>
              <div><strong>Your progress</strong><small>{user ? 'Synced to your account' : 'Sign in to save it'}</small></div>
            </div>
            <div className="stat-grid">
              <div><strong>{progress?.messagesPractised || 0}</strong><span>Answers</span></div>
              <div><strong>{progress?.correctionsReceived || 0}</strong><span>Corrections</span></div>
            </div>
          </section>
        </aside>

        <section className="chat-panel">
          <div className="chat-header">
            <div className="coach-avatar"><BookOpen size={25} /></div>
            <div>
              <div className="online-line"><span className="online-dot" /> Free tutor online</div>
              <h2>{selectedTopic.label}</h2>
              <p>{level} lesson · browser voice enabled</p>
            </div>
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((item, index) => (
              <MessageBubble key={`${item.role}-${index}`} message={item} onSpeak={speakText} />
            ))}
            {loading && (
              <div className="message-row assistant-row">
                <div className="mini-avatar"><Sparkles size={16} /></div>
                <div className="bubble assistant-bubble typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="composer-wrap">
            {speech.error && <div className="speech-notice">{speech.error}</div>}
            {!speech.supported && <div className="speech-notice">Voice recognition is unavailable in this browser. You can still type your answers.</div>}
            <div className={`composer ${speech.isListening ? 'listening' : ''}`}>
              <button
                className="mic-button"
                onClick={speech.isListening ? speech.stopListening : speech.startListening}
                disabled={!speech.supported}
                aria-label={speech.isListening ? 'Stop listening' : 'Start speaking'}
              >
                {speech.isListening ? <MicOff size={23} /> : <Mic size={23} />}
              </button>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={speech.isListening ? 'Listening… speak clearly' : 'Type your answer or use the microphone…'}
                rows="1"
              />
              <button className="send-button" onClick={sendMessage} disabled={!message.trim() || loading} aria-label="Send message">
                {loading ? <LoaderCircle className="spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
            <p className="composer-hint">Press Enter to send · Your microphone audio is handled by your browser</p>
          </div>
        </section>
      </main>

      {authOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}>
          <div className="auth-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthOpen(false)}><X size={20} /></button>
            <span className="brand-mark large"><Sparkles size={24} /></span>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>Save your practice count and correction history across devices.</p>
            <form onSubmit={submitAuth}>
              {authMode === 'register' && (
                <label>Full name<input required value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>
              )}
              <label>Email address<input type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
              <label>Password<input type="password" minLength="6" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
              {authError && <div className="auth-error">{authError}</div>}
              <button className="primary-button" disabled={authLoading}>
                {authLoading ? <LoaderCircle className="spin" size={18} /> : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            <button className="switch-auth" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, onSpeak }) {
  if (message.role === 'user') {
    return <div className="message-row user-row"><div className="bubble user-bubble">{message.text}</div></div>;
  }

  return (
    <div className="message-row assistant-row">
      <div className="mini-avatar"><Sparkles size={16} /></div>
      <div className={`bubble assistant-bubble ${message.isError ? 'error-bubble' : ''}`}>
        <div className="reply-line">
          <p>{message.reply}</p>
          {!message.isError && <button className="speak-button" onClick={() => onSpeak(message.reply)} aria-label="Speak tutor reply"><Volume2 size={16} /></button>}
        </div>
        {message.correction && (
          <div className="feedback-card">
            <div className="feedback-title"><Check size={16} /> A clearer sentence</div>
            <strong>“{message.correction.corrected}”</strong>
            <p>{message.correction.explanation}</p>
          </div>
        )}
        {message.meaning && (
          <div className="meaning-card">
            <span>Roman Urdu meaning</span>
            <p>{message.meaning}</p>
          </div>
        )}
        {message.vocabulary && (
          <div className="vocab-line"><span>Try this phrase</span><strong>{message.vocabulary}</strong></div>
        )}
        {message.encouragement && <small className="encouragement">{message.encouragement}</small>}
      </div>
    </div>
  );
}

function getTopicStarter(topic, level) {
  const prompts = {
    daily: 'Tell me what you usually do in the morning.',
    interview: 'Please introduce yourself as if this were a job interview.',
    travel: 'Imagine you have just arrived at a hotel. What would you say at reception?',
    pronunciation: 'Say this sentence clearly: “I would like to improve my spoken English.”',
  };
  return `${prompts[topic]} I’ll respond at ${level.toLowerCase()} level.`;
}

export default App;