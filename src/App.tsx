import React, { useMemo, useRef, useState } from 'react';
import { EMMANUELE, INITIAL_MESSAGES, INITIAL_SAVED_PHRASES } from './data/personas';
import { generatePersonaFallbackMessage } from './data/fallbacks';
import { ChatMessage, DevSettings, GrammarNote, Persona, SavedPhrase } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VoiceCallModal } from './components/VoiceCallModal';
import { DevSettingsDrawer } from './components/DevSettingsDrawer';
import { PersonaProfileModal } from './components/PersonaProfileModal';
import { IconRail } from './components/IconRail';
import { TopHeader } from './components/TopHeader';
import { UtilityPanel } from './components/UtilityPanel';
import { useDialog } from './hooks/useDialog';
import { speechService } from './utils/speech';

const LEARNER_INITIAL = 'E';

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export default function App() {
  // Single tutor for now: Emmanuele the Roman
  const persona = EMMANUELE;
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>(INITIAL_SAVED_PHRASES);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isCallOpen, setIsCallOpen] = useState<boolean>(false);

  // Modals & drawers
  const [isDevLabOpen, setIsDevLabOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isNotebookDrawerOpen, setIsNotebookDrawerOpen] = useState<boolean>(false);

  const notebookDrawerRef = useRef<HTMLDivElement>(null);
  const notebookHeadingRef = useRef<HTMLHeadingElement>(null);
  useDialog(notebookDrawerRef, isNotebookDrawerOpen, () => setIsNotebookDrawerOpen(false));

  // Experimental Dev Settings (Defaulting to real Gemini Live server TTS)
  const [devSettings, setDevSettings] = useState<DevSettings>({
    voiceProvider: 'gemini_live',
    voiceId: EMMANUELE.voiceId,
    sttProvider: 'production_cloud',
    temperature: 0.7,
    speechRate: 0.95,
    audioSamplingRate: '24kHz',
    grammarStrictness: 'tutor',
    subtitlesEnabled: true,
    autoPlayAudio: false,
  });

  // Latest grammar tip from the tutor, featured in the notebook
  const grammarHighlight = useMemo<GrammarNote | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const notes = messages[i].grammarNotes;
      if (messages[i].sender === 'persona' && notes && notes.length > 0) return notes[0];
    }
    return null;
  }, [messages]);

  // Share of words the learner produced in this conversation
  const talkingShare = useMemo(() => {
    let learner = 0;
    let total = 0;
    for (const m of messages) {
      const words = countWords(m.text);
      total += words;
      if (m.sender === 'user') learner += words;
    }
    return total === 0 ? 0 : Math.round((learner / total) * 100);
  }, [messages]);

  const speakIfAutoPlay = (text: string) => {
    if (!devSettings.autoPlayAudio) return;
    speechService.speakSmart(text, {
      provider: devSettings.voiceProvider,
      voiceName: persona.voiceId,
      gender: persona.voiceGender
    });
  };

  // Handle student sending message in chat with real server Gemini API integration
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      personaId: persona.id,
      text,
      translation: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: persona.id,
          history: updated.slice(-6),
          userMessage: text,
          temperature: devSettings.temperature,
          grammarStrictness: devSettings.grammarStrictness
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          const aiMessage: ChatMessage = {
            id: `b-${Date.now()}`,
            sender: 'persona',
            personaId: persona.id,
            text: data.text,
            translation: data.translation || '',
            grammarNotes: data.grammarNotes || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMessage]);
          speakIfAutoPlay(aiMessage.text);
          setIsAiGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server Gemini call error, using local fallback generator:', err);
    }

    // Local fallback generator if server is offline or quota reached
    setTimeout(() => {
      const fallbackResponse = generatePersonaFallbackMessage(persona, text);
      setMessages(prev => [...prev, fallbackResponse]);
      speakIfAutoPlay(fallbackResponse.text);
      setIsAiGenerating(false);
    }, 500);
  };

  const handleSavePhrase = (message: ChatMessage) => {
    setSavedPhrases(prev =>
      prev.some(p => p.id === message.id)
        ? prev.filter(p => p.id !== message.id)
        : [{ id: message.id, it: message.text, en: message.translation }, ...prev]
    );
  };

  const openNotebook = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      notebookHeadingRef.current?.focus();
      notebookHeadingRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      setIsNotebookDrawerOpen(true);
    }
  };

  const startCall = () => {
    setIsNotebookDrawerOpen(false);
    setIsCallOpen(true);
  };

  const panelProps = {
    persona,
    grammarHighlight,
    savedPhrases,
    talkingShare,
    onSwitchToVoice: startCall,
    onOpenProfile: () => setIsProfileModalOpen(true),
    onRemovePhrase: (id: string) => setSavedPhrases(prev => prev.filter(p => p.id !== id))
  };

  return (
    <div className="h-dvh w-full flex overflow-hidden bg-canvas text-ink">
      <IconRail
        learnerInitial={LEARNER_INITIAL}
        onOpenNotebook={openNotebook}
        onOpenVoiceLab={() => setIsDevLabOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          persona={persona}
          learnerInitial={LEARNER_INITIAL}
          mode={isCallOpen ? 'voice' : 'text'}
          onSelectVoice={startCall}
          onOpenNotebook={openNotebook}
        />

        <div className="flex-1 min-h-0 flex gap-5 lg:pr-5 lg:pb-5">
          <div id="chat" className="flex-1 min-w-0 flex">
            <ChatInterface
              persona={persona}
              messages={messages}
              devSettings={devSettings}
              savedPhraseIds={savedPhrases.map(p => p.id)}
              onSendMessage={handleSendMessage}
              onSavePhrase={handleSavePhrase}
              isAiGenerating={isAiGenerating}
            />
          </div>

          <div className="hidden lg:block w-[360px] xl:w-[380px] shrink-0">
            <UtilityPanel {...panelProps} notebookHeadingRef={notebookHeadingRef} />
          </div>
        </div>
      </div>

      {/* Notebook as a drawer below the lg breakpoint */}
      {isNotebookDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex justify-end bg-ink/30 backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) setIsNotebookDrawerOpen(false); }}
        >
          <div
            ref={notebookDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Tutor and notebook"
            tabIndex={-1}
            className="w-full max-w-[380px] h-full p-3 focus:outline-none"
          >
            <UtilityPanel {...panelProps} onClose={() => setIsNotebookDrawerOpen(false)} />
          </div>
        </div>
      )}

      {isCallOpen && (
        <VoiceCallModal
          persona={persona}
          devSettings={devSettings}
          onEndCall={() => setIsCallOpen(false)}
        />
      )}

      <DevSettingsDrawer
        isOpen={isDevLabOpen}
        onClose={() => setIsDevLabOpen(false)}
        settings={devSettings}
        onSaveSettings={(updated) => setDevSettings(updated)}
        activePersonaName={persona.fullName}
      />

      <PersonaProfileModal
        persona={persona}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onStartVideoCall={startCall}
      />
    </div>
  );
}
