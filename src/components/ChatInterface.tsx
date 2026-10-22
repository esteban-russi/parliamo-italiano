import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Languages, 
  BookOpen, 
  Sparkles, 
  Info, 
  HelpCircle,
  Play,
  Pause,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Persona, ChatMessage, DevSettings, CharacterSpeakingState } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService, createSpeechRecognizer } from '../utils/speech';

interface ChatInterfaceProps {
  persona: Persona;
  messages: ChatMessage[];
  devSettings: DevSettings;
  onSendMessage: (text: string) => void;
  onStartCall: (mode: 'audio' | 'video') => void;
  onOpenPersonaDetails: () => void;
  onOpenDevLab: () => void;
  isAiGenerating?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  persona,
  messages,
  devSettings,
  onSendMessage,
  onStartCall,
  onOpenPersonaDetails,
  onOpenDevLab,
  isAiGenerating = false
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [showAllTranslations, setShowAllTranslations] = useState<boolean>(true);
  const [expandedGrammarId, setExpandedGrammarId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [speakingState, setSpeakingState] = useState<CharacterSpeakingState>('idle');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiGenerating]);

  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const insertAccent = (char: string) => {
    setInputText(prev => prev + char);
  };

  const handlePlayVoice = async (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      speechService.stopSpeaking();
      setPlayingMessageId(null);
      setSpeakingState('idle');
      return;
    }

    setPlayingMessageId(message.id);
    setSpeakingState('speaking');

    await speechService.speakSmart(message.text, {
      provider: devSettings.voiceProvider,
      voiceName: persona.voiceId,
      rate: devSettings.speechRate,
      gender: persona.voiceGender,
      onStart: () => setSpeakingState('speaking'),
      onEnd: () => {
        setPlayingMessageId(null);
        setSpeakingState('idle');
      },
      onError: () => {
        setPlayingMessageId(null);
        setSpeakingState('idle');
      }
    });
  };

  const toggleMicRecording = () => {
    if (isRecordingMic) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      setIsRecordingMic(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setInputText(transcript);
      },
      () => {
        setIsRecordingMic(false);
      },
      () => {
        setIsRecordingMic(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
        setIsRecordingMic(true);
      } catch (err) {
        console.warn('Mic start failed:', err);
      }
    } else {
      setInputText('Vorrei ordinare un caffè macchiato caldo.');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50/70 min-w-0 overflow-hidden">
      
      {/* Chat Top Bar */}
      <header className="px-5 py-3.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        
        {/* Left: Persona identity */}
        <div 
          onClick={onOpenPersonaDetails}
          className="flex items-center gap-3 cursor-pointer group transition-opacity"
        >
          <PersonaBadge
            persona={persona}
            size="md"
            speakingState={speakingState}
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                {persona.fullName}
              </h2>
              <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-mono font-semibold border border-red-100">
                {persona.cefrLevel}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>{persona.city}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 font-medium">
                {persona.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          {/* Translation Global Toggle */}
          <button
            onClick={() => setShowAllTranslations(!showAllTranslations)}
            className={`hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
              showAllTranslations
                ? 'bg-red-50 text-red-700 border-red-200 font-medium'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
            title="Mostra o nascondi le traduzioni in inglese"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showAllTranslations ? 'Traduzioni ON' : 'Solo Italiano'}</span>
          </button>

          {/* Dev Lab indicator button */}
          <button
            onClick={onOpenDevLab}
            className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-slate-200 transition-colors font-mono"
            title="Configura Voice Model Provider & Server Gemini"
          >
            <Sparkles className="w-3 h-3 text-red-600" />
            <span className="truncate max-w-[120px]">
              {devSettings.voiceProvider === 'gemini_live' ? 'Gemini 3.8 Live' : devSettings.voiceProvider.replace('_', ' ')}
            </span>
          </button>

          {/* Regular Basic Call Button: Voice Call */}
          <button
            onClick={() => onStartCall('audio')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-xs transition-transform active:scale-95"
            title="Avvia Chiamata Vocale"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Chiama</span>
          </button>

          {/* Regular Basic Call Button: Video Call */}
          <button
            onClick={() => onStartCall('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-medium text-xs border border-slate-200 transition-transform active:scale-95"
            title="Avvia Videochiamata"
          >
            <Video className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Info Details Modal */}
          <button
            onClick={onOpenPersonaDetails}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
            title="Dettagli del tutor"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        
        {/* Cultural Welcome Note */}
        <div className="max-w-md mx-auto my-2 text-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-700 text-xs">
          <p className="font-bold text-red-700">
            {persona.fullName} · {persona.city}
          </p>
          <p className="text-slate-500 mt-1 italic">
            &ldquo;{persona.nativeSaying}&rdquo; — {persona.nativeSayingTranslation}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Specialità:</span>
            <span className="text-slate-800 font-medium">{persona.dialectSpecialty}</span>
          </div>
        </div>

        {/* Messages Stream */}
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          const isPlaying = playingMessageId === message.id;
          const isGrammarExpanded = expandedGrammarId === message.id;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              {/* Message Bubble */}
              <div
                className={`relative group rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-red-600 text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-none shadow-xs'
                }`}
              >
                {/* Voice Note waveform header if voice note */}
                {message.isVoiceNote && (
                  <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isUser ? 'border-white/20' : 'border-slate-100'}`}>
                    <button
                      onClick={() => handlePlayVoice(message)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isPlaying 
                          ? (isUser ? 'bg-white text-red-600' : 'bg-red-600 text-white')
                          : (isUser ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-50 text-red-600 hover:bg-red-100')
                      }`}
                      title="Ascolta messaggio vocale (Gemini/Browser)"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex items-center gap-1 flex-1">
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-red-500 animate-wave-1' : (isUser ? 'bg-white/70 h-3' : 'bg-slate-300 h-3')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-red-500 animate-wave-2' : (isUser ? 'bg-white/70 h-4' : 'bg-slate-300 h-4')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-red-500 animate-wave-3' : (isUser ? 'bg-white/70 h-2' : 'bg-slate-300 h-2')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-red-500 animate-wave-4' : (isUser ? 'bg-white/70 h-5' : 'bg-slate-300 h-5')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-red-500 animate-wave-5' : (isUser ? 'bg-white/70 h-3' : 'bg-slate-300 h-3')}`} />
                      <span className={`w-1 rounded-full ${isUser ? 'bg-white/30 h-2' : 'bg-slate-200 h-2'}`} />
                      <span className={`w-1 rounded-full ${isUser ? 'bg-white/30 h-3' : 'bg-slate-200 h-3'}`} />
                    </div>
                    <span className={`text-[10px] font-mono-data ${isUser ? 'text-white/80' : 'text-slate-400'}`}>
                      {message.audioDuration || '0:05'}
                    </span>
                  </div>
                )}

                {/* Primary Italian Text */}
                <div className="font-sans text-[13px] sm:text-[14px]">
                  {message.text}
                </div>

                {/* English Translation */}
                {showAllTranslations && message.translation && (
                  <div className={`mt-2 pt-1.5 text-xs italic ${
                    isUser ? 'text-red-100 border-t border-white/20' : 'text-slate-500 border-t border-slate-100'
                  }`}>
                    &ldquo;{message.translation}&rdquo;
                  </div>
                )}

                {/* Expandable Grammar & Vocabulary Note */}
                {!isUser && message.grammarNotes && message.grammarNotes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setExpandedGrammarId(isGrammarExpanded ? null : message.id)}
                      className="flex items-center gap-1 text-[11px] text-red-600 font-semibold hover:text-red-700 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Note di Grammatica & Vocabolario ({message.grammarNotes.length})</span>
                      {isGrammarExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isGrammarExpanded && (
                      <div className="mt-2 space-y-1.5 bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-[11px] animate-in fade-in-50">
                        {message.grammarNotes.map((note, idx) => (
                          <div key={idx} className="pb-1 border-b border-red-100/60 last:border-0 last:pb-0 text-slate-700">
                            <span className="font-bold text-red-700">
                              {note.wordOrPhrase}:
                            </span>{' '}
                            <span>{note.explanation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Timestamp & Quick Audio Button */}
                <div className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                  isUser ? 'text-white/70' : 'text-slate-400'
                }`}>
                  <span className="font-mono-data">{message.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => handlePlayVoice(message)}
                      className="hover:text-red-600 p-0.5 rounded transition-colors"
                      title="Ascolta pronuncia italiana reale"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Generating Indicator */}
        {isAiGenerating && (
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl max-w-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs text-slate-600 font-medium">
              {persona.name} sta formulando la risposta con Gemini AI...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Italian Accents & Starter Prompts Toolbar */}
      <div className="px-5 py-2 border-t border-slate-200/70 bg-white shrink-0">
        
        {/* Suggested Quick Starters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 font-semibold">
            <HelpCircle className="w-3 h-3 text-red-600" />
            <span>Spunti:</span>
          </span>
          {[
            'Come si ordina al bar?',
            'Parlami della tua città!',
            'Correggi la mia frase',
            'Che cosa consigli di tipico?'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs whitespace-nowrap border border-slate-200/80 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Accents Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-[10px] uppercase font-mono mr-1 text-slate-400">Accenti:</span>
            {['à', 'è', 'é', 'ì', 'ò', 'ù', '€', '«', '»'].map((char) => (
              <button
                key={char}
                onClick={() => insertAccent(char)}
                className="w-5 h-5 rounded hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium flex items-center justify-center transition-colors border border-transparent hover:border-red-200"
              >
                {char}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-400">
            Premi Invio per inviare
          </span>
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          
          {/* Microphone recording button */}
          <button
            onClick={toggleMicRecording}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isRecordingMic
                ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-200'
                : 'bg-stone-100 hover:bg-stone-200 text-slate-600 border border-slate-200'
            }`}
            title={isRecordingMic ? 'In ascolto del microfono... Clicca per fermare' : 'Parla in italiano al microfono'}
          >
            {isRecordingMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={`Scrivi un messaggio in italiano a ${persona.name}...`}
            className="flex-1 bg-stone-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-bold flex items-center justify-center transition-transform active:scale-95 shadow-xs"
            title="Invia messaggio"
          >
            <Send className="w-4 h-4" />
          </button>

        </div>
      </div>

    </main>
  );
};
