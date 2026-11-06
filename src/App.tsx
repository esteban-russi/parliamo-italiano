import React, { useState } from 'react';
import { EMMANUELE, INITIAL_MESSAGES } from './data/personas';
import { Persona, ChatMessage, DevSettings } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VideoCallModal } from './components/VideoCallModal';
import { DevSettingsDrawer } from './components/DevSettingsDrawer';
import { PersonaProfileModal } from './components/PersonaProfileModal';
import { speechService } from './utils/speech';

export default function App() {
  // Single tutor for now: Emmanuele the Roman
  const selectedPersona = EMMANUELE;
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    [EMMANUELE.id]: INITIAL_MESSAGES
  });
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  
  // Video Call State (Video-only as requested)
  const [activeVideoCallPersona, setActiveVideoCallPersona] = useState<Persona | null>(null);

  // Modals & Drawers
  const [isDevLabOpen, setIsDevLabOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Experimental Dev Settings (Defaulting to real Gemini Live server TTS)
  const [devSettings, setDevSettings] = useState<DevSettings>({
    voiceProvider: 'gemini_live',
    voiceId: EMMANUELE.voiceId,
    temperature: 0.7,
    speechRate: 0.95,
    audioSamplingRate: '24kHz',
    latencyMode: 'turbo',
    grammarStrictness: 'tutor',
    regionalSlangLevel: 'subtle',
    subtitlesEnabled: true,
    autoPlayAudio: false,
    customSystemPrompt: '',
    apiMockLatencyMs: 200
  });

  const activeMessages = messagesMap[selectedPersona.id] || [];

  // Handle student sending message in chat with real server Gemini API integration
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      personaId: selectedPersona.id,
      text,
      translation: 'Message sent by student',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...activeMessages, userMsg];
    setMessagesMap(prev => ({
      ...prev,
      [selectedPersona.id]: updated
    }));

    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaPrompt: selectedPersona.personaPrompt,
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
            personaId: selectedPersona.id,
            text: data.text,
            translation: data.translation || '',
            grammarNotes: data.grammarNotes || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessagesMap(prev => ({
            ...prev,
            [selectedPersona.id]: [...(prev[selectedPersona.id] || []), aiMessage]
          }));

          if (devSettings.autoPlayAudio) {
            speechService.speakSmart(aiMessage.text, {
              provider: devSettings.voiceProvider,
              voiceName: selectedPersona.voiceId,
              gender: selectedPersona.voiceGender
            });
          }

          setIsAiGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server Gemini call error, using local fallback generator:', err);
    }

    // Local fallback generator if server is offline or quota reached
    setTimeout(() => {
      const fallbackResponse = generatePersonaFallbackMessage(selectedPersona, text);
      
      setMessagesMap(prev => ({
        ...prev,
        [selectedPersona.id]: [...(prev[selectedPersona.id] || []), fallbackResponse]
      }));

      if (devSettings.autoPlayAudio) {
        speechService.speakSmart(fallbackResponse.text, {
          provider: devSettings.voiceProvider,
          voiceName: selectedPersona.voiceId,
          gender: selectedPersona.voiceGender
        });
      }

      setIsAiGenerating(false);
    }, 500);
  };

  const handleStartVideoCall = (persona: Persona) => {
    setActiveVideoCallPersona(persona);
  };

  const handleEndVideoCall = () => {
    setActiveVideoCallPersona(null);
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink">
      
      <div className="flex h-dvh w-full overflow-hidden">
        <ChatInterface
          persona={selectedPersona}
          messages={activeMessages}
          devSettings={devSettings}
          onSendMessage={handleSendMessage}
          onStartVideoCall={() => handleStartVideoCall(selectedPersona)}
          onOpenPersonaDetails={() => setIsProfileModalOpen(true)}
          onOpenDevLab={() => setIsDevLabOpen(true)}
          isAiGenerating={isAiGenerating}
        />
      </div>

      {/* Dedicated Video Call Modal (Visual Video Calling with Student Camera View) */}
      {activeVideoCallPersona && (
        <VideoCallModal
          persona={activeVideoCallPersona}
          devSettings={devSettings}
          onEndCall={handleEndVideoCall}
          onOpenDevSettings={() => setIsDevLabOpen(true)}
        />
      )}

      {/* Experimental Dev Lab Drawer */}
      <DevSettingsDrawer
        isOpen={isDevLabOpen}
        onClose={() => setIsDevLabOpen(false)}
        settings={devSettings}
        onSaveSettings={(updated) => setDevSettings(updated)}
        activePersonaName={selectedPersona.fullName}
      />

      {/* Persona Cultural Details Modal */}
      <PersonaProfileModal
        persona={selectedPersona}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onStartVideoCall={() => handleStartVideoCall(selectedPersona)}
      />

    </div>
  );
}

// Fallback response generator if Gemini network is temporarily suspended
function generatePersonaFallbackMessage(persona: Persona, userText: string): ChatMessage {
  const lower = userText.toLowerCase();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const base = { id: `b-${Date.now()}`, sender: 'persona' as const, personaId: persona.id, timestamp: time };

  if (lower.includes('lavoro') || lower.includes('ufficio') || lower.includes('lavori')) {
    return {
      ...base,
      text: 'Interessante! E ti piace il tuo lavoro?',
      translation: 'Interesting! And do you like your job?',
      grammarNotes: [
        {
          wordOrPhrase: 'ti piace',
          explanation: 'Literally "is it pleasing to you". Use piace for one thing, piacciono for several.',
          category: 'grammar'
        }
      ]
    };
  }

  return {
    ...base,
    text: 'Bravo! Parli già molto bene. Raccontami: cosa fai di solito nel fine settimana?',
    translation: 'Well done! You already speak very well. Tell me: what do you usually do at the weekend?',
    grammarNotes: [
      {
        wordOrPhrase: 'di solito',
        explanation: 'Means "usually". It goes before or after the verb: "di solito vado", "vado di solito".',
        category: 'vocabulary'
      }
    ]
  };
}
