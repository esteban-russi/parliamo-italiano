import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Subtitles, 
  Sparkles,
  HelpCircle,
  X,
  Camera,
  Maximize2
} from 'lucide-react';
import { Persona, CharacterSpeakingState, DevSettings } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService, createSpeechRecognizer } from '../utils/speech';
import { ITALIAN_PRACTICE_PHRASES } from '../data/personas';

interface VideoCallModalProps {
  persona: Persona;
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

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  persona,
  devSettings,
  onEndCall,
  onOpenDevSettings
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>('connecting');
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(devSettings.subtitlesEnabled);
  const [showPromptAssistance, setShowPromptAssistance] = useState<boolean>(false);
  const [speakingState, setSpeakingState] = useState<CharacterSpeakingState>('idle');
  
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const [dialogueHistory, setDialogueHistory] = useState<CallExchange[]>([]);
  const [userTranscriptInput, setUserTranscriptInput] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  // Self video preview
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  // Initialize self camera if available
  useEffect(() => {
    let active = true;

    async function enableWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (active && userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
            userMediaStreamRef.current = stream;
          }
        }
      } catch (err) {
        setCameraError(true);
      }
    }

    if (isVideoOn) {
      enableWebcam();
    }

    return () => {
      active = false;
      if (userMediaStreamRef.current) {
        userMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoOn]);

  // Connect call audio & lifecycle
  useEffect(() => {
    speechService.playRingtoneBurst();
    const ringInterval = setInterval(() => {
      speechService.playRingtoneBurst();
    }, 2400);

    const connectTimeout = setTimeout(() => {
      clearInterval(ringInterval);
      setCallStatus('connected');

      timerRef.current = window.setInterval(() => {
        setCallDurationSec(prev => prev + 1);
      }, 1000);

      // Start with persona greeting
      handlePersonaSpeak(
        persona.sampleAudioText,
        `Hello! Welcome to ${persona.city}. Ready for our Italian video conversation?`
      );
    }, 1800);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      speechService.stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      if (userMediaStreamRef.current) {
        userMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [persona]);

  // Speech recognition for mic
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
        translation: 'Studente (voce)',
        timestamp: formatDuration(callDurationSec)
      }
    ]);

    setUserTranscriptInput('');
    setSpeakingState('thinking');

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
      // Fallback
    }

    const reply = generateCallFallback(persona, spokenText);
    handlePersonaSpeak(reply.it, reply.en);
  };

  const handleHangup = () => {
    speechService.stopSpeaking();
    speechService.playHangupTone();
    if (timerRef.current) clearInterval(timerRef.current);
    if (userMediaStreamRef.current) {
      userMediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/70 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      
      {/* Video Call Shell with Smooth Purple & Italian Tricolore Theme */}
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[820px] bg-slate-950 border border-purple-500/30 rounded-[36px] overflow-hidden flex flex-col shadow-2xl text-white">
        
        {/* Italian Flag Tricolore Ribbon across top header */}
        <div className="h-1.5 w-full flex">
          <span className="w-1/3 bg-emerald-500" />
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-red-500" />
        </div>

        {/* Top Header Bar */}
        <div className="relative z-20 px-6 pt-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white font-friendly flex items-center gap-2">
                <span>Videochiamata con {persona.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/60 border border-purple-400/40 text-purple-200 font-sans">
                  {callStatus === 'connecting' ? 'Connessione...' : formatDuration(callDurationSec)}
                </span>
              </span>
              <span className="text-[11px] text-purple-200/70">
                {persona.city} · {persona.levelLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDevSettings}
              className="text-xs px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition-colors font-medium"
              title="Voice Lab & Parametri"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={handleHangup}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Chiudi videochiamata"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Video Call Stage */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          
          {/* Animated Atmospheric Glow */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 40%, #7c3aed, transparent 70%)`
            }}
          />

          {/* Large Video Persona Avatar / Sound Visualizer */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <PersonaBadge
              persona={persona}
              size="call"
              speakingState={speakingState}
              className="shadow-2xl shadow-purple-900/40"
            />

            <h3 className="text-2xl font-bold font-friendly text-white mt-4">
              {persona.fullName}
            </h3>
            <p className="text-xs text-purple-200 mt-0.5">
              {persona.role} · {persona.city}
            </p>

            {/* Audio Waveform */}
            <div className="mt-4 flex items-center gap-1.5">
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-1' : 'bg-purple-800/80 h-2'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-2' : 'bg-purple-800/80 h-3'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-3' : 'bg-purple-800/80 h-1.5'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-4' : 'bg-purple-800/80 h-4'}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-5' : 'bg-purple-800/80 h-2'}`} />
            </div>

            {/* Speaking Status Text */}
            <div className="mt-2 text-xs font-medium">
              {speakingState === 'speaking' ? (
                <span className="text-purple-300 font-semibold flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  {persona.name} sta parlando...
                </span>
              ) : speakingState === 'listening' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ti ascolto... Parla pure al microfono!
                </span>
              ) : speakingState === 'thinking' ? (
                <span className="text-amber-300 font-semibold">
                  Elaborazione risposta con Gemini AI...
                </span>
              ) : (
                <span className="text-purple-300/70">Video & Audio HD Connessi</span>
              )}
            </div>
          </div>

          {/* Picture-in-Picture: Student Self-View Window */}
          <div className="absolute bottom-4 right-4 z-20 w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-500/50 shadow-xl flex items-center justify-center">
            {isVideoOn && !cameraError ? (
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <VideoOff className="w-6 h-6 mb-1 text-purple-400" />
                <span className="text-[10px] font-medium">Videocamera disattivata</span>
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
              Tu
            </div>
          </div>

          {/* Real-time Subtitles / Captions */}
          {showSubtitles && (
            <div className="w-full max-w-lg bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3.5 my-2 text-left shadow-lg">
              <div className="flex items-center justify-between text-[10px] text-purple-300 pb-1 mb-1 border-b border-purple-500/20">
                <span className="flex items-center gap-1 font-semibold text-purple-300">
                  <Subtitles className="w-3.5 h-3.5 text-purple-400" /> Sottotitoli Live
                </span>
                <span className="italic">{speakingState === 'speaking' ? `${persona.name}` : 'Tu'}</span>
              </div>
              <p className="text-sm font-medium text-white leading-snug">
                {currentSpeechText || (isRecognizing ? (userTranscriptInput || 'Parla pure al microfono...') : 'In attesa...')}
              </p>
              {currentTranslation && (
                <p className="text-xs text-purple-200/80 mt-1 italic border-t border-purple-500/20 pt-1">
                  &ldquo;{currentTranslation}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Speaking Practice Suggestions */}
          {showPromptAssistance && (
            <div className="w-full max-w-lg bg-purple-950/95 border border-purple-400/40 rounded-2xl p-3.5 my-1 text-left text-xs shadow-xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-300" /> Spunti per la conversazione:
                </span>
                <button
                  onClick={() => setShowPromptAssistance(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {ITALIAN_PRACTICE_PHRASES.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserReply(item.it)}
                    className="w-full text-left p-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 border border-purple-500/30 transition-colors block"
                  >
                    <div className="font-medium text-purple-200">{item.it}</div>
                    <div className="text-[10px] text-purple-300/80 italic">{item.en}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Mic Speech Input */}
          <div className="w-full max-w-md mt-1 flex items-center gap-2">
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
              className="flex-1 bg-black/50 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400"
            />
            {userTranscriptInput.trim() && (
              <button
                onClick={() => handleUserReply(userTranscriptInput)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-md"
              >
                Invia
              </button>
            )}
          </div>

        </div>

        {/* Video Call Controls Bar */}
        <div className="relative z-20 bg-slate-900/90 border-t border-purple-500/20 px-6 py-4">
          
          <div className="flex items-center justify-around mb-3 text-slate-300">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showSubtitles ? 'text-purple-300 font-semibold' : 'hover:text-white'
              }`}
              title="Attiva/Disattiva Sottotitoli"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showSubtitles ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-slate-800 border-slate-700'
              }`}>
                <Subtitles className="w-4 h-4" />
              </div>
              <span>Sottotitoli</span>
            </button>

            <button
              onClick={() => setShowPromptAssistance(!showPromptAssistance)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showPromptAssistance ? 'text-purple-300 font-semibold' : 'hover:text-white'
              }`}
              title="Suggerimenti frasi in italiano"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showPromptAssistance ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-slate-800 border-slate-700'
              }`}>
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>Cosa dire</span>
            </button>
          </div>

          {/* Primary Video Call Controls */}
          <div className="flex items-center justify-center gap-5 sm:gap-6">
            
            {/* 1. MUTE / UNMUTE MICROPHONE */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                isMuted
                  ? 'bg-red-500/20 border-red-400 text-red-400'
                  : 'bg-purple-900/60 border-purple-400/40 text-purple-100 hover:bg-purple-800'
              }`}
              title={isMuted ? 'Riattiva microfono' : 'Disattiva microfono'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isMuted ? 'Muto' : 'Microfono'}</span>
            </button>

            {/* 2. CAMERA VIDEO TOGGLE */}
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                !isVideoOn
                  ? 'bg-red-500/20 border-red-400 text-red-400'
                  : 'bg-purple-600 border-purple-300 text-white hover:bg-purple-500 shadow-purple-600/40'
              }`}
              title={isVideoOn ? 'Disattiva videocamera' : 'Attiva videocamera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isVideoOn ? 'Video ON' : 'Video OFF'}</span>
            </button>

            {/* 3. SPEAKER TOGGLE */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                !isSpeakerOn
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-purple-900/60 border-purple-400/40 text-purple-100 hover:bg-purple-800'
              }`}
              title={isSpeakerOn ? 'Disattiva audio' : 'Attiva audio'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isSpeakerOn ? 'Audio ON' : 'Audio OFF'}</span>
            </button>

            {/* 4. END VIDEO CALL */}
            <button
              onClick={handleHangup}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-lg shadow-red-600/40 border-2 border-white"
              title="Termina Videochiamata"
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
        it: 'Ti vedo e ti sento benissimo! A Firenze diciamo "Un espresso macchiato caldo, per favore". Prova a ripeterlo guardandomi!',
        en: 'I see and hear you very well! In Florence we say "A warm espresso macchiato, please". Try repeating it looking at me!'
      };
    }
    return {
      it: 'Ottima intonazione in video! Hai usato una bellissima espressione. Vuoi provare a chiedermi come descrivere una tipica colazione?',
      en: 'Great intonation on video! You used a wonderful expression. Want to try asking me how to describe a typical breakfast?'
    };
  }

  if (persona.id === 'sofia') {
    return {
      it: 'Bravissimo! A Roma apprezziamo tanto chi parla con questa naturalezza. La tua pronuncia in videochiamata è davvero espressiva!',
      en: 'Well done! In Rome we really appreciate someone who speaks with this natural ease. Your pronunciation on video call is truly expressive!'
    };
  }

  return {
    it: 'Molto bene! Ricordati di scandire bene le vocali finali. In videochiamata stai migliorando tantissimo!',
    en: 'Very good! Remember to enunciate ending vowels well. On video call you are improving so much!'
  };
}
