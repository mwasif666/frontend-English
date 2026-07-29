import { useRef } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import ScoreRing from './ScoreRing';

function VoiceBars({ active }) {
  return (
    <div className={`voice-bars ${active ? 'active' : ''}`} aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
    </div>
  );
}

function MessageBubble({ message, onSpeak }) {
  if (message.role === 'user') {
    return (
      <div className="message-row user-row message-enter">
        <div className="message-author user-author"><span>You</span></div>
        <div className="user-message-wrap">
          <div className="bubble user-bubble">{message.text}</div>
          {message.metrics?.overall ? (
            <span className="message-score">{Math.round(message.metrics.overall)}% answer score</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="message-row assistant-row message-enter">
      <div className="message-author assistant-author">
        <span className="assistant-avatar"><Sparkles size={15} /></span>
        <span>SpeakFlow</span>
      </div>
      <div className={`bubble assistant-bubble ${message.isError ? 'error-bubble' : ''}`}>
        <div className="assistant-reply">
          <p>{message.reply}</p>
          {!message.isError && (
            <button type="button" onClick={() => onSpeak(message.reply)} aria-label="Read reply aloud">
              <Volume2 size={16} />
            </button>
          )}
        </div>

        {message.metrics?.overall ? (
          <div className="inline-score-card">
            <ScoreRing score={message.metrics.overall} size={76} label="score" compact />
            <div>
              <span className="mini-label">Answer analysis</span>
              <strong>Strongest area: {message.metrics.strength}</strong>
              <small>Next focus: {message.metrics.focus}</small>
            </div>
          </div>
        ) : null}

        {message.correction && (
          <div className="correction-card">
            <div className="correction-heading"><CheckCircle2 size={16} /> A more natural sentence</div>
            <span className="original-sentence">You said: “{message.correction.original}”</span>
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
          <div className="vocabulary-tip">
            <Lightbulb size={16} />
            <span>Useful phrase</span>
            <strong>{message.vocabulary}</strong>
          </div>
        )}

        {message.encouragement && <small className="encouragement">{message.encouragement}</small>}
      </div>
    </div>
  );
}

function WelcomeState({
  topic,
  activeQuestion,
  sentenceSuggestions,
  onQuestionChange,
  onSentenceSuggestion,
  onOpenTopics,
  onOpenProgress,
}) {
  const starters = (sentenceSuggestions || topic.starters || []).slice(0, 3);
  const questions = (topic.questions?.length ? topic.questions : [topic.prompt]).filter(Boolean).slice(0, 4);
  const selectedQuestion = activeQuestion || questions[0];

  return (
    <div className="chat-welcome view-enter">
      <div className="welcome-ai-mark"><Sparkles size={24} /></div>
      <span className="welcome-status"><i /> English coach online</span>
      <h1>Let&apos;s practise {topic.label.toLowerCase()}</h1>
      <p>{topic.description} Choose a question, answer naturally, and get instant corrections.</p>

      <div className="practice-question-panel">
        <div className="practice-question-heading">
          <span>Recommended questions</span>
          <small>{questions.length} prompts</small>
        </div>
        <strong>{selectedQuestion}</strong>
        <div className="practice-question-options">
          {questions.map((question, index) => (
            <button
              type="button"
              key={question}
              className={selectedQuestion === question ? 'active' : ''}
              onClick={() => onQuestionChange(question)}
              title={question}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="welcome-starters">
        <span>Helpful answer starters</span>
        <div>
          {starters.map((starter) => (
            <button type="button" key={starter} onClick={() => onSentenceSuggestion(starter)}>{starter}</button>
          ))}
        </div>
      </div>

      <div className="welcome-shortcuts">
        <button type="button" onClick={onOpenTopics}><BookOpen size={14} /> Choose another topic</button>
        <button type="button" onClick={onOpenProgress}><BarChart3 size={14} /> Review progress</button>
      </div>
    </div>
  );
}

export default function ChatPanel({
  topic,
  level,
  messages,
  loading,
  message,
  wordSuggestions,
  sentenceSuggestions,
  practiceQuestion,
  autoSpeak,
  speech,
  onMessageChange,
  onSend,
  onWordSuggestion,
  onSentenceSuggestion,
  onQuestionChange,
  onToggleSpeak,
  onOpenTopics,
  onOpenProgress,
  endRef,
}) {
  const hasConversation = messages.some((item) => item.role === 'user');
  const composerRef = useRef(null);
  const selectQuestion = (question) => {
    onQuestionChange(question);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  };

  return (
    <section className="chat-studio">
      <div className="lesson-strip">
        <div>
          <span className="lesson-dot" />
          <strong>{topic.label}</strong>
          <small>{level} level</small>
        </div>
        <button type="button" className={`voice-toggle ${autoSpeak ? 'active' : ''}`} onClick={onToggleSpeak}>
          <Volume2 size={16} />
          <span>{autoSpeak ? 'Voice replies on' : 'Voice replies off'}</span>
        </button>
      </div>

      <div className={`messages ${hasConversation ? 'conversation-active' : 'empty-conversation'}`} aria-live="polite">
        {!hasConversation ? (
          <WelcomeState
            topic={topic}
            activeQuestion={practiceQuestion}
            sentenceSuggestions={sentenceSuggestions}
            onQuestionChange={selectQuestion}
            onSentenceSuggestion={onSentenceSuggestion}
            onOpenTopics={onOpenTopics}
            onOpenProgress={onOpenProgress}
          />
        ) : (
          messages.map((item, index) => (
            <MessageBubble key={`${item.role}-${index}-${item.text || item.reply}`} message={item} onSpeak={speech.speakText} />
          ))
        )}

        {loading && (
          <div className="message-row assistant-row message-enter">
            <div className="message-author assistant-author">
              <span className="assistant-avatar"><Sparkles size={15} /></span>
              <span>SpeakFlow</span>
            </div>
            <div className="bubble assistant-bubble typing-bubble">
              <span /><span /><span />
              <small>Analysing your English…</small>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="composer-zone">
        {speech.error && <div className="composer-alert">{speech.error}</div>}
        {!speech.supported && <div className="composer-alert">Voice recognition is unavailable here. You can still type.</div>}

        {practiceQuestion && !hasConversation && (
          <div className="composer-question">
            <span>Answering</span>
            <strong>{practiceQuestion}</strong>
          </div>
        )}

        {wordSuggestions.length > 0 && (
          <div className="word-suggestion-bar" aria-label="Word suggestions">
            <span>Suggested words</span>
            {wordSuggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => onWordSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className={`composer ${speech.isListening ? 'listening' : ''}`}>
          <span className="composer-brand"><Sparkles size={18} /></span>

          <div className="composer-input">
            <textarea
              ref={composerRef}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={speech.isListening ? 'Listening... speak naturally' : 'Type or speak your answer...'}
              rows="1"
            />
            <VoiceBars active={speech.isListening} />
          </div>

          <button
            className="mic-button"
            type="button"
            onClick={speech.isListening ? speech.stopListening : speech.startListening}
            disabled={!speech.supported}
            aria-label={speech.isListening ? 'Stop listening' : 'Start speaking'}
          >
            {speech.isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <button className="send-button" type="button" onClick={onSend} disabled={!message.trim() || loading} aria-label="Send message">
            {loading ? <LoaderCircle className="spin" size={19} /> : <Send size={19} />}
          </button>
        </div>
        <p className="composer-hint">Enter to send · Shift + Enter for a new line · suggestions update while you type</p>
      </footer>
    </section>
  );
}
