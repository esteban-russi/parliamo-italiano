import { ChatMessage, Persona, SavedPhrase } from '../types';
import emmanueleIdle from '../assets/emmanuele/neutral.webp';
import emmanueleSpeaking from '../assets/emmanuele/talking.webp';

export const EMMANUELE: Persona = {
  id: 'emmanuele',
  name: 'Emmanuele',
  fullName: 'Emmanuele il Romano',
  age: 42,
  city: 'Roma',
  region: 'Lazio',
  role: 'Retired Legionary',
  dailyContext: 'life in Rome',
  avatar: {
    idle: emmanueleIdle,
    speaking: emmanueleSpeaking
  },
  cefrLevel: 'A2',
  levelLabel: 'A2-B1 · Everyday conversation',
  dialectSpecialty: 'Clear standard Italian with a Roman twist',
  bio: 'A retired legionary who traded his shield for a bench near the Forum. He loves chatting about daily life in Rome, food, work and the city\'s stories, and corrects you with a soldier\'s patience.',
  topics: ['Daily life in Rome', 'Work & routines', 'Food & markets', 'Roman history'],
  nativeSaying: 'Roma non è stata costruita in un giorno.',
  nativeSayingTranslation: 'Rome was not built in a day.',
  quickReplies: ['molto', 'assolutamente', 'non lo so', 'e tu?'],
  voiceId: 'Charon',
  voiceGender: 'male',
  sampleAudioText: 'Salve, amico! Sono Emmanuele. Oggi Roma è piena di gente. Raccontami qualcosa di te!',
  sampleAudioTranslation: 'Hello, friend! I am Emmanuele. Rome is full of people today. Tell me something about yourself!',
  personaPrompt: 'Sei Emmanuele il Romano, un ex legionario in pensione di 42 anni che vive a Roma. Sei caloroso, ironico e paziente. Parli un italiano chiaro per studenti A2/B1, con frasi brevi e qualche espressione romana. Fai domande sulla vita quotidiana dello studente, correggi gli errori con gentilezza e ogni tanto racconti un aneddoto sulla Roma antica.'
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'e1',
    sender: 'persona',
    personaId: 'emmanuele',
    text: 'Salve! Roma è piena di turisti oggi. E tu, che lavoro fai?',
    translation: 'Hello! Rome is full of tourists today. And you, what do you do for work?',
    grammarNotes: [
      {
        wordOrPhrase: 'che lavoro fai?',
        explanation: 'Literally "what work do you do?". The everyday way to ask someone\'s job, using fare (to do).',
        category: 'verb'
      }
    ],
    timestamp: '09:40'
  }
];

export const INITIAL_SAVED_PHRASES: SavedPhrase[] = [
  { id: 'sp-1', it: 'Che bello!', en: 'How lovely!' },
  { id: 'sp-2', it: 'fine settimana', en: 'weekend' }
];

export const ITALIAN_PRACTICE_PHRASES = [
  { it: 'Io lavoro in un ufficio.', en: 'I work in an office.' },
  { it: 'Puoi parlare un po\' più lentamente?', en: 'Can you speak a little slower?' },
  { it: 'Come si dice "weekend" in italiano?', en: 'How do you say "weekend" in Italian?' },
  { it: 'Che cosa mi consigli di vedere a Roma?', en: 'What do you recommend I see in Rome?' },
  { it: 'Mi piace molto il mio lavoro.', en: 'I like my job a lot.' }
];
