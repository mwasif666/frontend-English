import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Info,
  Lightbulb,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  TriangleAlert,
  Volume2,
} from 'lucide-react';
import ScoreRing from './ScoreRing';

export const buildVoiceNotice = (speech) => {
  if (speech.error) {
    return {
      tone: 'warning',
      text: speech.error,
      canRetry: speech.supported && speech.permission !== 'granted',
    };
  }
  if (!speech.supported) {
    return { tone: 'info', text: speech.unsupportedReason, canRetry: false };
  }
  if (speech.permission === 'denied') {
    return {
      tone: 'warning',
      text: 'The microphone is blocked for this site. Allow it to practise by speaking.',
      canRetry: true,
    };
  }
  return null;
};

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

        {message.replyMeaning && (
          <div className="reply-meaning">
            <span>Simple Roman Urdu</span>
            <p>{message.replyMeaning}</p>
            {message.replyUrdu && <p className="urdu-script" dir="rtl" lang="ur">{message.replyUrdu}</p>}
          </div>
        )}

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
            {message.correction.explanationUrdu && (
              <p className="urdu-script" dir="rtl" lang="ur">{message.correction.explanationUrdu}</p>
            )}
          </div>
        )}

        {message.meaning && (
          <div className="meaning-card">
            <span>Simple Roman Urdu meaning</span>
            <p>{message.meaning}</p>
            {message.meaningUrdu && <p className="urdu-script" dir="rtl" lang="ur">{message.meaningUrdu}</p>}
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
  practiceLoading,
  onQuestionChange,
  onSentenceSuggestion,
  onOpenTopics,
  onOpenProgress,
}) {
  const starters = (sentenceSuggestions || topic.starters || []).slice(0, 3);
  const questions = (topic.questions?.length ? topic.questions : [topic.prompt]).filter(Boolean).slice(0, 4);
  const selectedQuestion = activeQuestion || questions[0];
  const questionIndex = Math.max(0, questions.indexOf(selectedQuestion));
  const selectedMeaning = topic.questionMeanings?.[questionIndex];
  const selectedUrduMeaning = topic.questionUrduMeanings?.[questionIndex];

  return (
    <div className="chat-welcome view-enter">
      <div className="welcome-ai-mark"><Sparkles size={24} /></div>
      <span className="welcome-status"><i /> English coach online</span>
      <h1>Let&apos;s practise {topic.label.toLowerCase()}</h1>
      <p>{topic.description} Choose a question, answer naturally, and get instant corrections.</p>

      <div className="practice-question-panel">
        <div className="practice-question-heading">
          <span>Recommended questions</span>
          <small>{practiceLoading ? 'Finding fresh prompts…' : `${questions.length} fresh prompts`}</small>
        </div>
        <strong>{selectedQuestion}</strong>
        {selectedMeaning && <p className="question-meaning">{selectedMeaning}</p>}
        {selectedUrduMeaning && <p className="question-meaning urdu-script" dir="rtl" lang="ur">{selectedUrduMeaning}</p>}
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
  grammarIssues,
  grammarSuggestion,
  sentenceSuggestions,
  practiceQuestion,
  practiceLoading,
  autoSpeak,
  speech,
  realtimeStatus,
  liveChatStatus,
  streamingReply,
  onMessageChange,
  onSend,
  onWordSuggestion,
  onApplyGrammar,
  onSentenceSuggestion,
  onQuestionChange,
  onToggleSpeak,
  onOpenTopics,
  onOpenProgress,
  endRef,
}) {
  const hasConversation = messages.some((item) => item.role === 'user');
  const composerRef = useRef(null);
  const textLayerRef = useRef(null);
  const voiceNotice = buildVoiceNotice(speech);
  const questionIndex = Math.max(0, (topic.questions || []).indexOf(practiceQuestion));
  const practiceQuestionMeaning = topic.questionMeanings?.[questionIndex];
  const practiceQuestionUrduMeaning = topic.questionUrduMeanings?.[questionIndex];
  const inlineSuggestion = useMemo(() => {
    if (!message || /\s$/.test(message) || !wordSuggestions.length) return null;
    const currentWord = message.trimEnd().split(/\s+/).at(-1) || '';
    const suggestion = wordSuggestions.find((item) => (
      item.toLowerCase().startsWith(currentWord.toLowerCase())
      && item.toLowerCase() !== currentWord.toLowerCase()
    ));
    return suggestion ? { suggestion, suffix: suggestion.slice(currentWord.length) } : null;
  }, [message, wordSuggestions]);

  const highlightedMessage = useMemo(() => {
    if (!message) return null;
    const issues = [...(grammarIssues || [])]
      .filter((issue) => Number.isFinite(issue.start) && Number.isFinite(issue.end))
      .sort((first, second) => first.start - second.start);
    const parts = [];
    let cursor = 0;
    issues.forEach((issue, index) => {
      const start = Math.max(cursor, Math.min(message.length, issue.start));
      const end = Math.max(start, Math.min(message.length, issue.end));
      if (start > cursor) parts.push(message.slice(cursor, start));
      if (end > start) {
        parts.push(<mark key={`${start}-${end}-${index}`} title={issue.message}>{message.slice(start, end)}</mark>);
      }
      cursor = end;
    });
    if (cursor < message.length) parts.push(message.slice(cursor));
    return parts;
  }, [grammarIssues, message]);

  useLayoutEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 22;
    const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const maxHeight = (lineHeight * 4) + verticalPadding;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [message]);
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
            practiceLoading={practiceLoading}
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
            <div className={`bubble assistant-bubble typing-bubble ${streamingReply ? 'streaming' : ''}`}>
              {streamingReply ? <p>{streamingReply}</p> : <><span /><span /><span /></>}
              <small>{liveChatStatus || 'Analysing your English…'}</small>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="composer-zone">
        {voiceNotice && (
          <div className={`composer-alert ${voiceNotice.tone}`} role="status">
            {voiceNotice.tone === 'warning' ? <TriangleAlert size={15} /> : <Info size={15} />}
            <p>{voiceNotice.text}</p>
            {voiceNotice.canRetry && (
              <button type="button" onClick={speech.requestMicrophone} disabled={speech.requestingPermission}>
                {speech.requestingPermission ? 'Asking…' : 'Allow microphone'}
              </button>
            )}
          </div>
        )}

        {practiceQuestion && !hasConversation && (
          <div className="composer-question">
            <span>Answering</span>
            <div>
              <strong>{practiceQuestion}</strong>
              {practiceQuestionMeaning && <small>{practiceQuestionMeaning}</small>}
              {practiceQuestionUrduMeaning && <small className="urdu-script" dir="rtl" lang="ur">{practiceQuestionUrduMeaning}</small>}
            </div>
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

        {grammarSuggestion && (
          <div className="grammar-suggestion" role="status">
            <div>
              <span>Grammar suggestion</span>
              <strong>{grammarSuggestion.corrected}</strong>
              {grammarSuggestion.explanation && <small>{grammarSuggestion.explanation}</small>}
            </div>
            <button type="button" onClick={onApplyGrammar}>Apply</button>
          </div>
        )}

        <div className={`composer ${speech.isListening ? 'listening' : ''}`}>
          <span className="composer-brand"><Sparkles size={18} /></span>

          <div className="composer-input">
            <div
              ref={textLayerRef}
              className="composer-text-layer"
              aria-hidden="true"
            >
              {highlightedMessage}
              {inlineSuggestion && <span className="inline-completion">{inlineSuggestion.suffix}</span>}
            </div>
            <textarea
              ref={composerRef}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              onScroll={(event) => {
                if (!textLayerRef.current) return;
                textLayerRef.current.scrollTop = event.currentTarget.scrollTop;
                textLayerRef.current.scrollLeft = event.currentTarget.scrollLeft;
              }}
              onKeyDown={(event) => {
                if (event.key === 'Tab' && inlineSuggestion) {
                  event.preventDefault();
                  onWordSuggestion(inlineSuggestion.suggestion);
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={speech.isListening ? 'Listening... speak naturally' : 'Type or speak your answer...'}
              rows="1"
              spellCheck="true"
              autoCorrect="on"
              autoCapitalize="sentences"
            />
            <VoiceBars active={speech.isListening} />
          </div>

          <button
            className="mic-button"
            type="button"
            onClick={speech.isListening ? speech.stopListening : speech.startListening}
            disabled={!speech.supported}
            title={speech.supported ? 'Speak your answer' : speech.unsupportedReason}
            aria-label={speech.isListening ? 'Stop listening' : 'Start speaking'}
          >
            {speech.isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <button className="send-button" type="button" onClick={onSend} disabled={!message.trim() || loading} aria-label="Send message">
            {loading ? <LoaderCircle className="spin" size={19} /> : <Send size={19} />}
          </button>
        </div>
        <p className="composer-hint">
          Enter to send · Shift + Enter for a new line · suggestions update while you type ·
          {' '}{realtimeStatus === 'ready' ? 'Realtime connected' : 'HTTP fallback active'}
        </p>
      </footer>
    </section>
  );
}
