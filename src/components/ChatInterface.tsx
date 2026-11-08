import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Headphones, HelpCircle, Languages, Mic, Square, X } from 'lucide-react';
import { Persona, ChatMessage, DevSettings } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { ITALIAN_PRACTICE_PHRASES } from '../data/personas';
import { speechService, createSpeechRecognizer, AudioRecorder, transcribeAudioBlob } from '../utils/speech';

interface ChatInterfaceProps {
  persona: Persona;
  messages: ChatMessage[];
  devSettings: DevSettings;
  /** Ids of messages already in the notebook's saved phrases. */
  savedPhraseIds: string[];
  onSendMessage: (text: string) => void;
  onSavePhrase: (message: ChatMessage) => void;
  isAiGenerating?: boolean;
}

const ACCENTS = ['à', 'è', 'é', 'ì', 'ò', 'ù'];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  persona,
  messages,
  devSettings,
  savedPhraseIds,
  onSendMessage,
  onSavePhrase,
  isAiGenerating = false
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [hiddenTranslations, setHiddenTranslations] = useState<Set<string>>(new Set());
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [messages, isAiGenerating]);

  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      audioRecorderRef.current?.cancel();
      audioRecorderRef.current = null;
    };
  }, []);

  // Close the "Help me say it" popover on Escape or a click outside it
  useEffect(() => {
    if (!isHelpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
        inputRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setIsHelpOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [isHelpOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Insert at the caret (replacing any selection) and keep typing focus in the composer
  const insertAtCaret = (text: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? inputText.length;
    const end = input?.selectionEnd ?? inputText.length;
    setInputText(inputText.slice(0, start) + text + inputText.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  // Quick replies are whole words: pad them with spaces where needed
  const insertQuickReply = (word: string) => {
    const caret = inputRef.current?.selectionStart ?? inputText.length;
    const before = inputText.slice(0, caret);
    const after = inputText.slice(caret);
    const lead = before && !before.endsWith(' ') ? ' ' : '';
    const trail = after.startsWith(' ') ? '' : ' ';
    insertAtCaret(lead + word + trail);
  };

  const toggleTranslation = (id: string) => {
    setHiddenTranslations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePlayVoice = async (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      speechService.stopSpeaking();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(message.id);
    await speechService.speakSmart(message.text, {
      provider: devSettings.voiceProvider,
      voiceName: persona.voiceId,
      rate: devSettings.speechRate,
      gender: persona.voiceGender,
      onEnd: () => setPlayingMessageId(null),
      onError: () => setPlayingMessageId(null)
    });
  };

  const toggleMicRecording = async () => {
    if (isRecordingMic) {
      if (audioRecorderRef.current) {
        setIsTranscribing(true);
        const blob = await audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        if (blob && blob.size > 0) {
          try {
            const { transcript } = await transcribeAudioBlob(blob, 'it-IT');
            if (transcript && transcript.trim()) {
              setInputText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
            }
          } catch (err) {
            console.warn('Chat mic transcription failed:', err);
          } finally {
            setIsTranscribing(false);
          }
        } else {
          setIsTranscribing(false);
        }
      }
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      setIsRecordingMic(false);
      return;
    }

    // Start recording with Cloud STT (MediaRecorder) or Browser SpeechRecognition
    const useCloud = devSettings.sttProvider === 'production_cloud';
    if (useCloud) {
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;
      const started = await recorder.start();
      if (started) {
        setIsRecordingMic(true);
      } else {
        inputRef.current?.focus();
      }
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => setInputText(transcript),
      () => setIsRecordingMic(false),
      () => setIsRecordingMic(false)
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
      inputRef.current?.focus();
    }
  };

  const speakingId = playingMessageId;

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden border-t border-line">
      <h2 className="sr-only">Conversation with {persona.fullName}</h2>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`Messages with ${persona.name}`}
      >
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          const isPlaying = speakingId === message.id;
          const isSaved = savedPhraseIds.includes(message.id);
          const showTranslation = !!message.translation && !hiddenTranslations.has(message.id);

          if (isUser) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[70%] px-5 py-3.5 rounded-[20px] rounded-br-md bg-mint-tint text-ink">
                  <p className="font-serif text-[17px] sm:text-[19px] leading-snug">{message.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex items-start gap-3 sm:gap-4">
              <PersonaBadge persona={persona} size="sm" speakingState={isPlaying ? 'speaking' : 'idle'} className="mt-1" />
              <div className="max-w-[85%] sm:max-w-[70%] px-5 pt-4 pb-3 rounded-[20px] rounded-bl-md bg-cobalt-tint text-ink">
                <p className="font-serif text-[17px] sm:text-[19px] leading-snug">{message.text}</p>
                {showTranslation && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{message.translation}</p>
                )}

                <div className="mt-2.5 -ml-2 flex flex-wrap items-center text-sm font-medium text-cobalt">
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(message)}
                    aria-pressed={isPlaying}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-cobalt/10 transition-colors"
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> : <Headphones className="w-4 h-4" aria-hidden="true" />}
                    {isPlaying ? 'Stop' : 'Listen'}
                  </button>
                  {message.translation && (
                    <>
                      <span className="w-px h-4 bg-cobalt/25 mx-1" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => toggleTranslation(message.id)}
                        aria-pressed={showTranslation}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-cobalt/10 transition-colors"
                      >
                        <Languages className="w-4 h-4" aria-hidden="true" />
                        Translate
                      </button>
                    </>
                  )}
                  <span className="w-px h-4 bg-cobalt/25 mx-1" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => onSavePhrase(message)}
                    aria-pressed={isSaved}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-cobalt/10 transition-colors"
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" aria-hidden="true" /> : <Bookmark className="w-4 h-4" aria-hidden="true" />}
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isAiGenerating && (
          <div className="flex items-center gap-3 sm:gap-4" role="status">
            <PersonaBadge persona={persona} size="sm" speakingState="thinking" />
            <div className="px-5 py-4 rounded-[20px] rounded-bl-md bg-cobalt-tint flex items-center gap-1.5">
              <span className="sr-only">{persona.name} is typing…</span>
              <span className="w-2 h-2 rounded-full bg-cobalt/60 animate-bounce" aria-hidden="true" />
              <span className="w-2 h-2 rounded-full bg-cobalt/60 animate-bounce [animation-delay:150ms]" aria-hidden="true" />
              <span className="w-2 h-2 rounded-full bg-cobalt/60 animate-bounce [animation-delay:300ms]" aria-hidden="true" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies + composer */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-0">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-3" role="group" aria-label="Quick replies">
          {persona.quickReplies.map((word) => (
            <button
              key={word}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertQuickReply(word)}
              className="shrink-0 px-5 py-2 rounded-full bg-coral-tint border border-transparent hover:border-coral text-ink text-[15px] transition-colors"
            >
              {word}
            </button>
          ))}
        </div>

        <div ref={helpRef} className="relative">
          {isHelpOpen && (
            <div
              id="help-me-say-it"
              className="absolute bottom-full right-0 mb-3 w-[min(100%,360px)] p-4 rounded-[24px] bg-surface border border-line shadow-[0_12px_40px_rgb(27_23_37/0.12)] z-10"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold tracking-[0.06em] text-ink">TRY SAYING</p>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  aria-label="Close suggestions"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:bg-cobalt-tint"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {ITALIAN_PRACTICE_PHRASES.map((phrase) => (
                  <li key={phrase.it}>
                    <button
                      type="button"
                      onClick={() => {
                        setInputText(phrase.it);
                        setIsHelpOpen(false);
                        requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                      className="w-full text-left px-3 py-2 rounded-2xl hover:bg-cobalt-tint transition-colors"
                    >
                      <span className="block font-serif text-[15px] text-ink">{phrase.it}</span>
                      <span className="block text-xs text-ink-muted">{phrase.en}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-line flex items-center gap-1" role="group" aria-label="Accented letters">
                {ACCENTS.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertAtCaret(char)}
                    aria-label={`Insert ${char}`}
                    className="w-9 h-9 rounded-full text-ink hover:bg-cobalt-tint text-base transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full bg-surface border-[1.5px] border-line shadow-soft focus-within:border-cobalt/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={`Reply to ${persona.name} in Italian…`}
              aria-label={`Message ${persona.name} in Italian`}
              className="flex-1 min-w-0 bg-transparent py-2 text-base text-ink placeholder:text-ink/40 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              aria-expanded={isHelpOpen}
              aria-controls="help-me-say-it"
              className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-full text-sm text-ink-muted hover:text-ink hover:bg-cobalt-tint transition-colors"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Help me say it</span>
              <span className="sr-only sm:hidden">Help me say it</span>
            </button>

            <button
              type="button"
              onClick={toggleMicRecording}
              disabled={isTranscribing}
              aria-label={isTranscribing ? 'Transcribing…' : isRecordingMic ? 'Stop dictation' : 'Dictate in Italian'}
              aria-pressed={isRecordingMic}
              title={isTranscribing ? 'Transcribing speech…' : isRecordingMic ? 'Listening… click to stop' : 'Dictate in Italian'}
              className={`relative shrink-0 w-12 h-12 rounded-full ${
                isTranscribing ? 'bg-cobalt-tint text-cobalt animate-pulse' : 'bg-mint text-ink hover:bg-[#35cf8b]'
              } flex items-center justify-center transition-colors ${
                isRecordingMic ? 'ring-4 ring-mint/30' : ''
              } disabled:opacity-60`}
            >
              {isRecordingMic && <span className="absolute inset-0 rounded-full bg-mint/50 animate-ping" aria-hidden="true" />}
              <Mic className={`relative w-5 h-5 ${isTranscribing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="shrink-0 h-12 px-5 sm:px-7 rounded-full bg-cobalt hover:bg-cobalt-strong text-canvas text-base font-medium transition-colors disabled:opacity-50 disabled:hover:bg-cobalt"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
