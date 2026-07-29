export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const DEFAULT_TOPICS = [
  {
    id: 'daily',
    label: 'Daily conversation',
    description: 'Routines, family, and everyday confidence.',
    prompt: 'Tell me what made your day interesting.',
    accent: 'violet',
    starters: ['Usually, I start my day by…', 'One thing I really enjoy is…', 'The best part of my day was…'],
  },
  {
    id: 'interview',
    label: 'Job interview',
    description: 'Strengths, experience, and confident answers.',
    prompt: 'Introduce yourself for a job you would really like.',
    accent: 'blue',
    starters: ['A good example of this is…', 'The result of my work was…', 'I learned how to…'],
  },
  {
    id: 'business',
    label: 'Business English',
    description: 'Meetings, updates, clients, and teamwork.',
    prompt: 'Give a short update about a project you are working on.',
    accent: 'indigo',
    starters: ['The main priority today is…', 'We are currently on track to…', 'The next step is to…'],
  },
  {
    id: 'presentation',
    label: 'Presentation skills',
    description: 'Open strongly and explain ideas clearly.',
    prompt: 'Open a presentation about a product you know well.',
    accent: 'orange',
    starters: ['Let me begin with the main idea…', 'This is important because…', 'To summarise the key point…'],
  },
  {
    id: 'travel',
    label: 'Travel English',
    description: 'Airports, hotels, food, and directions.',
    prompt: 'Ask a hotel receptionist for an early check-in.',
    accent: 'cyan',
    starters: ['Could you please help me with…?', 'I have a reservation under the name…', 'Is there any possibility of…?'],
  },
  {
    id: 'phone',
    label: 'Phone calls',
    description: 'Appointments, clarification, and follow-ups.',
    prompt: 'Call a company and ask for the sales manager.',
    accent: 'green',
    starters: ['I am calling regarding…', 'Could you repeat that, please?', 'May I leave a message?'],
  },
  {
    id: 'shopping',
    label: 'Shopping & services',
    description: 'Products, prices, returns, and recommendations.',
    prompt: 'Ask if a product is available in another size.',
    accent: 'pink',
    starters: ['Do you have this in another size?', 'Could you recommend something similar?', 'What is your return policy?'],
  },
  {
    id: 'pronunciation',
    label: 'Pronunciation',
    description: 'Clarity, rhythm, stress, and repeat practice.',
    prompt: 'Say: Clear communication becomes easier with regular practice.',
    accent: 'purple',
    starters: ['Let me say that again more clearly.', 'I will speak slowly and clearly.', 'Could you repeat the sentence?'],
  },
];

export const EMPTY_DASHBOARD = {
  todayScore: 0,
  improvement: 0,
  metrics: {
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    pronunciation: null,
  },
  totals: {
    sessions: 0,
    answers: 0,
    words: 0,
    corrections: 0,
    streak: 0,
  },
  weekly: [
    { label: 'Mon', score: 0, answers: 0, words: 0 },
    { label: 'Tue', score: 0, answers: 0, words: 0 },
    { label: 'Wed', score: 0, answers: 0, words: 0 },
    { label: 'Thu', score: 0, answers: 0, words: 0 },
    { label: 'Fri', score: 0, answers: 0, words: 0 },
    { label: 'Sat', score: 0, answers: 0, words: 0 },
    { label: 'Sun', score: 0, answers: 0, words: 0 },
  ],
  topics: [],
  recentMistakes: [],
  recommendedTopic: 'daily',
  databaseConnected: false,
};

export const WELCOME_MESSAGE = {
  role: 'assistant',
  reply: 'Hi! I’m Nova, your English speaking coach. Choose a topic or start talking. I’ll correct you gently, score your answer, and track your progress.',
  correction: null,
};
