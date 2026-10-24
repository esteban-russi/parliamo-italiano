import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Radio
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
  
  // Real-time speech and subtitle streaming
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [currentSubtitleTranslation, setCurrentSubtitleTranslation] = useState<string>('');
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [dialogueHistory, setDialogueHistory] = useState<CallExchange[]>([]);

  // Self webcam preview
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const isAiSpeakingRef = useRef<boolean>(false);
  const activeTranscriptRef = useRef<string>('');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      } catch {
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

  // Handle persona speaking with Gemini TTS & subtitles
  const handlePersonaSpeak = useCallback(async (text: string, translation: string) => {
    isAiSpeakingRef.current = true;
    setSpeakingState('speaking');
    setCurrentSubtitleText(text);
    setCurrentSubtitleTranslation(translation);
    setLiveUserTranscript('');
    activeTranscriptRef.current = '';

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
        onStart: () => {
          isAiSpeakingRef.current = true;
          setSpeakingState('speaking');
        },
        onEnd: () => {
          isAiSpeakingRef.current = false;
          setSpeakingState('listening');
        },
        onError: () => {
          isAiSpeakingRef.current = false;
          setSpeakingState('listening');
        }
      });
    } else {
      setTimeout(() => {
        isAiSpeakingRef.current = false;
        setSpeakingState('listening');
      }, 2500);
    }
  }, [callDurationSec, devSettings, isSpeakerOn, persona]);

  // Automated reply processing when user pauses speaking
  const processLiveUserSpeech = useCallback(async (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed || isAiSpeakingRef.current) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setSpeakingState('thinking');
    setCurrentSubtitleText(trimmed);
    setCurrentSubtitleTranslation('Student speaking in Italian...');

    setDialogueHistory(prev => [
      ...prev,
      {
        speaker: 'user',
        text: trimmed,
        translation: 'Student voice input',
        timestamp: formatDuration(callDurationSec)
      }
    ]);

    setLiveUserTranscript('');
    activeTranscriptRef.current = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPrompt: persona.personaPrompt,
          history: dialogueHistory.slice(-4),
          userMessage: trimmed,
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
    } catch (err) {
      console.warn('Live call AI reply failed, using native fallback:', err);
    }

    const fallback = generateCallFallback(persona, trimmed);
    handlePersonaSpeak(fallback.it, fallback.en);
  }, [callDurationSec, devSettings, dialogueHistory, handlePersonaSpeak, persona]);

  // Continuous hands-free live speech recognition loop
  useEffect(() => {
    if (callStatus !== 'connected' || isMuted || speakingState === 'speaking' || speakingState === 'thinking') {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isAiSpeakingRef.current) return;

        if (transcript.trim()) {
          setLiveUserTranscript(transcript);
          activeTranscriptRef.current = transcript;

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // If speech recognizer signaled final phrase or 1300ms pause of silence, automatically send speech
          const timeoutMs = isFinal ? 600 : 1300;
          silenceTimerRef.current = window.setTimeout(() => {
            if (activeTranscriptRef.current.trim() && !isAiSpeakingRef.current) {
              const toProcess = activeTranscriptRef.current;
              processLiveUserSpeech(toProcess);
            }
          }, timeoutMs);
        }
      },
      () => {
        // Recognition ended (e.g. browser silence cutoff) - restart if still connected and in listening mode
        if (callStatus === 'connected' && !isMuted && !isAiSpeakingRef.current) {
          try {
            recognizerRef.current?.start();
          } catch {
            // Ignore already started error
          }
        }
      },
      (err) => {
        console.warn('Live call recognizer notice:', err);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch {
        // Ignore
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, [callStatus, isMuted, speakingState, processLiveUserSpeech]);

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
        `Hello! Welcome to ${persona.city}. Let's chat in Italian!`
      );
    }, 1800);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      speechService.stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      if (userMediaStreamRef.current) {
        userMediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [handlePersonaSpeak, persona]);

  const handleHangup = () => {
    speechService.stopSpeaking();
    speechService.playHangupTone();
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (userMediaStreamRef.current) {
      userMediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/75 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      
      {/* Video Call Shell */}
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
                <span>Live Call with {persona.name}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-600/60 border border-purple-400/40 text-purple-200 font-mono font-bold">
                  {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDurationSec)}
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
              className="text-xs px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition-colors font-semibold"
              title="Voice Model & Server Parameters"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={handleHangup}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="End live call"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Video Call Stage */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          
          {/* Ambient Glow */}
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
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-1' : (speakingState === 'listening' ? 'bg-emerald-400 animate-pulse h-2' : 'bg-purple-800/80 h-2')}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-2' : (speakingState === 'listening' ? 'bg-emerald-400 animate-pulse h-4' : 'bg-purple-800/80 h-3')}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-3' : (speakingState === 'listening' ? 'bg-emerald-400 animate-pulse h-2' : 'bg-purple-800/80 h-1.5')}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-4' : (speakingState === 'listening' ? 'bg-emerald-400 animate-pulse h-5' : 'bg-purple-800/80 h-4')}`} />
              <span className={`w-1.5 rounded-full ${speakingState === 'speaking' ? 'bg-purple-400 animate-wave-5' : (speakingState === 'listening' ? 'bg-emerald-400 animate-pulse h-3' : 'bg-purple-800/80 h-2')}`} />
            </div>

            {/* Hands-free Voice Status Badge */}
            <div className="mt-3 text-xs font-semibold">
              {speakingState === 'speaking' ? (
                <span className="text-purple-300 flex items-center gap-2 justify-center px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                  <span>{persona.name} is speaking...</span>
                </span>
              ) : speakingState === 'listening' ? (
                <span className="text-emerald-300 flex items-center gap-2 justify-center px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 shadow-sm animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening... Speak naturally in Italian!</span>
                </span>
              ) : speakingState === 'thinking' ? (
                <span className="text-amber-300 flex items-center gap-2 justify-center px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
                  <span>Gemini AI is formulating response...</span>
                </span>
              ) : (
                <span className="text-purple-300/80 flex items-center gap-1.5 justify-center">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span>Live Voice Call Connected</span>
                </span>
              )}
            </div>

            {/* Live user transcript while speaking */}
            {liveUserTranscript && (
              <div className="mt-2 text-xs text-emerald-200 bg-emerald-950/60 px-3.5 py-1 rounded-xl border border-emerald-500/30 max-w-sm truncate animate-in fade-in">
                🎙️ You: &ldquo;{liveUserTranscript}&rdquo;
              </div>
            )}
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
                <span className="text-[10px] font-medium">Camera Disabled</span>
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-white">
              You
            </div>
          </div>

          {/* Real-time Bilingual Subtitles */}
          {showSubtitles && (
            <div className="w-full max-w-lg bg-black/75 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 my-2 text-left shadow-lg">
              <div className="flex items-center justify-between text-[10px] text-purple-300 pb-1.5 mb-1.5 border-b border-purple-500/20">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-300">
                  <Subtitles className="w-3.5 h-3.5 text-purple-400" /> Live Subtitles
                </span>
                <span className="italic font-medium">
                  {speakingState === 'speaking' ? `${persona.name}` : (speakingState === 'listening' ? 'Listening to you' : 'Processing')}
                </span>
              </div>
              <p className="text-sm font-medium text-white leading-snug">
                {currentSubtitleText || (speakingState === 'listening' ? (liveUserTranscript || 'Speak in Italian to practice...') : 'Connected')}
              </p>
              {currentSubtitleTranslation && (
                <p className="text-xs text-purple-200/80 mt-1.5 italic border-t border-purple-500/20 pt-1.5">
                  &ldquo;{currentSubtitleTranslation}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Conversation Starters Modal / Assistant */}
          {showPromptAssistance && (
            <div className="w-full max-w-lg bg-purple-950/95 border border-purple-400/40 rounded-2xl p-4 my-1 text-left text-xs shadow-xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-purple-800">
                <span className="font-bold text-purple-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-300" /> 
                  <span>Conversation ideas to say aloud:</span>
                </span>
                <button
                  onClick={() => setShowPromptAssistance(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {ITALIAN_PRACTICE_PHRASES.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowPromptAssistance(false);
                      processLiveUserSpeech(item.it);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 border border-purple-500/30 transition-colors block"
                    title="Click to simulate speaking this sentence"
                  >
                    <div className="font-semibold text-purple-200">{item.it}</div>
                    <div className="text-[11px] text-purple-300/80 italic">{item.en}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Video Call Controls Bar (Pure live call controls - no send button or text input) */}
        <div className="relative z-20 bg-slate-900/90 border-t border-purple-500/20 px-6 py-4">
          
          <div className="flex items-center justify-around mb-3 text-slate-300">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showSubtitles ? 'text-purple-300 font-semibold' : 'hover:text-white'
              }`}
              title="Toggle Live Subtitles"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showSubtitles ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-slate-800 border-slate-700'
              }`}>
                <Subtitles className="w-4 h-4" />
              </div>
              <span>Subtitles</span>
            </button>

            <button
              onClick={() => setShowPromptAssistance(!showPromptAssistance)}
              className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
                showPromptAssistance ? 'text-purple-300 font-semibold' : 'hover:text-white'
              }`}
              title="Practice Ideas"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                showPromptAssistance ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-slate-800 border-slate-700'
              }`}>
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>Ideas to Say</span>
            </button>
          </div>

          {/* Primary Live Video Call Controls */}
          <div className="flex items-center justify-center gap-5 sm:gap-6">
            
            {/* 1. MUTE / UNMUTE MICROPHONE */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                isMuted
                  ? 'bg-red-500/20 border-red-400 text-red-400'
                  : 'bg-purple-900/60 border-purple-400/40 text-purple-100 hover:bg-purple-800'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            {/* 2. CAMERA VIDEO TOGGLE */}
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                !isVideoOn
                  ? 'bg-red-500/20 border-red-400 text-red-400'
                  : 'bg-purple-600 border-purple-300 text-white hover:bg-purple-500 shadow-purple-600/40'
              }`}
              title={isVideoOn ? 'Disable camera' : 'Enable camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isVideoOn ? 'Camera ON' : 'Camera OFF'}</span>
            </button>

            {/* 3. SPEAKER AUDIO TOGGLE */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90 border shadow-md ${
                !isSpeakerOn
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-purple-900/60 border-purple-400/40 text-purple-100 hover:bg-purple-800'
              }`}
              title={isSpeakerOn ? 'Turn off speaker audio' : 'Turn on speaker audio'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[9px] mt-0.5">{isSpeakerOn ? 'Audio ON' : 'Audio OFF'}</span>
            </button>

            {/* 4. END CALL BUTTON */}
            <button
              onClick={handleHangup}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-lg shadow-red-600/40 border-2 border-white"
              title="End live video call"
            >
              <PhoneOff className="w-6 h-6" />
              <span className="text-[9px] font-semibold mt-0.5">End Call</span>
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
        it: 'Ti sento benissimo! A Firenze diciamo "Un espresso macchiato caldo, per favore". Prova a ripeterlo!',
        en: 'I hear you very well! In Florence we say "A warm espresso macchiato, please". Try repeating it!'
      };
    }
    return {
      it: 'Ottima pronuncia dal vivo! Hai un\'ottima intonazione. Vuoi provare a chiedermi della colazione tipica?',
      en: 'Great live pronunciation! You have wonderful intonation. Want to try asking about a typical breakfast?'
    };
  }

  if (persona.id === 'sofia') {
    return {
      it: 'Bravissimo! A Roma apprezziamo tanto chi parla con questa naturalezza in chiamata. Continua così!',
      en: 'Well done! In Rome we really appreciate someone who speaks with this natural ease on call. Keep going!'
    };
  }

  return {
    it: 'Molto bene! Ricordati di cantare un po\' le vocali finali. In chiamata dal vivo stai migliorando tantissimo!',
    en: 'Very good! Remember to emphasize the ending vowels. On live call you are improving so much!'
  };
}
