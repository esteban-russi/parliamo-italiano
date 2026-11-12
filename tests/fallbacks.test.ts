import { describe, expect, it } from 'vitest';
import { generatePersonaFallbackMessage, generateCallFallback } from '../src/data/fallbacks';
import { EMMANUELE } from '../src/data/personas';

describe('generatePersonaFallbackMessage', () => {
  it('generates a job-related response when keywords are matched', () => {
    const msg = generatePersonaFallbackMessage(EMMANUELE, 'Io lavoro in un ufficio');
    expect(msg.sender).toBe('persona');
    expect(msg.text).toContain('lavoro');
    expect(msg.grammarNotes).toBeDefined();
    expect(msg.grammarNotes?.[0]?.wordOrPhrase).toBe('ti piace');
  });

  it('generates a general conversation response for other inputs', () => {
    const msg = generatePersonaFallbackMessage(EMMANUELE, 'Ciao!');
    expect(msg.sender).toBe('persona');
    expect(msg.text).toContain('fine settimana');
  });
});

describe('generateCallFallback', () => {
  it('returns appropriate voice fallback based on topic', () => {
    const jobFallback = generateCallFallback(EMMANUELE, 'il mio ufficio');
    expect(jobFallback.it).toContain('Che tipo di lavoro fai?');

    const generalFallback = generateCallFallback(EMMANUELE, 'buongiorno');
    expect(generalFallback.it).toContain('Ti sento benissimo');
  });
});
