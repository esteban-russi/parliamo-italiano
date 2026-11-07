export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type VoiceProvider = 
  | 'gemini_live'
  | 'gcp_cloud_tts'
  | 'elevenlabs'
  | 'openai_tts'
  | 'azure_speech'
  | 'browser_tts';

export type SttProvider =
  | 'production_cloud'
  | 'browser_web_speech';

export interface GrammarNote {
  wordOrPhrase: string;
  explanation: string;
  category: 'verb' | 'idiom' | 'grammar' | 'vocabulary' | 'cultural';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'persona';
  personaId: string;
  text: string;
  translation: string;
  grammarNotes?: GrammarNote[];
  audioDuration?: string;
  timestamp: string;
  isVoiceNote?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  fullName: string;
  age: number;
  city: string;
  region: string;
  role: string;
  /** Short scene the tutor is in today, shown as a context tag. */
  dailyContext: string;
  avatar: {
    /** Resting expression. */
    idle: string;
    /** Open-mouth expression shown while the tutor speaks. */
    speaking: string;
  };
  cefrLevel: CefrLevel;
  levelLabel: string;
  dialectSpecialty: string;
  bio: string;
  topics: string[];
  nativeSaying: string;
  nativeSayingTranslation: string;
  /** One-tap replies offered above the composer. */
  quickReplies: string[];
  voiceId: string;
  voiceGender: 'male' | 'female';
  sampleAudioText: string;
  sampleAudioTranslation: string;
  personaPrompt: string;
}

export interface SavedPhrase {
  id: string;
  it: string;
  en: string;
}

export interface DevSettings {
  voiceProvider: VoiceProvider;
  voiceId: string;
  sttProvider: SttProvider;
  temperature: number;
  speechRate: number;
  audioSamplingRate: '16kHz' | '24kHz' | '48kHz';
  latencyMode: 'turbo' | 'balanced' | 'studio';
  grammarStrictness: 'conversational' | 'tutor' | 'strict';
  regionalSlangLevel: 'off' | 'subtle' | 'authentic';
  subtitlesEnabled: boolean;
  autoPlayAudio: boolean;
  customSystemPrompt: string;
  apiMockLatencyMs: number;
}

export type CallState = 'idle' | 'calling' | 'connected' | 'ended';
export type CallMode = 'audio' | 'video';
export type CharacterSpeakingState = 'idle' | 'listening' | 'thinking' | 'speaking';
