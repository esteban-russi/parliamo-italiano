import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Keyboard, Lightbulb, Mic, MicOff, PhoneOff, Repeat2, Snail, X } from 'lucide-react';
import { Persona, CharacterSpeakingState, DevSettings } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService, createSpeechRecognizer, AudioRecorder, transcribeAudioBlob } from '../utils/speech';
import { ITALIAN_PRACTICE_PHRASES } from '../data/personas';
import { useDialog } from '../hooks/useDialog';

interface VoiceCallModalProps {
  persona: Persona;
  devSettings: DevSettings;
  onEndCall: () => void;
}

interface CallExchange {
  speaker: 'user' | 'persona';
  text: string;
  translation: string;
  timestamp: string;
}

/** Hands-free voice call with Emmanuele, laid out like a phone call screen. */
export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  persona,
  devSettings,
  onEndCall
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>('connecting');
  const [callDurationSec, setCallDurationSec] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(devSettings.subtitlesEnabled);
  const [showPromptAssistance, setShowPromptAssistance] = useState<boolean>(false);
  const [speakingState, setSpeakingState] = useState<CharacterSpeakingState>('idle');
  
  // Live transcript of the learner and the call's spoken lines
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [dialogueHistory, setDialogueHistory] = useState<CallExchange[]>([]);

  // Stable references to prevent runaway effect re-triggers
  const personaRef = useRef<Persona>(persona);
  personaRef.current = persona;

  const devSettingsRef = useRef<DevSettings>(devSettings);
  devSettingsRef.current = devSettings;

  const isSlowRef = useRef<boolean>(isSlow);
  isSlowRef.current = isSlow;

  const dialogueHistoryRef = useRef<CallExchange[]>(dialogueHistory);
  dialogueHistoryRef.current = dialogueHistory;

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const greetingStartedRef = useRef<boolean>(false);
  const isAiSpeakingRef = useRef<boolean>(false);
  const activeTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  // Ref, not state: only the recorder callbacks read it, and a state value in the
  // listening effect's deps restarted the mic every time a transcription began or ended
  const isTranscribingRef = useRef(false);

  // Focus trap without Escape: hanging up stays an explicit action
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, true);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play a line in the tutor's voice, then hand the turn back to the learner
  const speakAloud = (text: string) => {
    speechService.speakSmart(text, {
      provider: devSettingsRef.current.voiceProvider,
      voiceName: personaRef.current.voiceId,
      rate: devSettingsRef.current.speechRate,
      slow: isSlowRef.current,
      gender: personaRef.current.voiceGender,
      onStart: () => {
        isAiSpeakingRef.current = true;
        setSpeakingState('speaking');
      },
      onEnd: () => {
        // Short delay so the recogniser does not pick up the speaker tail
        setTimeout(() => {
          isAiSpeakingRef.current = false;
          setSpeakingState('listening');
        }, 400);
      },
      onError: () => {
        isAiSpeakingRef.current = false;
        setSpeakingState('listening');
      }
    });
  };

  // Handle persona speaking with Gemini TTS & subtitles (stable callback)
  const handlePersonaSpeak = useCallback(async (text: string, translation: string) => {
    isAiSpeakingRef.current = true;
    setSpeakingState('speaking');
    setLiveUserTranscript('');
    activeTranscriptRef.current = '';

    // Stop recognizer and audio recorder immediately so it does not capture the AI speaker audio
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
    }
    if (audioRecorderRef.current) {
      try { audioRecorderRef.current.cancel(); } catch { /* ignore */ }
      audioRecorderRef.current = null;
    }

    const currentSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setDialogueHistory(prev => [
      ...prev,
      {
        speaker: 'persona',
        text,
        translation,
        timestamp: formatDuration(currentSec)
      }
    ]);

    speakAloud(text);
  }, []);

  // Stable ref to handlePersonaSpeak so lifecycle effect can access it without depending on it
  const handlePersonaSpeakRef = useRef(handlePersonaSpeak);
  handlePersonaSpeakRef.current = handlePersonaSpeak;

  // Automated reply processing when user pauses speaking
  const processLiveUserSpeech = useCallback(async (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed || isAiSpeakingRef.current) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop speech recognizer and audio recorder while thinking and preparing AI response
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
    }
    if (audioRecorderRef.current) {
      try { audioRecorderRef.current.cancel(); } catch { /* ignore */ }
      audioRecorderRef.current = null;
    }

    setSpeakingState('thinking');

    const currentSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setDialogueHistory(prev => [
      ...prev,
      {
        speaker: 'user',
        text: trimmed,
        translation: 'Student voice input',
        timestamp: formatDuration(currentSec)
      }
    ]);

    setLiveUserTranscript('');
    activeTranscriptRef.current = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPrompt: personaRef.current.personaPrompt,
          history: dialogueHistoryRef.current.slice(-4),
          userMessage: trimmed,
          temperature: devSettingsRef.current.temperature,
          grammarStrictness: devSettingsRef.current.grammarStrictness
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          handlePersonaSpeakRef.current(data.text, data.translation || '');
          return;
        }
      }
    } catch (err) {
      console.warn('Live call AI reply failed, using native fallback:', err);
    }

    const fallback = generateCallFallback(personaRef.current, trimmed);
    handlePersonaSpeakRef.current(fallback.it, fallback.en);
  }, []);

  // Continuous hands-free live speech recognition loop (Cloud STT / Browser STT)
  useEffect(() => {
    if (callStatus !== 'connected' || isMuted || speakingState !== 'listening') {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cancel();
        audioRecorderRef.current = null;
      }
      return;
    }

    if (isAiSpeakingRef.current) return;

    const useCloudStt = devSettingsRef.current.sttProvider === 'production_cloud';

    if (useCloudStt) {
      // Production Cloud STT pipeline with Voice Activity Detection (VAD)
      const recorder = new AudioRecorder({
        silenceThresholdMs: 1200,
        rmsThreshold: 0.02,
        onAudioLevel: (lvl) => {
          if (lvl > 0.04 && !isAiSpeakingRef.current && !isTranscribingRef.current) {
            setLiveUserTranscript((prev) => prev.startsWith('Trascrizione') ? prev : 'Ti ascolto…');
          }
        },
        onSilenceDetected: async (blob) => {
          if (isAiSpeakingRef.current) return;
          try {
            setSpeakingState('thinking');
            setLiveUserTranscript('Trascrizione vocale GCP…');
            isTranscribingRef.current = true;

            const result = await transcribeAudioBlob(blob, 'it-IT');
            const trimmed = result.transcript?.trim();

            if (trimmed && !isAiSpeakingRef.current) {
              processLiveUserSpeech(trimmed);
            } else {
              setSpeakingState('listening');
              setLiveUserTranscript('');
            }
          } catch (err) {
            console.warn('Cloud STT transcription failed:', err);
            setSpeakingState('listening');
            setLiveUserTranscript('');
          } finally {
            isTranscribingRef.current = false;
          }
        }
      });

      audioRecorderRef.current = recorder;
      recorder.start().catch(err => console.warn('Could not start AudioRecorder in call:', err));

      return () => {
        if (audioRecorderRef.current) {
          audioRecorderRef.current.cancel();
          audioRecorderRef.current = null;
        }
      };
    }

    // Client-side Web Speech API loop
    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isAiSpeakingRef.current) return;

        if (transcript.trim()) {
          setLiveUserTranscript(transcript);
          activeTranscriptRef.current = transcript;

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

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
        if (callStatus === 'connected' && !isMuted && !isAiSpeakingRef.current && speakingState === 'listening') {
          try {
            recognizerRef.current?.start();
          } catch {
            // Ignore
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

  // Connect call audio & lifecycle (Runs ONLY ONCE per call mount)
  useEffect(() => {
    startTimeRef.current = Date.now();
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

      // Start with persona greeting exactly ONCE
      if (!greetingStartedRef.current) {
        greetingStartedRef.current = true;
        handlePersonaSpeakRef.current(
          personaRef.current.sampleAudioText,
          personaRef.current.sampleAudioTranslation
        );
      }
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
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cancel();
        audioRecorderRef.current = null;
      }
    };
  }, []); // Strictly empty dependency array so the call connects once!

  const handleHangup = () => {
    speechService.stopSpeaking();
    speechService.playHangupTone();
    if (timerRef.current) clearInterval(timerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
      audioRecorderRef.current = null;
    }
    onEndCall();
  };

  // Say the tutor's last line again, without adding it to the transcript
  const handleRepeat = () => {
    const last = [...dialogueHistory].reverse().find(e => e.speaker === 'persona');
    if (!last || isAiSpeakingRef.current) return;
    isAiSpeakingRef.current = true;
    setSpeakingState('speaking');
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
    }
    if (audioRecorderRef.current) {
      try { audioRecorderRef.current.cancel(); } catch { /* ignore */ }
      audioRecorderRef.current = null;
    }
    speakAloud(last.text);
  };

  const lastPersonaLine = [...dialogueHistory].reverse().find(e => e.speaker === 'persona');
  const lastUserLine = [...dialogueHistory].reverse().find(e => e.speaker === 'user');
  const userLine = liveUserTranscript || lastUserLine?.text;

  const statusLabel =
    callStatus === 'connecting'
      ? `Calling ${persona.name}…`
      : isMuted
        ? 'Mic paused'
        : speakingState === 'speaking'
          ? `${persona.name} is speaking…`
          : speakingState === 'thinking'
            ? 'Thinking…'
            : 'Listening…';
  const waveTone = speakingState === 'speaking' ? 'bg-cobalt' : 'bg-mint';
  const isWaveActive = callStatus === 'connected' && !isMuted && speakingState !== 'thinking';

  const chip =
    'flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium whitespace-nowrap transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm sm:p-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Voice call with ${persona.fullName}`}
        tabIndex={-1}
        data-autofocus
        className="relative w-full sm:max-w-[440px] h-dvh sm:h-[92dvh] sm:max-h-[880px] bg-canvas sm:rounded-[36px] sm:border sm:border-line overflow-hidden flex flex-col text-ink shadow-[0_24px_80px_rgb(27_23_37/0.25)] focus:outline-none"
      >
        {/* Top bar */}
        <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
          <button
            type="button"
            onClick={handleHangup}
            aria-label="End call and go back to text chat"
            className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-cobalt-tint transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="px-4 py-1.5 rounded-full bg-cobalt-tint text-cobalt text-[15px] font-medium tabular-nums">
            {persona.name} · {callStatus === 'connecting' ? '…' : formatDuration(callDurationSec)}
          </span>
          <label className="justify-self-end flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
            CC
            <span className="relative inline-flex">
              <input
                type="checkbox"
                role="switch"
                checked={showSubtitles}
                onChange={() => setShowSubtitles(!showSubtitles)}
                aria-label="Captions"
                className="peer sr-only"
              />
              <span className="w-11 h-6 rounded-full bg-line peer-checked:bg-cobalt transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt" />
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        {/* Stage */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 flex flex-col">
          <div className="flex flex-col items-center pt-4">
            <PersonaBadge persona={persona} size="call" speakingState={speakingState === 'speaking' ? 'speaking' : 'idle'} />

            <div className="mt-6 flex items-center gap-3" role="status" aria-live="polite">
              <span className="flex items-center gap-[3px] h-6" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`w-1 rounded-full ${waveTone} ${isWaveActive ? `animate-wave-${n}` : 'h-1.5 opacity-50'}`}
                  />
                ))}
              </span>
              <span className="text-lg font-semibold">{statusLabel}</span>
            </div>
          </div>

          {showSubtitles && (
            <div className="mt-6 space-y-3">
              {lastPersonaLine && (
                <div className="px-5 py-4 rounded-[20px] rounded-bl-md bg-cobalt-tint">
                  <p className="font-serif text-[19px] leading-snug">{lastPersonaLine.text}</p>
                  {lastPersonaLine.translation && (
                    <p className="mt-1.5 text-[13px] text-ink-muted">{lastPersonaLine.translation}</p>
                  )}
                </div>
              )}
              {userLine && (
                <div className="ml-auto w-fit max-w-[90%] px-5 py-3 rounded-[20px] rounded-br-md bg-mint-tint">
                  <p className="font-serif text-[17px] leading-snug">{userLine}</p>
                </div>
              )}
            </div>
          )}

          {showPromptAssistance && (
            <div id="call-practice-ideas" className="mt-3 p-3 rounded-[20px] bg-surface border border-line shadow-soft">
              <div className="flex items-center justify-between px-1">
                <p className="text-[13px] font-semibold tracking-[0.06em]">TRY SAYING</p>
                <button
                  type="button"
                  onClick={() => setShowPromptAssistance(false)}
                  aria-label="Close suggestions"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:bg-cobalt-tint"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ul className="mt-1">
                {ITALIAN_PRACTICE_PHRASES.slice(0, 4).map((item) => (
                  <li key={item.it}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptAssistance(false);
                        processLiveUserSpeech(item.it);
                      }}
                      className="w-full text-left px-3 py-2 rounded-2xl hover:bg-cobalt-tint transition-colors"
                    >
                      <span className="block font-serif text-[15px]">{item.it}</span>
                      <span className="block text-xs text-ink-muted">{item.en}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Learning aids */}
        <div className="shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 pt-2 pb-5">
          <button
            type="button"
            onClick={() => setIsSlow(!isSlow)}
            aria-pressed={isSlow}
            className={`${chip} ${isSlow ? 'bg-cobalt border-cobalt text-canvas' : 'border-cobalt text-cobalt hover:bg-cobalt-tint'}`}
          >
            <Snail className="w-4 h-4" aria-hidden="true" />
            Slower
          </button>
          <button
            type="button"
            onClick={() => setShowPromptAssistance(!showPromptAssistance)}
            aria-expanded={showPromptAssistance}
            aria-controls="call-practice-ideas"
            className={`${chip} border-cobalt text-cobalt hover:bg-cobalt-tint`}
          >
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
            Help me say it
          </button>
          <button
            type="button"
            onClick={handleRepeat}
            disabled={!lastPersonaLine || speakingState === 'speaking'}
            className={`${chip} border-cobalt text-cobalt hover:bg-cobalt-tint disabled:opacity-40 disabled:hover:bg-transparent`}
          >
            <Repeat2 className="w-4 h-4" aria-hidden="true" />
            Repeat
          </button>
        </div>

        {/* Call controls */}
        <div className="shrink-0 grid grid-cols-3 items-start px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleHangup}
            className="flex flex-col items-center gap-2 text-[15px] font-medium"
          >
            <span className="mt-4 w-16 h-16 rounded-full border-[1.5px] border-ink bg-surface flex items-center justify-center hover:bg-cobalt-tint transition-colors">
              <Keyboard className="w-6 h-6" aria-hidden="true" />
            </span>
            Text
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            aria-pressed={!isMuted}
            aria-label={isMuted ? 'Turn microphone on' : 'Turn microphone off'}
            className="flex flex-col items-center gap-2 text-[15px] font-medium"
          >
            <span className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-line' : 'bg-mint/20'
            }`}>
              <span className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-surface border-[1.5px] border-ink text-ink' : 'bg-mint text-canvas'
              }`}>
                {isMuted ? <MicOff className="w-7 h-7" aria-hidden="true" /> : <Mic className="w-7 h-7" aria-hidden="true" />}
              </span>
            </span>
            <span aria-hidden="true">{isMuted ? 'Tap to talk' : 'Tap to stop'}</span>
          </button>

          <button
            type="button"
            onClick={handleHangup}
            className="flex flex-col items-center gap-2 text-[15px] font-medium"
          >
            <span className="mt-4 w-16 h-16 rounded-full bg-coral hover:bg-coral-strong text-canvas flex items-center justify-center transition-colors">
              <PhoneOff className="w-6 h-6" aria-hidden="true" />
            </span>
            End call
          </button>
        </div>
      </div>
    </div>
  );
};

function generateCallFallback(_persona: Persona, userText: string): { it: string; en: string } {
  const lower = userText.toLowerCase();

  if (lower.includes('lavoro') || lower.includes('ufficio')) {
    return {
      it: 'Ah, perfetto! Che tipo di lavoro fai?',
      en: 'Ah, great! What kind of work do you do?'
    };
  }

  return {
    it: 'Molto bene! Ti sento benissimo. Continua, raccontami ancora!',
    en: 'Very good! I can hear you perfectly. Go on, tell me more!'
  };
}
