import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  Check,
  Languages,
  MessageSquare,
  Share2,
} from 'lucide-react';
import ChatPanel from './ChatPanel';
import DashboardPanel from './DashboardPanel';

const TABS = [
  { id: 'chat', label: 'Conversation', icon: MessageSquare },
  { id: 'topics', label: 'Practice topics', icon: Languages },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
];

function TopicsView({ topics, selectedTopicId, level, onTopicChange, onLevelChange, onOpenChat }) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

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

      <div className="topic-browser-grid">
        {topics.map((topic) => (
          <button
            type="button"
            key={topic.id}
            className={`topic-browser-card ${selectedTopicId === topic.id ? 'active' : ''}`}
            onClick={() => {
              onTopicChange(topic.id);
              onOpenChat();
            }}
          >
            <span className="topic-index">{String(topics.indexOf(topic) + 1).padStart(2, '0')}</span>
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
  sentenceSuggestions,
  autoSpeak,
  speech,
  dashboard,
  currentMetrics,
  onMessageChange,
  onSend,
  onWordSuggestion,
  onSentenceSuggestion,
  onToggleSpeak,
  onTopicChange,
  onLevelChange,
  onStartRecommended,
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
            sentenceSuggestions={sentenceSuggestions}
            autoSpeak={autoSpeak}
            speech={speech}
            onMessageChange={onMessageChange}
            onSend={onSend}
            onWordSuggestion={onWordSuggestion}
            onSentenceSuggestion={onSentenceSuggestion}
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
      </div>
    </div>
  );
}
