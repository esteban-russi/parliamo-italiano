import { ChatMessage, Persona } from '../types';

/**
 * Heuristic fallback dialogue generator for text chat when the server or
 * Gemini network is offline or rate-limited.
 */
export function generatePersonaFallbackMessage(persona: Persona, userText: string): ChatMessage {
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

/**
 * Heuristic fallback response for hands-free voice calls when the backend is unreachable.
 */
export function generateCallFallback(_persona: Persona, userText: string): { it: string; en: string } {
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
