import { Persona } from '../types';

export const INITIAL_PERSONAS: Persona[] = [
  {
    id: 'matteo',
    name: 'Matteo',
    fullName: 'Matteo Rossi',
    age: 28,
    city: 'Firenze',
    region: 'Toscana',
    role: 'Barista & Foodie Guide',
    avatarBg: 'from-amber-600 to-amber-900',
    accentColor: '#d97706',
    cefrLevel: 'A1',
    levelLabel: 'A1-A2 · Beginner',
    dialectSpecialty: 'Standard Italian & Friendly Florentine',
    bio: 'Born and raised in Santo Spirito, Florence. Makes the best espresso in town and loves explaining Tuscan culinary culture in simple, welcoming words.',
    topics: ['Coffee & Breakfast', 'Ordering at Restaurants', 'Weather & Greetings', 'Florence City Walks'],
    nativeSaying: 'Meno male che c\'è il caffè!',
    nativeSayingTranslation: 'Thank goodness there is coffee!',
    voiceId: 'Fenrir',
    voiceGender: 'male',
    isOnline: true,
    unreadCount: 1,
    lastMessageSnippet: 'Ciao! Would you like a coffee at the counter this morning? Tell me your name!',
    lastMessageTime: '09:42',
    avatarConfig: {
      skinTone: '#F3D2B8',
      hairColor: '#3D2314',
      hairStyle: 'short-curls',
      facialFeatures: 'beard-neat',
      outfitColor: '#1E293B',
      accessoryText: 'Apron & Espresso Pin'
    },
    sampleAudioText: 'Ciao carissimo! Benvenuto a Firenze. Ti insegno io come ordinare un caffè perfetto al banco!',
    personaPrompt: 'Sei Matteo Rossi, un barista toscano solare e accogliente di 28 anni a Firenze. Parli un italiano chiaro e incoraggiante per principianti A1/A2. Usa frasi quotidiane brevi, spiega le parole nuove con pazienza e trasmetti il calore del bar italiano.'
  },
  {
    id: 'sofia',
    name: 'Sofia',
    fullName: 'Sofia De Luca',
    age: 32,
    city: 'Roma',
    region: 'Lazio',
    role: 'Art Historian & Museum Curator',
    avatarBg: 'from-rose-600 to-rose-950',
    accentColor: '#e11d48',
    cefrLevel: 'B1',
    levelLabel: 'B1-B2 · Intermediate',
    dialectSpecialty: 'Expressive Italian & Roman Idioms',
    bio: 'Works between the Capitoline Museums and Villa Borghese. She is full of captivating stories about Caravaggio, hidden fountains, and Roman culture.',
    topics: ['Art & Museums', 'Roman Architecture', 'Italian Cinema', 'Travel Advice'],
    nativeSaying: 'Daje, Roma non è stata costruita in un giorno!',
    nativeSayingTranslation: 'Come on, Rome was not built in a day!',
    voiceId: 'Kore',
    voiceGender: 'female',
    isOnline: true,
    unreadCount: 2,
    lastMessageSnippet: 'Have you ever seen the Sistine Chapel ceiling in person? Truly breathtaking...',
    lastMessageTime: '11:15',
    avatarConfig: {
      skinTone: '#EAC8AF',
      hairColor: '#1F1A17',
      hairStyle: 'long-wavy',
      facialFeatures: 'earrings',
      outfitColor: '#881337',
      accessoryText: 'Silk Scarf'
    },
    sampleAudioText: 'Ciao! Che bello sentirti. Oggi a Roma c\'è una luce magnifica sui fori imperiali. Di che cosa vogliamo parlare?',
    personaPrompt: 'Sei Sofia De Luca, curatrice d\'arte di 32 anni a Roma. Hai una parlata vivace, elegante con tocchi di calore romanesco educato. Aiuti lo studente con costruzioni grammaticali più ricche (congiuntivo, pronomi combinati) parlando di bellezza, cultura e viaggi.'
  },
  {
    id: 'nonna-rosa',
    name: 'Nonna Rosa',
    fullName: 'Rosa Esposito',
    age: 68,
    city: 'Napoli',
    region: 'Campania',
    role: 'Master of Traditional Italian Cooking',
    avatarBg: 'from-emerald-700 to-emerald-950',
    accentColor: '#059669',
    cefrLevel: 'A2',
    levelLabel: 'A2-B1 · Warm Conversational',
    dialectSpecialty: 'Family Idioms & Neapolitan Warmth',
    bio: 'Keeper of authentic Neapolitan ragù and Sunday family cooking traditions. She treats you like her own grandchild, always asking if you have eaten.',
    topics: ['Family Recipes', 'Handmade Fresh Pasta', 'Childhood Stories', 'Italian Holidays'],
    nativeSaying: 'Chi mangia da solo si strozza!',
    nativeSayingTranslation: 'Whoever eats alone chokes! (Food is meant for sharing)',
    voiceId: 'Kore',
    voiceGender: 'female',
    isOnline: true,
    unreadCount: 0,
    lastMessageSnippet: 'Tesoro di nonna! Did you eat well today or are you on an empty stomach?',
    lastMessageTime: 'Yesterday',
    avatarConfig: {
      skinTone: '#F2D3BC',
      hairColor: '#D1D5DB',
      hairStyle: 'bun-silver',
      facialFeatures: 'freckles',
      outfitColor: '#064E3B',
      accessoryText: 'Floral Apron & Pearl brooch'
    },
    sampleAudioText: 'Cuore mio! Metti su l\'acqua per gli spaghetti che nonna ti spiega come si fa una vera salsa al pomodoro fresco!',
    personaPrompt: 'Sei Nonna Rosa, 68 anni da Napoli. Sei affettuosa, materna e dolce. Chiami l\'utente "tesoro", "caro", "gioia mia". Correggi con infinita tenerezza e fai metafore sul cibo e sulla famiglia.'
  },
  {
    id: 'marco',
    name: 'Marco',
    fullName: 'Marco Bellini',
    age: 35,
    city: 'Milano',
    region: 'Lombardia',
    role: 'Product Designer & Tech Entrepreneur',
    avatarBg: 'from-indigo-700 to-slate-900',
    accentColor: '#6366f1',
    cefrLevel: 'C1',
    levelLabel: 'B2-C1 · Advanced / Business',
    dialectSpecialty: 'Contemporary Italian & Milanese Innovation',
    bio: 'Founder of a design studio in Isola, Milan. Passionate about urban mobility, minimalist fashion, and the iconic Milanese aperitivo ritual.',
    topics: ['Work & Startups', 'Design & Sustainability', 'Aperitivo in Navigli', 'Modern Trends'],
    nativeSaying: 'Senza fretta ma senza sosta.',
    nativeSayingTranslation: 'Without haste, but without pause.',
    voiceId: 'Charon',
    voiceGender: 'male',
    isOnline: false,
    unreadCount: 0,
    lastMessageSnippet: 'Let\'s finish this pitch deck and meet at 7:30 PM for an aperitivo?',
    lastMessageTime: 'Monday',
    avatarConfig: {
      skinTone: '#E4BE9F',
      hairColor: '#2B2724',
      hairStyle: 'neat-part',
      facialFeatures: 'glasses-designer',
      outfitColor: '#1E1B4B',
      accessoryText: 'Architectural Glasses'
    },
    sampleAudioText: 'Ciao! Qui a Milano le giornate volano, ma per una conversazione stimolante c\'è sempre tempo. Di quale progetto ti stai occupando?',
    personaPrompt: 'Sei Marco Bellini, designer di Milano di 35 anni. Usi un registro colto, moderno e dinamico con vocabolario professionale, sfumature di business e cultura dell\'aperitivo. Sfidi lo studente con argomenti complessi e costruzioni linguistiche avanzate.'
  },
  {
    id: 'giulia',
    name: 'Giulia',
    fullName: 'Giulia Moretti',
    age: 24,
    city: 'Bologna',
    region: 'Emilia-Romagna',
    role: 'Indie Musician & Linguistics Student',
    avatarBg: 'from-violet-600 to-fuchsia-900',
    accentColor: '#8b5cf6',
    cefrLevel: 'B1',
    levelLabel: 'B1-B2 · Youth Slang & Music',
    dialectSpecialty: 'Youth Slang, Music & College Life',
    bio: 'Plays acoustic guitar under the porticoes of Piazza Maggiore. She teaches real everyday conversational Italian used in music and youth culture.',
    topics: ['Indie Music', 'Everyday Slang', 'Student Life', 'Backpack Travel'],
    nativeSaying: 'Che figata assurda!',
    nativeSayingTranslation: 'That is crazy awesome!',
    voiceId: 'Puck',
    voiceGender: 'female',
    isOnline: true,
    unreadCount: 3,
    lastMessageSnippet: 'I just wrote a new chorus for an acoustic song! Would you like to hear it?',
    lastMessageTime: '12:04',
    avatarConfig: {
      skinTone: '#F6D5C2',
      hairColor: '#9A3412',
      hairStyle: 'bob-modern',
      facialFeatures: 'freckles',
      outfitColor: '#581C87',
      accessoryText: 'Acoustic Guitar Strap'
    },
    sampleAudioText: 'Ehi ciao! Stavo giusto provando un accordo con la chitarra. Ti insegno un paio di parole di slang italiano che sui libri di testo non trovi mai!',
    personaPrompt: 'Sei Giulia, studentessa e cantautrice di 24 anni a Bologna. Sei vivace, spiritosa, ami lo slang autentico ("figata", "tipo", "ci sta", "sbatti"). Insegni l\'italiano parlato rilassato ed espressivo.'
  }
];

export const INITIAL_MESSAGES: Record<string, import('../types').ChatMessage[]> = {
  matteo: [
    {
      id: 'm1',
      sender: 'persona',
      personaId: 'matteo',
      text: 'Ciao! Benvenuto al mio bar qui a Firenze! ☕ Come stai oggi?',
      translation: 'Hello! Welcome to my coffee shop here in Florence! How are you doing today?',
      grammarNotes: [
        {
          wordOrPhrase: 'Benvenuto',
          explanation: 'Welcome (masculine singular). If speaking to a female, Italians say "Benvenuta".',
          category: 'grammar'
        },
        {
          wordOrPhrase: 'Come stai',
          explanation: 'Informal "How are you?" (from the verb stare - to be/stay).',
          category: 'verb'
        }
      ],
      audioDuration: '0:04',
      timestamp: '09:40',
      isVoiceNote: true
    },
    {
      id: 'm2',
      sender: 'persona',
      personaId: 'matteo',
      text: 'Se vuoi ordinare, puoi dire semplicemente: "Un caffè espresso per favore, grazie!". Ti va di provare?',
      translation: 'If you want to order, you can simply say: "An espresso coffee please, thank you!". Would you like to try?',
      grammarNotes: [
        {
          wordOrPhrase: 'per favore',
          explanation: 'Classic courteous phrase for "please". You can also hear "per piacere".',
          category: 'vocabulary'
        },
        {
          wordOrPhrase: 'Ti va di provare?',
          explanation: 'Idiomatic expression meaning "Do you feel like trying?" (andare a qualcuno + infinitive).',
          category: 'idiom'
        }
      ],
      timestamp: '09:42'
    }
  ],
  sofia: [
    {
      id: 's1',
      sender: 'persona',
      personaId: 'sofia',
      text: 'Buongiorno da Roma! Mi trovo proprio davanti alla Fontana di Trevi. C\'è un\'atmosfera magica stamattina.',
      translation: 'Good morning from Rome! I am right in front of the Trevi Fountain. There is a magical atmosphere this morning.',
      grammarNotes: [
        {
          wordOrPhrase: 'Mi trovo',
          explanation: 'Reflexive verb "trovarsi" meaning "to find oneself / to be located". Very natural in Italian.',
          category: 'verb'
        },
        {
          wordOrPhrase: 'C\'è',
          explanation: 'Contraction of "ci è", meaning "there is". (Plural: "ci sono").',
          category: 'grammar'
        }
      ],
      audioDuration: '0:06',
      timestamp: '11:10',
      isVoiceNote: true
    },
    {
      id: 's2',
      sender: 'persona',
      personaId: 'sofia',
      text: 'Hai mai visitato Roma o stai programmando un viaggio in Italia?',
      translation: 'Have you ever visited Rome or are you planning a trip to Italy?',
      grammarNotes: [
        {
          wordOrPhrase: 'Hai mai visitato',
          explanation: 'Passato prossimo tense with "mai" (ever). Formed with auxiliary avere + past participle.',
          category: 'grammar'
        },
        {
          wordOrPhrase: 'stai programmando',
          explanation: 'Present progressive tense: stare + gerund (-ando/-endo). Meaning "are you planning".',
          category: 'verb'
        }
      ],
      timestamp: '11:15'
    }
  ],
  'nonna-rosa': [
    {
      id: 'nr1',
      sender: 'persona',
      personaId: 'nonna-rosa',
      text: 'Tesoro mio bello! Dimmi subito: hai mangiato bene oggi o sei a stomaco vuoto?',
      translation: 'My beautiful sweetheart! Tell me right away: did you eat well today or are you on an empty stomach?',
      grammarNotes: [
        {
          wordOrPhrase: 'Tesoro mio',
          explanation: 'Sweet term of endearment ("My treasure/sweetheart") common among Italian grandmothers.',
          category: 'cultural'
        },
        {
          wordOrPhrase: 'a stomaco vuoto',
          explanation: 'Idiom meaning "on an empty stomach".',
          category: 'idiom'
        }
      ],
      audioDuration: '0:05',
      timestamp: 'Ieri',
      isVoiceNote: true
    }
  ],
  marco: [
    {
      id: 'mb1',
      sender: 'persona',
      personaId: 'marco',
      text: 'Ciao! Sono in pausa dallo studio di Porta Nuova. Stiamo definendo una nuova interfaccia. Tu come trovi il design italiano?',
      translation: 'Hello! I am on a break from the studio in Porta Nuova. We are defining a new interface. How do you find Italian design?',
      grammarNotes: [
        {
          wordOrPhrase: 'in pausa',
          explanation: 'Colloquial phrase for "taking a break / on break".',
          category: 'vocabulary'
        },
        {
          wordOrPhrase: 'come trovi',
          explanation: '"How do you find..." in the sense of "What is your opinion of...".',
          category: 'verb'
        }
      ],
      audioDuration: '0:05',
      timestamp: 'Lunedì',
      isVoiceNote: true
    }
  ],
  giulia: [
    {
      id: 'gm1',
      sender: 'persona',
      personaId: 'giulia',
      text: 'Ehi! Che bella giornata a Bologna! Stasera andiamo a fare un aperitivo con gli amici della facoltà. Ci sei?',
      translation: 'Hey! What a beautiful day in Bologna! Tonight we are going to have an aperitivo with college friends. Are you in?',
      grammarNotes: [
        {
          wordOrPhrase: 'fare un aperitivo',
          explanation: 'Essential Italian social ritual involving drinks and small bites before dinner.',
          category: 'cultural'
        },
        {
          wordOrPhrase: 'Ci sei?',
          explanation: 'Youth casual slang for "Are you up for it? / Are you coming?".',
          category: 'idiom'
        }
      ],
      audioDuration: '0:04',
      timestamp: '12:04',
      isVoiceNote: true
    }
  ]
};

export const CULTURAL_STORIES = [
  {
    id: 'story-1',
    personaId: 'matteo',
    title: 'The Suspended Coffee',
    subtitle: 'A noble Italian tradition of paying it forward',
    snippet: 'When you order two coffees and leave one paid for anyone who might need it.',
    duration: '1:12'
  },
  {
    id: 'story-2',
    personaId: 'sofia',
    title: 'Talking Hands',
    subtitle: 'How to speak with gestures without saying a word',
    snippet: 'Italian body language is not just movement, it is a whole second grammar!',
    duration: '0:58'
  },
  {
    id: 'story-3',
    personaId: 'nonna-rosa',
    title: 'Fare la Scarpetta',
    subtitle: 'The sacred dining ritual across Italy',
    snippet: 'Wiping the remaining sauce off your plate with a piece of crusty bread.',
    duration: '1:30'
  },
  {
    id: 'story-4',
    personaId: 'giulia',
    title: 'Italian Street Slang',
    subtitle: 'What young people say in Bologna and Milan',
    snippet: 'From "che figata" to "ci sta", expressions to sound like a true native.',
    duration: '1:05'
  }
];

export const ITALIAN_PRACTICE_PHRASES = [
  { it: 'Vorrei un cappuccino con latte d\'avena, per favore.', en: 'I would like an oat milk cappuccino, please.' },
  { it: 'Che cosa mi consigli di tipico da assaggiare qui?', en: 'What typical specialty do you recommend I taste here?' },
  { it: 'Scusa, sai a che ora chiudono i musei oggi?', en: 'Excuse me, do you know what time the museums close today?' },
  { it: 'Puoi parlare un po\' più lentamente? Sto imparando!', en: 'Can you speak a little slower? I am learning!' },
  { it: 'Come si dice questa parola in italiano corretto?', en: 'How do you say this word in proper Italian?' }
];
