export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type VoiceProvider = 
  | 'gemini_live'
  | 'elevenlabs'
  | 'openai_tts'
  | 'azure_speech'
  | 'browser_tts';

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
  avatarBg: string;
  accentColor: string;
  cefrLevel: CefrLevel;
  levelLabel: string;
  dialectSpecialty: string;
  bio: string;
  topics: string[];
  nativeSaying: string;
  nativeSayingTranslation: string;
  voiceId: string;
  voiceGender: 'male' | 'female';
  isOnline: boolean;
  unreadCount?: number;
  lastMessageSnippet: string;
  lastMessageTime: string;
  avatarConfig: {
    skinTone: string;
    hairColor: string;
    hairStyle: 'short-curls' | 'long-wavy' | 'neat-part' | 'bun-silver' | 'bob-modern';
    facialFeatures?: 'beard-neat' | 'glasses-designer' | 'freckles' | 'earrings';
    outfitColor: string;
    accessoryText?: string;
  };
  sampleAudioText: string;
  personaPrompt: string;
}

export interface DevSettings {
  voiceProvider: VoiceProvider;
  voiceId: string;
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
