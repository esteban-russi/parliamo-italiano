import React, { useState } from 'react';
import { INITIAL_PERSONAS, INITIAL_MESSAGES } from './data/personas';
import { Persona, ChatMessage, DevSettings } from './types';
import { HomePage } from './components/HomePage';
import { SocialSidebar } from './components/SocialSidebar';
import { ChatInterface } from './components/ChatInterface';
import { VideoCallModal } from './components/VideoCallModal';
import { DevSettingsDrawer } from './components/DevSettingsDrawer';
import { PersonaProfileModal } from './components/PersonaProfileModal';
import { speechService } from './utils/speech';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'studio'>('home');
  const [personas] = useState<Persona[]>(INITIAL_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(INITIAL_PERSONAS[0]);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  
  // Video Call State (Video-only as requested)
  const [activeVideoCallPersona, setActiveVideoCallPersona] = useState<Persona | null>(null);

  // Modals & Drawers
  const [isDevLabOpen, setIsDevLabOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Experimental Dev Settings (Defaulting to real Gemini Live server TTS)
  const [devSettings, setDevSettings] = useState<DevSettings>({
    voiceProvider: 'gemini_live',
    voiceId: 'Fenrir',
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
      translation: 'Messaggio inviato dallo studente',
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
    setSelectedPersona(persona);
    setActiveVideoCallPersona(persona);
  };

  const handleEndVideoCall = () => {
    setActiveVideoCallPersona(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#faf8ff] font-friendly text-purple-950">
      
      {/* View 1: Home Page */}
      {currentView === 'home' ? (
        <HomePage
          personas={personas}
          onStartChatWith={(persona) => {
            setSelectedPersona(persona);
            setCurrentView('studio');
          }}
          onStartVideoCallWith={(persona) => {
            setSelectedPersona(persona);
            setCurrentView('studio');
            setActiveVideoCallPersona(persona);
          }}
          onOpenStudio={() => setCurrentView('studio')}
          onOpenDevLab={() => setIsDevLabOpen(true)}
        />
      ) : (
        /* View 2: Studio / Social Messenger & Video Call Stage */
        <div className="flex h-screen w-screen overflow-hidden bg-[#faf8ff]">
          {/* Left Column: Social Media Contacts & Stories Feed */}
          <SocialSidebar
            personas={personas}
            selectedPersona={selectedPersona}
            onSelectPersona={(persona) => setSelectedPersona(persona)}
            onStartVideoCall={(persona) => handleStartVideoCall(persona)}
            onOpenDevLab={() => setIsDevLabOpen(true)}
            onGoHome={() => setCurrentView('home')}
          />

          {/* Middle Column: Conversational Italian Chat Interface */}
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
      )}

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

  if (persona.id === 'matteo') {
    if (lower.includes('caffè') || lower.includes('ordinare') || lower.includes('bar')) {
      return {
        id: `b-${Date.now()}`,
        sender: 'persona',
        personaId: 'matteo',
        text: 'A Firenze diciamo: "Prendo un caffè al volo, grazie!". "Al volo" significa fare qualcosa in fretta. Vuoi provare a usarlo?',
        translation: 'In Florence we say: "I\'ll take a quick coffee on the fly, thanks!". "Al volo" means doing something quickly. Would you like to try using it?',
        grammarNotes: [
          {
            wordOrPhrase: 'Al volo',
            explanation: 'Italian idiom meaning "on the fly / quickly / in a rush".',
            category: 'idiom'
          },
          {
            wordOrPhrase: 'Prendo',
            explanation: 'Present tense of prendere (to take), used when ordering.',
            category: 'verb'
          }
        ],
        timestamp: time
      };
    }

    return {
      id: `b-${Date.now()}`,
      sender: 'persona',
      personaId: 'matteo',
      text: 'Bravissimo! Mi fa sempre piacere chiacchierare in video e chat. Ti va se ti spiego come descrivere la colazione tipica italiana?',
      translation: 'Very good! It\'s always a pleasure to chat on video and text. How about I explain how to describe a typical Italian breakfast?',
      grammarNotes: [
        {
          wordOrPhrase: 'chiacchierare',
          explanation: 'To chat / have a friendly conversation.',
          category: 'verb'
        }
      ],
      timestamp: time
    };
  }

  return {
    id: `b-${Date.now()}`,
    sender: 'persona',
    personaId: persona.id,
    text: `Che bella frase! In videochiamata ti esprimi con grande naturalezza. Come posso aiutarti oggi?`,
    translation: `What a nice sentence! On video call you express yourself with great natural ease. How can I help you today?`,
    grammarNotes: [
      {
        wordOrPhrase: 'naturalezza',
        explanation: 'Naturalness and ease in spoken expression.',
        category: 'vocabulary'
      }
    ],
    timestamp: time
  };
}
