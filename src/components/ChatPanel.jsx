import {
  CheckCircle2,
  Lightbulb,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import ScoreRing from './ScoreRing';

function VoiceBars({ active }) {
  return (
    <div className={`voice-bars ${active ? 'active' : ''}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}

function MessageBubble({ message, onSpeak }) {
  if (message.role === 'user') {
    return (
      <div className="message-row user-row message-enter">
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
      <div className="assistant-avatar"><Sparkles size={16} /></div>
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
            <ScoreRing score={message.metrics.overall} size={78} label="score" compact />
            <div>
              <span className="mini-label">Answer analysis</span>
              <strong>Your strongest area: {message.metrics.strength}</strong>
              <small>Next focus: {message.metrics.focus}</small>
            </div>
          </div>
        ) : null}

        {message.correction && (
          <div className="correction-card">
            <div className="correction-heading"><CheckCircle2 size={17} /> Say it more naturally</div>
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

export default function ChatPanel({
  topic,
  level,
  messages,
  loading,
  message,
  wordSuggestions,
  sentenceSuggestions,
  autoSpeak,
  speech,
  onMessageChange,
  onSend,
  onWordSuggestion,
  onSentenceSuggestion,
  onToggleSpeak,
  endRef,
}) {
  return (
    <section className="chat-studio">
      <header className="chat-studio-header">
        <div className="coach-identity">
          <div className="coach-orb">
            <span className="coach-orb-core"><Sparkles size={22} /></span>
            <i className="coach-orbit orbit-one" />
            <i className="coach-orbit orbit-two" />
          </div>
          <div>
            <span className="online-status"><i /> Nova is ready</span>
            <h2>{topic.label}</h2>
            <p>{level} coaching · live corrections · progress tracking</p>
          </div>
        </div>
        <button type="button" className={`voice-toggle ${autoSpeak ? 'active' : ''}`} onClick={onToggleSpeak}>
          <Volume2 size={17} />
          <span>{autoSpeak ? 'Voice on' : 'Voice off'}</span>
        </button>
      </header>

      <div className="prompt-ribbon">
        <span><WandSparkles size={15} /> Try saying</span>
        <div>
          {(sentenceSuggestions || topic.starters || []).slice(0, 3).map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => onSentenceSuggestion(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="messages" aria-live="polite">
        {messages.map((item, index) => (
          <MessageBubble key={`${item.role}-${index}-${item.text || item.reply}`} message={item} onSpeak={speech.speakText} />
        ))}
        {loading && (
          <div className="message-row assistant-row message-enter">
            <div className="assistant-avatar"><Sparkles size={16} /></div>
            <div className="bubble assistant-bubble typing-bubble">
              <span /><span /><span />
              <small>Nova is analysing your English…</small>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="composer-zone">
        {speech.error && <div className="composer-alert">{speech.error}</div>}
        {!speech.supported && <div className="composer-alert">Voice recognition is unavailable here. You can still type.</div>}

        {wordSuggestions.length > 0 && (
          <div className="word-suggestion-bar" aria-label="Word suggestions">
            <span>Suggestions</span>
            {wordSuggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => onWordSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className={`composer ${speech.isListening ? 'listening' : ''}`}>
          <button
            className="mic-button"
            type="button"
            onClick={speech.isListening ? speech.stopListening : speech.startListening}
            disabled={!speech.supported}
            aria-label={speech.isListening ? 'Stop listening' : 'Start speaking'}
          >
            {speech.isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <div className="composer-input">
            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={speech.isListening ? 'Listening… speak naturally' : 'Speak or type your answer…'}
              rows="1"
            />
            <VoiceBars active={speech.isListening} />
          </div>

          <button className="send-button" type="button" onClick={onSend} disabled={!message.trim() || loading} aria-label="Send message">
            {loading ? <LoaderCircle className="spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="composer-hint">Enter to send · Shift + Enter for a new line · suggestions update as you type</p>
      </footer>
    </section>
  );
}
