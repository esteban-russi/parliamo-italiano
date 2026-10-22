import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Grid, 
  Subtitles, 
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { Persona, CallMode, CharacterSpeakingState, DevSettings } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService, createSpeechRecognizer } from '../utils/speech';
import { ITALIAN_PRACTICE_PHRASES } from '../data/personas';

interface PhoneCallModalProps {
  persona: Persona;
  mode: CallMode;
  devSettings: DevSettings;
  onEndCall: () => void;
  onOpenDevSettings: () => void;
}

interface CallExchange {
  speaker: 'user' | 'persona';
  text: string;
  translation: string;
  timestamp: string;
}

export const PhoneCallModal: React.FC<PhoneCallModalProps> = ({
  persona,
  mode: initialMode,
  devSettings,
  onEndCall,
  onOpenDevSettings
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [callMode, setCallMode] = useState<CallMode>(initialMode);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(devSettings.subtitlesEnabled);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [showPromptAssistance, setShowPromptAssistance] = useState<boolean>(false);
  const [speakingState, setSpeakingState] = useState<CharacterSpeakingState>('idle');
  
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const [dialogueHistory, setDialogueHistory] = useState<CallExchange[]>([]);
  const [userTranscriptInput, setUserTranscriptInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [dialedDigits, setDialedDigits] = useState<string>('');

  const timerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    speechService.playRingtoneBurst();
    const ringInterval = setInterval(() => {
      speechService.playRingtoneBurst();
    }, 2500);

    const connectTimeout = setTimeout(() => {
      clearInterval(ringInterval);
      setCallStatus('connected');

      timerRef.current = window.setInterval(() => {
        setCallDurationSec(prev => prev + 1);
      }, 1000);

      // Start with persona greeting
      handlePersonaSpeak(
        persona.sampleAudioText,
        `Hello! Welcome to ${persona.city}. Let's practice speaking conversational Italian together!`
      );
    }, 2000);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      speechService.stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, [persona]);

  useEffect(() => {
    if (callStatus !== 'connected' || isMuted) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      setIsRecognizing(false);
      return;
    }

    const rec = createSpeechRecognizer(
      (transcript) => {
        setUserTranscriptInput(transcript);
      },
      () => {
        setIsRecognizing(false);
      },
      () => {
        setIsRecognizing(false);
      }
    );

    if (rec) {
      recognizerRef.current = rec;
      try {
        rec.start();
        setIsRecognizing(true);
      } catch {
        // Ignore
      }
    }
  }, [callStatus, isMuted]);

  const handlePersonaSpeak = async (text: string, translation: string) => {
    setSpeakingState('speaking');
    setCurrentSpeechText(text);
    setCurrentTranslation(translation);

    setDialogueHistory(prev => [
      ...prev,
      {
        speaker: 'persona',
        text,
        translation,
        timestamp: formatDuration(callDurationSec)
      }
    ]);

    if (isSpeakerOn) {
      await speechService.speakSmart(text, {
        provider: devSettings.voiceProvider,
        voiceName: persona.voiceId,
        rate: devSettings.speechRate,
        gender: persona.voiceGender,
        onStart: () => setSpeakingState('speaking'),
        onEnd: () => {
          setSpeakingState('listening');
        },
        onError: () => {
          setSpeakingState('idle');
        }
      });
    } else {
      setTimeout(() => {
        setSpeakingState('listening');
      }, 2500);
    }
  };

  const handleUserReply = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setDialogueHistory(prev => [
      ...prev,
      {
        speaker: 'user',
        text: spokenText,
        translation: 'Student spoken Italian',
        timestamp: formatDuration(callDurationSec)
      }
    ]);

    setUserTranscriptInput('');
    setSpeakingState('thinking');

    // Call server API for real Gemini response or smart generator
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPrompt: persona.personaPrompt,
          history: dialogueHistory.slice(-4),
          userMessage: spokenText,
          temperature: devSettings.temperature,
          grammarStrictness: devSettings.grammarStrictness
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          handlePersonaSpeak(data.text, data.translation || '');
          return;
        }
      }
    } catch {
      // Fallback response
    }

    // Fallback contextual generator
    const reply = generateCallFallback(persona, spokenText);
    handlePersonaSpeak(reply.it, reply.en);
  };

  const handleKeyPress = (digit: string) => {
    speechService.playDtmfTone(digit);
    setDialedDigits(prev => (prev + digit).slice(-12));
  };

  const handleHangup = () => {
    speechService.stopSpeaking();
    speechService.playHangupTone();
    if (timerRef.current) clearInterval(timerRef.current);
    onEndCall();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Light Mode Phone Container with Italian Red & Stone Aesthetics */}
      <div className="relative w-full max-w-md h-[92vh] max-h-[820px] bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Soft Red Ambient Top Lighting */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-red-100/70 rounded-full blur-3xl pointer-events-none"
        />

        {/* Top Header Bar */}
        <div className="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-slate-900">
                {callStatus === 'calling' ? 'Chiamata in corso...' : formatDuration(callDurationSec)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono-data">
                {devSettings.voiceProvider === 'gemini_live' ? 'GEMINI 3.8 SERVER TTS' : devSettings.voiceProvider.replace('_', ' ').toUpperCase()} · {persona.city}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDevSettings}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 flex items-center gap-1 transition-colors font-medium"
              title="Voice Lab & Parametri"
            >
              <Sparkles className="w-3 h-3 text-red-600" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={handleHangup}
              className="p-1.5 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Screen: Voice Sound Stage (Minimalist, without cartoon avatars) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-3 text-center">
          
          {/* Identity */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-editorial">
              {persona.fullName}
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{persona.city}</span>
              <span aria-hidden="true">·</span>
              <span className="text-red-700 font-semibold">{persona.levelLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{persona.role}</span>
            </div>
          </div>

          {/* Minimalist Sound Stage with Monogram Badge & Live Audio Pulse */}
          <div className="relative my-auto flex flex-col items-center">
            <PersonaBadge
              persona={persona}
              size="call"
              speakingState={speakingState}
            />

            {/* Speaking / Listening Frequency Visualizer */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-red-600 animate-wave-1' : 'bg-slate-300 h-2'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-red-600 animate-wave-2' : 'bg-slate-300 h-3'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-red-600 animate-wave-3' : 'bg-slate-300 h-1.5'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-red-600 animate-wave-4' : 'bg-slate-300 h-4'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-red-600 animate-wave-5' : 'bg-slate-300 h-2'}`} />
            </div>

            <div className="mt-2 text-xs font-medium text-slate-600">
              {speakingState === 'speaking' ? (
                <span className="text-red-600 font-semibold flex items-center gap-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  {persona.name} sta parlando...
                </span>
              ) : speakingState === 'listening' ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  In ascolto... Parla pure!
                </span>
              ) : speakingState === 'thinking' ? (
                <span className="text-amber-600 font-semibold">
                  Elaborazione con Gemini AI...
                </span>
              ) : (
                <span className="text-slate-400">Canale Vocale Connesso</span>
              )}
            </div>
          </div>

          {/* Real-time Subtitles / Captions */}
          {showSubtitles && (
            <div className="w-full max-w-sm bg-white/95 border border-slate-200 rounded-2xl p-3 my-2 text-left shadow-sm">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-slate-100">
                <span className="flex items-center gap-1 font-semibold text-red-600">
                  <Subtitles className="w-3 h-3" /> Sottotitoli Live
                </span>
                <span className="italic">{speakingState === 'speaking' ? `${persona.name}` : 'Studente'}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 leading-snug">
                {currentSpeechText || (isRecognizing ? (userTranscriptInput || 'Parla pure al microfono...') : 'In attesa...')}
              </p>
              {currentTranslation && (
                <p className="text-xs text-slate-500 mt-1 italic border-t border-slate-100 pt-1">
                  &ldquo;{currentTranslation}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Speaking Practice Suggestions */}
          {showPromptAssistance && (
            <div className="w-full max-w-sm bg-white border border-red-200 rounded-2xl p-3 my-1 text-left text-xs shadow-md animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-red-700 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Frasi da dire:
                </span>
                <button
                  onClick={() => setShowPromptAssistance(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {ITALIAN_PRACTICE_PHRASES.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserReply(item.it)}
                    className="w-full text-left p-2 rounded-lg bg-stone-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 transition-colors block text-slate-800"
                  >
                    <div className="font-medium text-red-700">{item.it}</div>
                    <div className="text-[10px] text-slate-500 italic">{item.en}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dialpad Overlay */}
          {showKeypad && (
            <div className="w-full max-w-xs bg-white border border-slate-200 rounded-2xl p-3 my-1 shadow-lg animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs text-slate-600 font-mono-data tracking-wider font-semibold">
                  {dialedDigits || 'Tastiera Telefonica'}
                </span>
                <button onClick={() => setShowKeypad(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleKeyPress(btn)}
                    className="h-10 rounded-xl bg-stone-50 hover:bg-stone-100 text-slate-900 font-bold text-sm active:scale-95 transition-transform flex items-center justify-center border border-slate-200"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Speak / Test mic interactive input */}
          <div className="w-full max-w-sm mt-1 flex items-center gap-2">
            <input
              type="text"
              value={userTranscriptInput}
              onChange={(e) => setUserTranscriptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userTranscriptInput.trim()) {
                  handleUserReply(userTranscriptInput);
                }
              }}
              placeholder="Scrivi o parla in italiano..."
              className="flex-1 bg-stone-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:bg-white"
            />
            {userTranscriptInput.trim() && (
              <button
                onClick={() => handleUserReply(userTranscriptInput)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                Invia
              </button>
            )}
          </div>
        </div>

        {/* Regular Basic Call Buttons (As requested by user: "where regular basic call butons are there") */}
        <div className="relative z-10 bg-stone-50 border-t border-slate-200 px-6 py-4">
          
          {/* Secondary Buttons: Subtitles, Suggestions, Keypad */}
          <div className="flex items-center justify-around mb-4 text-slate-500">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showSubtitles ? 'text-red-700 font-semibold' : 'hover:text-slate-800'
              }`}
              title="Attiva/Disattiva Sottotitoli"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showSubtitles ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200'
              }`}>
                <Subtitles className="w-4 h-4" />
              </div>
              <span>Sottotitoli</span>
            </button>

            <button
              onClick={() => setShowPromptAssistance(!showPromptAssistance)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showPromptAssistance ? 'text-red-700 font-semibold' : 'hover:text-slate-800'
              }`}
              title="Suggerimenti frasi in italiano"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showPromptAssistance ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200'
              }`}>
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>Cosa dire</span>
            </button>

            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showKeypad ? 'text-red-700 font-semibold' : 'hover:text-slate-800'
              }`}
              title="Tastierino telefonico"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showKeypad ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200'
              }`}>
                <Grid className="w-4 h-4" />
              </div>
              <span>Tastierino</span>
            </button>
          </div>

          {/* Primary Call Controls: Mute, Speaker, Video, End Call */}
          <div className="flex items-center justify-center gap-5 sm:gap-6">
            
            {/* 1. MUTE / UNMUTE MICROPHONE */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-xs ${
                isMuted
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-stone-100'
              }`}
              title={isMuted ? 'Riattiva microfono (Unmute)' : 'Disattiva microfono (Mute)'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isMuted ? 'Muto' : 'Microfono'}</span>
            </button>

            {/* 2. SPEAKER / AUDIO OUTPUT */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-xs ${
                !isSpeakerOn
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-stone-100'
              }`}
              title={isSpeakerOn ? 'Disattiva altoparlante' : 'Attiva vivavoce'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isSpeakerOn ? 'Vivavoce' : 'Silenzioso'}</span>
            </button>

            {/* 3. VIDEO TOGGLE */}
            <button
              onClick={() => setCallMode(callMode === 'video' ? 'audio' : 'video')}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-xs ${
                callMode === 'video'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-stone-100'
              }`}
              title="Passa da video ad audio"
            >
              {callMode === 'video' ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{callMode === 'video' ? 'Video ON' : 'Audio Solo'}</span>
            </button>

            {/* 4. END CALL (RED CIRCULAR BUTTON) */}
            <button
              onClick={handleHangup}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-lg shadow-red-600/30 border-2 border-white"
              title="Termina Chiamata (End Call)"
            >
              <PhoneOff className="w-6 h-6" />
              <span className="text-[9px] font-semibold mt-0.5">Chiudi</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

function generateCallFallback(persona: Persona, userText: string): { it: string; en: string } {
  const lower = userText.toLowerCase();

  if (persona.id === 'matteo') {
    if (lower.includes('caffè') || lower.includes('ordinare')) {
      return {
        it: 'Ottima pronuncia! Al banco a Firenze diciamo "Un espresso macchiato caldo, per favore". Prova a ripeterlo!',
        en: 'Great pronunciation! At the counter in Florence we say "A warm espresso macchiato, please". Try repeating it!'
      };
    }
    return {
      it: 'Ti sento forte e chiaro! Hai usato una bellissima espressione. Vuoi fare un altro tentativo di conversazione?',
      en: 'I hear you loud and clear! You used a wonderful expression. Want to make another conversation attempt?'
    };
  }

  if (persona.id === 'sofia') {
    return {
      it: 'Bravissimo! A Roma apprezziamo tanto chi parla con questa naturalezza. Continua pure!',
      en: 'Well done! In Rome we really appreciate those who speak with such natural ease. Keep going!'
    };
  }

  return {
    it: 'Molto bene! Ricordati di scandire bene le vocali finali. Stai migliorando a vista d\'occhio!',
    en: 'Very good! Remember to enunciate the ending vowels well. You are improving visibly!'
  };
}
