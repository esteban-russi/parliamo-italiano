import React, { useState, useRef, useEffect } from 'react';
import { 
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
  onStartVideoCall: () => void;
  onOpenPersonaDetails: () => void;
  onOpenDevLab: () => void;
  isAiGenerating?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  persona,
  messages,
  devSettings,
  onSendMessage,
  onStartVideoCall,
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
    <main className="flex-1 flex flex-col h-full bg-[#fbf9ff] min-w-0 overflow-hidden">
      
      {/* Italian Flag Tricolore Ribbon Accent */}
      <div className="h-1 w-full flex">
        <span className="w-1/3 bg-emerald-500" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-red-500" />
      </div>

      {/* Chat Top Bar */}
      <header className="px-5 py-3.5 border-b border-purple-100 bg-white/95 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        
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
              <h2 className="text-base font-bold text-purple-950 font-friendly group-hover:text-purple-700 transition-colors">
                {persona.fullName}
              </h2>
              <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-mono font-bold border border-purple-200">
                {persona.cefrLevel}
              </span>
            </div>
            <div className="text-xs text-purple-600/80 flex items-center gap-1.5">
              <span>{persona.city}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 font-medium">
                {persona.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Only Video Call button, standard phone call removed) */}
        <div className="flex items-center gap-2.5">
          
          {/* Translation Global Toggle */}
          <button
            onClick={() => setShowAllTranslations(!showAllTranslations)}
            className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              showAllTranslations
                ? 'bg-purple-100/80 text-purple-800 border-purple-300 font-bold'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
            title="Show or hide English translations"
          >
            <Languages className="w-3.5 h-3.5 text-purple-600" />
            <span>{showAllTranslations ? 'Translations ON' : 'Italian Only'}</span>
          </button>

          {/* Dev Lab indicator button */}
          <button
            onClick={onOpenDevLab}
            className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors font-mono font-semibold"
            title="Configure Voice Model Provider & Gemini Server"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="truncate max-w-[120px]">
              {devSettings.voiceProvider === 'gemini_live' ? 'Gemini 3.8 Live' : devSettings.voiceProvider.replace('_', ' ')}
            </span>
          </button>

          {/* ONLY VIDEO CALL BUTTON (Standard voice call removed as requested) */}
          <button
            onClick={onStartVideoCall}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-transform active:scale-95"
            title="Start Interactive Video Call"
          >
            <Video className="w-4 h-4" />
            <span className="font-friendly">Video Call</span>
          </button>

          {/* Info Details Modal */}
          <button
            onClick={onOpenPersonaDetails}
            className="p-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
            title="Tutor details & bio"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        
        {/* Cultural Welcome Note with Italian Tricolore touch */}
        <div className="max-w-md mx-auto my-2 text-center p-4 rounded-3xl bg-white border border-purple-200/80 shadow-xs text-purple-950 text-xs relative overflow-hidden">
          <div className="h-1 w-24 mx-auto mb-2.5 rounded-full flex overflow-hidden">
            <span className="w-1/3 bg-emerald-500" />
            <span className="w-1/3 bg-stone-300" />
            <span className="w-1/3 bg-red-500" />
          </div>
          <p className="font-bold text-purple-900 font-friendly text-sm">
            {persona.fullName} · {persona.city}
          </p>
          <p className="text-purple-700/80 mt-1 italic font-medium">
            &ldquo;{persona.nativeSaying}&rdquo; — {persona.nativeSayingTranslation}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-purple-100 text-[11px] text-purple-600">
            <span>Specialty:</span>
            <span className="text-purple-950 font-bold">{persona.dialectSpecialty}</span>
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
                className={`relative group rounded-[24px] p-4 text-xs sm:text-sm leading-relaxed transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-md shadow-purple-500/10'
                    : 'bg-white border border-purple-100/90 text-purple-950 rounded-tl-none shadow-xs'
                }`}
              >
                {/* Voice Note waveform header */}
                {message.isVoiceNote && (
                  <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isUser ? 'border-white/20' : 'border-purple-100'}`}>
                    <button
                      onClick={() => handlePlayVoice(message)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isPlaying 
                          ? (isUser ? 'bg-white text-purple-700' : 'bg-purple-600 text-white')
                          : (isUser ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200')
                      }`}
                      title="Listen to voice message"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex items-center gap-1 flex-1">
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-purple-500 animate-wave-1' : (isUser ? 'bg-white/70 h-3' : 'bg-purple-300 h-3')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-purple-500 animate-wave-2' : (isUser ? 'bg-white/70 h-4' : 'bg-purple-300 h-4')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-purple-500 animate-wave-3' : (isUser ? 'bg-white/70 h-2' : 'bg-purple-300 h-2')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-purple-500 animate-wave-4' : (isUser ? 'bg-white/70 h-5' : 'bg-purple-300 h-5')}`} />
                      <span className={`w-1 rounded-full ${isPlaying ? 'bg-purple-500 animate-wave-5' : (isUser ? 'bg-white/70 h-3' : 'bg-purple-300 h-3')}`} />
                    </div>
                    <span className={`text-[10px] font-mono-data ${isUser ? 'text-white/80' : 'text-purple-400'}`}>
                      {message.audioDuration || '0:05'}
                    </span>
                  </div>
                )}

                {/* Primary Italian Text */}
                <div className="text-[13px] sm:text-[14px]">
                  {message.text}
                </div>

                {/* English Translation */}
                {showAllTranslations && message.translation && (
                  <div className={`mt-2 pt-1.5 text-xs italic ${
                    isUser ? 'text-purple-100 border-t border-white/20' : 'text-purple-600/80 border-t border-purple-100'
                  }`}>
                    &ldquo;{message.translation}&rdquo;
                  </div>
                )}

                {/* Expandable Grammar & Vocabulary Note */}
                {!isUser && message.grammarNotes && message.grammarNotes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-purple-100">
                    <button
                      onClick={() => setExpandedGrammarId(isGrammarExpanded ? null : message.id)}
                      className="flex items-center gap-1 text-[11px] text-purple-700 font-bold hover:text-purple-900 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>Grammar & Vocabulary Notes ({message.grammarNotes.length})</span>
                      {isGrammarExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isGrammarExpanded && (
                      <div className="mt-2 space-y-1.5 bg-purple-50/70 p-3 rounded-2xl border border-purple-200/80 text-[11px] animate-in fade-in-50">
                        {message.grammarNotes.map((note, idx) => (
                          <div key={idx} className="pb-1 border-b border-purple-200/50 last:border-0 last:pb-0 text-purple-950">
                            <span className="font-bold text-purple-800">
                              {note.wordOrPhrase}:
                            </span>{' '}
                            <span>{note.explanation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Timestamp & Audio Play Button */}
                <div className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${
                  isUser ? 'text-white/70' : 'text-purple-400'
                }`}>
                  <span className="font-mono-data">{message.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => handlePlayVoice(message)}
                      className="hover:text-purple-700 p-0.5 rounded transition-colors text-purple-500"
                      title="Listen to Italian pronunciation"
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
          <div className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-2xl max-w-xs shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <span className="text-xs text-purple-900 font-semibold font-friendly">
              {persona.name} is crafting a reply with Gemini AI...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Italian Accents & Starter Prompts Toolbar */}
      <div className="px-5 py-2.5 border-t border-purple-100 bg-white shrink-0">
        
        {/* Suggested Quick Starters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
          <span className="text-[10px] text-purple-500 uppercase tracking-wider shrink-0 flex items-center gap-1 font-bold">
            <HelpCircle className="w-3 h-3 text-purple-600" />
            <span>Starters:</span>
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
              className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 hover:text-purple-900 text-purple-800 text-xs whitespace-nowrap border border-purple-200/70 transition-colors font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Accents Bar */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-purple-100/60">
          <div className="flex items-center gap-1 text-purple-600">
            <span className="text-[10px] uppercase font-mono mr-1 text-purple-400 font-bold">Accents:</span>
            {['à', 'è', 'é', 'ì', 'ò', 'ù', '€', '«', '»'].map((char) => (
              <button
                key={char}
                onClick={() => insertAccent(char)}
                className="w-5 h-5 rounded-lg hover:bg-purple-100 hover:text-purple-900 text-purple-800 font-bold flex items-center justify-center transition-colors"
              >
                {char}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-purple-400">
            Press Enter to send
          </span>
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-purple-100 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          
          {/* Microphone recording button */}
          <button
            onClick={toggleMicRecording}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isRecordingMic
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-300'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200'
            }`}
            title={isRecordingMic ? 'Listening to microphone... Click to stop' : 'Speak Italian into microphone'}
          >
            {isRecordingMic ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={`Type a message in Italian to ${persona.name}...`}
            className="flex-1 bg-purple-50/50 border border-purple-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-purple-500/20"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>

        </div>
      </div>

    </main>
  );
};
