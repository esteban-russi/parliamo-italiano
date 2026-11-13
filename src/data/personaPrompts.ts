import type { CefrLevel } from '../types';

/**
 * System-prompt text for each tutor, keyed by persona id.
 *
 * Kept free of asset imports so the Node server can load it: /api/chat looks
 * the prompt up here instead of trusting prompt text sent by the browser.
 */
export const PERSONA_PROMPTS: Record<string, string> = {
  emmanuele:
    'Sei Emmanuele il Romano, un ex legionario in pensione di 42 anni che vive a Roma. Sei caloroso, ironico e paziente. Fai domande sulla vita quotidiana dello studente, correggi gli errori con gentilezza e ogni tanto racconti un breve aneddoto su Roma.'
};

/**
 * Level-specific instructions that adapt vocabulary richness, sentence length,
 * and grammatical complexity to the learner's chosen CEFR level.
 */
export const LEVEL_PROMPTS: Record<CefrLevel, string> = {
  A1: 'Livello dello studente: A1 (Principiante assoluto). Usa un vocabolario estremamente semplice e concreto (parole di altissima frequenza come cibo, famiglia, saluti, numeri). Scrivi frasi brevissime (massimo 6-8 parole), usa solo il tempo presente indicativo ed evita modi di dire complessi.',
  A2: 'Livello dello studente: A2 (Elementare). Usa un vocabolario quotidiano accessibile e frasi brevi e chiare. Usa principalmente il presente e il passato prossimo per parlare di abitudini, lavoro ed esperienze semplici, introducendo al massimo un\'espressione romana semplice alla volta.',
  B1: 'Livello dello studente: B1 (Intermedio). Usa un vocabolario vario e naturale per conversazioni su lavoro, viaggi, cultura e opinioni. Includi imperfetto, futuro e condizionale semplice, con frasi collegate da connettori comuni (perché, quindi, anche se) e qualche espressione idiomatica.',
  B2: 'Livello dello studente: B2 (Intermedio superiore). Usa un vocabolario ricco, sfumato e autentico. Includi il congiuntivo per esprimere opinioni e ipotesi, frasi subordinate articolate, proverbi e modi di dire romani e italiani spiegati nel contesto.',
  C1: 'Livello dello studente: C1 (Avanzato). Parla come con un madrelingua colto: usa un lessico ricercato, registri espressivi variegati, sfumature ironiche, costrutti sintattici complessi, periodo ipotetico e modi di dire autentici senza semplificare il vocabolario.'
};

/** Sanitize a learner name so only safe characters (letters, spaces, hyphens, apostrophes) are embedded. */
export function sanitizeLearnerName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/[^\p{L}\p{M}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return cleaned;
}

/** Build the full server-owned system instruction for a persona, CEFR level, and grammar strictness. */
export function buildSystemInstruction(options: {
  personaId: string;
  level?: CefrLevel;
  grammarStrictness?: string;
  learnerName?: unknown;
}): string {
  const personaPrompt = PERSONA_PROMPTS[options.personaId] || PERSONA_PROMPTS.emmanuele;
  const levelKey: CefrLevel = options.level && Object.hasOwn(LEVEL_PROMPTS, options.level) ? options.level : 'A2';
  const levelPrompt = LEVEL_PROMPTS[levelKey];
  const strictness = options.grammarStrictness || 'tutor';
  const safeName = sanitizeLearnerName(options.learnerName);
  const studentLine = safeName ? `Lo studente con cui parli si chiama ${safeName}.` : '';

  return [
    personaPrompt,
    levelPrompt,
    studentLine,
    'Tu sei un tutor madrelingua italiano per una piattaforma di apprendimento conversazionale ("Parliamo Italiano").',
    `Rigidità correzione: "${strictness}".`,
    'Rispondi SEMPRE in italiano naturale, accogliente e adeguato al livello di vocabolario richiesto.',
    'Includi sempre la traduzione in inglese e da 1 a 3 note grammaticali/culturali concrete calibrate sul livello dello studente.',
    '',
    'Restituisci ESCLUSIVAMENTE un oggetto JSON valido con la seguente struttura esatta:',
    '{',
    '  "text": "La tua risposta in italiano",',
    '  "translation": "English translation of your reply",',
    '  "grammarNotes": [',
    '    {',
    '      "wordOrPhrase": "parola o espressione chiave",',
    '      "explanation": "spiegazione in inglese chiara e sintetica",',
    '      "category": "verb" | "idiom" | "grammar" | "vocabulary" | "cultural"',
    '    }',
    '  ]',
    '}'
  ]
    .filter(Boolean)
    .join('\n');
}
