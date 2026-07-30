import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  Languages,
  MessageSquare,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import ChatPanel from './ChatPanel';
import DashboardPanel from './DashboardPanel';
import DictionaryPanel from './DictionaryPanel';

const TABS = [
  { id: 'chat', label: 'Conversation', icon: MessageSquare },
  { id: 'topics', label: 'Practice topics', icon: Languages },
  { id: 'dictionary', label: 'Dictionary', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
];

function TopicsView({
  topics,
  selectedTopicId,
  level,
  onTopicChange,
  onAddTopic,
  onLevelChange,
  onOpenChat,
}) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const [query, setQuery] = useState('');
  const normalisedQuery = query.trim().toLowerCase();
  const queryTerms = normalisedQuery.split(/\s+/).filter(Boolean);
  const filteredTopics = topics.filter((topic) => {
    const searchableText = `${topic.label} ${topic.description}`.toLowerCase();
    return !queryTerms.length || queryTerms.every((term) => searchableText.includes(term));
  });
  const canCreateTopic = normalisedQuery.length >= 3 && filteredTopics.length === 0;

  return (
    <div className="topics-view view-enter">
      <div className="view-heading">
        <div>
          <span className="section-kicker">Practice library</span>
          <h2>Choose a real-life situation</h2>
          <p>Pick a topic and SpeakFlow will adapt its questions, vocabulary and corrections to your level.</p>
        </div>
        <div className="level-pills" aria-label="Select English level">
          {levels.map((item) => (
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
      </div>

      <form
        className="topic-library-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canCreateTopic) return;
          onAddTopic(query);
          onOpenChat();
        }}
      >
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a situation, e.g. project discussion with client"
          aria-label="Search or create a practice topic"
        />
        {canCreateTopic && (
          <button
            type="submit"
          >
            <Plus size={16} />
            Generate practice
          </button>
        )}
      </form>

      <div className="topic-browser-grid">
        {filteredTopics.map((topic, index) => (
          <button
            type="button"
            key={topic.id}
            className={`topic-browser-card ${selectedTopicId === topic.id ? 'active' : ''}`}
            onClick={() => {
              onTopicChange(topic.id);
              onOpenChat();
            }}
          >
            <span className="topic-index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{topic.label}</strong>
              <p>{topic.description}</p>
            </div>
            <span className="topic-card-action">Start</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Workspace({
  topic,
  topicId,
  topics,
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
  dashboard,
  currentMetrics,
  user,
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
  onTopicChange,
  onAddTopic,
  onLevelChange,
  onStartRecommended,
  onRequireAuth,
  endRef,
}) {
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    if (messages.some((item) => item.role === 'user')) setActiveTab('chat');
  }, [messages]);

  return (
    <div className="workspace">
      <div className="workspace-toolbar">
        <nav className="workspace-tabs" aria-label="SpeakFlow sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="workspace-tools">
          <button type="button" aria-label="Bookmark lesson"><Bookmark size={17} /></button>
          <button type="button" aria-label="Share lesson"><Share2 size={17} /></button>
        </div>
      </div>

      <div className="workspace-content">
        {activeTab === 'chat' && (
          <ChatPanel
            topic={topic}
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
            speech={speech}
            realtimeStatus={realtimeStatus}
            liveChatStatus={liveChatStatus}
            streamingReply={streamingReply}
            onMessageChange={onMessageChange}
            onSend={onSend}
            onWordSuggestion={onWordSuggestion}
            onApplyGrammar={onApplyGrammar}
            onSentenceSuggestion={onSentenceSuggestion}
            onQuestionChange={onQuestionChange}
            onToggleSpeak={onToggleSpeak}
            onOpenTopics={() => setActiveTab('topics')}
            onOpenProgress={() => setActiveTab('progress')}
            endRef={endRef}
          />
        )}

        {activeTab === 'topics' && (
          <TopicsView
            topics={topics}
            selectedTopicId={topicId}
            level={level}
            onTopicChange={onTopicChange}
            onAddTopic={onAddTopic}
            onLevelChange={onLevelChange}
            onOpenChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'progress' && (
          <div className="progress-view view-enter">
            <DashboardPanel
              dashboard={dashboard}
              currentMetrics={currentMetrics}
              onStartRecommended={(recommended) => {
                onStartRecommended(recommended);
                setActiveTab('chat');
              }}
            />
          </div>
        )}

        {activeTab === 'dictionary' && (
          <DictionaryPanel
            user={user}
            realtimeStatus={realtimeStatus}
            onRequireAuth={onRequireAuth}
          />
        )}
      </div>
    </div>
  );
}
