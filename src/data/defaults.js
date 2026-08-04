export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const BASE_TOPICS = [
  {
    id: 'daily',
    label: 'Daily conversation',
    description: 'Routines, family, and everyday confidence.',
    prompt: 'Tell me what made your day interesting.',
    questions: [
      'What do you usually do after you wake up?',
      'What was the best part of your day?',
      'How do you normally spend your weekend?',
      'Tell me about someone you enjoy talking to.',
    ],
    accent: 'violet',
    starters: ['Usually, I start my day by…', 'One thing I really enjoy is…', 'The best part of my day was…'],
  },
  {
    id: 'interview',
    label: 'Job interview',
    description: 'Strengths, experience, and confident answers.',
    prompt: 'Introduce yourself for a job you would really like.',
    questions: [
      'Can you introduce yourself professionally?',
      'Why are you interested in this role?',
      'What is one achievement you are proud of?',
      'How do you handle a difficult deadline?',
    ],
    accent: 'blue',
    starters: ['A good example of this is…', 'The result of my work was…', 'I learned how to…'],
  },
  {
    id: 'business',
    label: 'Business English',
    description: 'Meetings, updates, clients, and teamwork.',
    prompt: 'Give a short update about a project you are working on.',
    questions: [
      'How would you give a clear project update?',
      'How would you explain a delay to your team?',
      'What would you say when you disagree in a meeting?',
      'How would you ask a colleague for an urgent update?',
    ],
    accent: 'indigo',
    starters: ['The main priority today is…', 'We are currently on track to…', 'The next step is to…'],
  },
  {
    id: 'client-project',
    label: 'Client project discussion',
    description: 'Updates, requirements, timelines, feedback, and scope changes.',
    prompt: 'Give your client a concise update about the project.',
    questions: [
      'How would you update the client on current progress?',
      'How would you ask the client to clarify a requirement?',
      'How would you explain a delay without losing trust?',
      'How would you respond when the client requests extra work?',
    ],
    accent: 'green',
    starters: ['Here is a quick update on...', 'To make sure we are aligned...', 'The revised timeline is...'],
  },
  {
    id: 'presentation',
    label: 'Presentation skills',
    description: 'Open strongly and explain ideas clearly.',
    prompt: 'Open a presentation about a product you know well.',
    questions: [
      'How would you introduce your presentation?',
      'How would you explain the main benefit of your idea?',
      'How would you answer a difficult audience question?',
      'How would you close the presentation confidently?',
    ],
    accent: 'orange',
    starters: ['Let me begin with the main idea…', 'This is important because…', 'To summarise the key point…'],
  },
  {
    id: 'travel',
    label: 'Travel English',
    description: 'Airports, hotels, food, and directions.',
    prompt: 'Ask a hotel receptionist for an early check-in.',
    questions: [
      'How would you ask for an early hotel check-in?',
      'What would you say if your luggage was missing?',
      'How would you ask for directions politely?',
      'How would you order a meal and mention an allergy?',
    ],
    accent: 'cyan',
    starters: ['Could you please help me with…?', 'I have a reservation under the name…', 'Is there any possibility of…?'],
  },
  {
    id: 'phone',
    label: 'Phone calls',
    description: 'Appointments, clarification, and follow-ups.',
    prompt: 'Call a company and ask for the sales manager.',
    questions: [
      'How would you introduce yourself on a business call?',
      'How would you ask the speaker to repeat something?',
      'How would you leave a clear voicemail?',
      'How would you confirm the next meeting time?',
    ],
    accent: 'green',
    starters: ['I am calling regarding…', 'Could you repeat that, please?', 'May I leave a message?'],
  },
  {
    id: 'shopping',
    label: 'Shopping & services',
    description: 'Products, prices, returns, and recommendations.',
    prompt: 'Ask if a product is available in another size.',
    questions: [
      'How would you ask for another size or colour?',
      'How would you request a refund politely?',
      'How would you ask for a product recommendation?',
      'How would you explain a problem with your order?',
    ],
    accent: 'pink',
    starters: ['Do you have this in another size?', 'Could you recommend something similar?', 'What is your return policy?'],
  },
  {
    id: 'pronunciation',
    label: 'Pronunciation',
    description: 'Clarity, rhythm, stress, and repeat practice.',
    prompt: 'Say: Clear communication becomes easier with regular practice.',
    questions: [
      'Please say: Clear communication builds client confidence.',
      'Please say: I would like to clarify the project requirements.',
      'Please say: The revised timeline is realistic and achievable.',
      'Please say: Could you repeat that a little more slowly?',
    ],
    accent: 'purple',
    starters: ['Let me say that again more clearly.', 'I will speak slowly and clearly.', 'Could you repeat the sentence?'],
  },
];

const DEFAULT_MEANINGS = {
  daily: {
    roman: ['Aap subah uthne ke baad usually kya karte hain?', 'Aaj ke din ka sab se acha hissa kya tha?', 'Aap apna weekend usually kaise guzarte hain?', 'Kisi aise insaan ke bare mein batayein jis se baat karna aap ko pasand hai.'],
    urdu: ['آپ صبح اٹھنے کے بعد عام طور پر کیا کرتے ہیں؟', 'آج کے دن کا سب سے اچھا حصہ کیا تھا؟', 'آپ اپنا ہفتہ وار آرام کا وقت کیسے گزارتے ہیں؟', 'کسی ایسے شخص کے بارے میں بتائیں جس سے بات کرنا آپ کو پسند ہے۔'],
  },
  interview: {
    roman: ['Apna professional intro dein.', 'Aap ko is job mein interest kyun hai?', 'Apni ek success ke bare mein batayein jis par aap proud hain.', 'Aap mushkil deadline ko kaise handle karte hain?'],
    urdu: ['اپنا پیشہ ورانہ تعارف دیں۔', 'آپ کو اس نوکری میں دلچسپی کیوں ہے؟', 'اپنی ایک کامیابی کے بارے میں بتائیں جس پر آپ کو فخر ہے۔', 'آپ مشکل آخری تاریخ کو کیسے سنبھالتے ہیں؟'],
  },
  business: {
    roman: ['Aap project ki saaf update kaise dein ge?', 'Aap team ko delay ki wajah kaise batayein ge?', 'Meeting mein agree na hon to aap kya kahein ge?', 'Aap colleague se jaldi update kaise mangein ge?'],
    urdu: ['آپ منصوبے کی واضح تازہ معلومات کیسے دیں گے؟', 'آپ ٹیم کو تاخیر کی وجہ کیسے بتائیں گے؟', 'اجلاس میں اختلاف ہو تو آپ کیا کہیں گے؟', 'آپ ساتھی سے فوری تازہ معلومات کیسے مانگیں گے؟'],
  },
  'client-project': {
    roman: ['Aap client ko abhi ki progress kaise batayein ge?', 'Aap client se requirement saaf karne ko kaise kahein ge?', 'Trust khoye baghair delay kaise samjhayein ge?', 'Client extra kaam mange to aap kaise jawab dein ge?'],
    urdu: ['آپ گاہک کو موجودہ کام کی پیش رفت کیسے بتائیں گے؟', 'آپ گاہک سے ضرورت واضح کرنے کو کیسے کہیں گے؟', 'اعتماد کھوئے بغیر تاخیر کیسے سمجھائیں گے؟', 'گاہک اضافی کام مانگے تو آپ کیسے جواب دیں گے؟'],
  },
  presentation: {
    roman: ['Aap apni presentation shuru kaise karein ge?', 'Apne idea ka main faida kaise samjhayein ge?', 'Audience ke mushkil sawal ka jawab kaise dein ge?', 'Presentation ko confidence ke saath kaise khatam karein ge?'],
    urdu: ['آپ اپنی پیشکش کیسے شروع کریں گے؟', 'اپنے خیال کا اہم فائدہ کیسے سمجھائیں گے؟', 'سامعین کے مشکل سوال کا جواب کیسے دیں گے؟', 'پیشکش کو اعتماد کے ساتھ کیسے ختم کریں گے؟'],
  },
  travel: {
    roman: ['Hotel mein early check-in ke liye kaise poochein ge?', 'Luggage gum ho jaye to aap kya kahein ge?', 'Rasta politely kaise poochein ge?', 'Khana order karte waqt allergy kaise batayein ge?'],
    urdu: ['ہوٹل میں جلد کمرہ لینے کے لیے کیسے پوچھیں گے؟', 'سامان گم ہو جائے تو آپ کیا کہیں گے؟', 'راستہ شائستگی سے کیسے پوچھیں گے؟', 'کھانا منگواتے وقت الرجی کا ذکر کیسے کریں گے؟'],
  },
  phone: {
    roman: ['Business call par apna intro kaise dein ge?', 'Baat dobara kehne ke liye kaise kahein ge?', 'Saaf voice message kaise chhorein ge?', 'Agli meeting ka time kaise confirm karein ge?'],
    urdu: ['کاروباری فون پر اپنا تعارف کیسے دیں گے؟', 'بات دوبارہ کہنے کے لیے کیسے کہیں گے؟', 'واضح صوتی پیغام کیسے چھوڑیں گے؟', 'اگلی ملاقات کا وقت کیسے پکا کریں گے؟'],
  },
  shopping: {
    roman: ['Doosra size ya colour kaise mangein ge?', 'Politely refund kaise mangein ge?', 'Product ki advice kaise mangein ge?', 'Order ka problem kaise samjhayein ge?'],
    urdu: ['دوسرا سائز یا رنگ کیسے مانگیں گے؟', 'شائستگی سے رقم واپس کیسے مانگیں گے؟', 'مصنوعہ کے بارے میں مشورہ کیسے مانگیں گے؟', 'آرڈر کا مسئلہ کیسے سمجھائیں گے؟'],
  },
  pronunciation: {
    roman: ['Is sentence ko saaf bol kar dohrayein.', 'Is sentence ko slowly aur saaf boliye.', 'Har word ke stress par dhyan dein.', 'Sentence dobara confidence ke saath boliye.'],
    urdu: ['اس جملے کو صاف بول کر دہرائیں۔', 'اس جملے کو آہستہ اور صاف بولیں۔', 'ہر لفظ کے زور پر دھیان دیں۔', 'جملہ دوبارہ اعتماد کے ساتھ بولیں۔'],
  },
};

export const DEFAULT_TOPICS = BASE_TOPICS.map((topic) => ({
  ...topic,
  questionMeanings: DEFAULT_MEANINGS[topic.id]?.roman || [],
  questionUrduMeanings: DEFAULT_MEANINGS[topic.id]?.urdu || [],
}));

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
