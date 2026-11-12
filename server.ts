import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import { PERSONA_PROMPTS } from './src/data/personaPrompts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const GCP_PROJECT = process.env.GCP_PROJECT;
const GCP_REGION = process.env.GCP_REGION || 'europe-west2';

// Split models: Chat / Pedagogical Tutor vs. Audio / TTS Generation
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';

// Gemini is reachable through Vertex AI (GCP_PROJECT + ADC) or an AI Studio key
const HAS_GENAI_CREDENTIALS = Boolean(GCP_PROJECT || process.env.GEMINI_API_KEY);

// Behind a load balancer (e.g. Cloud Run) set TRUST_PROXY_HOPS=1 so req.ip is
// the client's address rather than the proxy's, or every user shares one limit.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 0);

// Every Gemini / Cloud Speech call is billed. Cap each IP before the body is
// parsed. A voice-call turn makes ~3 requests (STT, chat, TTS), so the default
// leaves room for about 20 turns a minute.
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE) || 60;
app.use(['/api/chat', '/api/tts', '/api/stt'], rateLimit({
  windowMs: 60_000,
  limit: RATE_LIMIT_PER_MINUTE,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down', fallbackToBrowser: true },
}));

// Only STT uploads base64 audio; every other route gets a small body cap.
// Registered first so the global parser below skips already-parsed bodies.
app.use('/api/stt', express.json({ limit: '25mb' }));
app.use(express.json({ limit: '1mb' }));

// Helper to create GoogleGenAI client (Vertex AI or Google AI Studio)
function createGenAiClient(preferVertex: boolean) {
  const options: Record<string, any> = {
    httpOptions: {
      headers: {
        'User-Agent': 'parliamo-italiano-gcp',
      },
    },
  };

  if (preferVertex && GCP_PROJECT) {
    options.vertexai = true;
    options.project = GCP_PROJECT;
    if (GCP_REGION && GCP_REGION !== 'global') {
      options.location = GCP_REGION;
    }
  } else if (process.env.GEMINI_API_KEY) {
    options.apiKey = process.env.GEMINI_API_KEY;
  }

  return new GoogleGenAI(options);
}

// Primary client (Vertex AI if GCP_PROJECT configured, otherwise API key)
const primaryAi = createGenAiClient(Boolean(GCP_PROJECT));
// Fallback client (Google AI Studio via GEMINI_API_KEY)
const fallbackAi = (GCP_PROJECT && process.env.GEMINI_API_KEY) ? createGenAiClient(false) : null;

// Google Cloud Text-to-Speech Client
let cloudTtsClient: TextToSpeechClient | null = null;
try {
  cloudTtsClient = new TextToSpeechClient(
    GCP_PROJECT ? { projectId: GCP_PROJECT } : {}
  );
} catch (err: any) {
  console.warn('[GCP TTS] Could not initialize TextToSpeechClient:', err.message);
}

// Google Cloud Speech-to-Text Client
let cloudSpeechClient: SpeechClient | null = null;
try {
  cloudSpeechClient = new SpeechClient(
    GCP_PROJECT ? { projectId: GCP_PROJECT } : {}
  );
} catch (err: any) {
  console.warn('[GCP STT] Could not initialize SpeechClient:', err.message);
}

// Robust execution wrapper with fallback to AI Studio if Vertex AI request fails
async function generateContentWithFallback(requestConfig: any) {
  try {
    return await primaryAi.models.generateContent(requestConfig);
  } catch (primaryErr: any) {
    if (fallbackAi) {
      console.warn('[GCP Fallback] Vertex AI request failed, retrying with Google AI Studio API key:', primaryErr.message);
      return await fallbackAi.models.generateContent(requestConfig);
    }
    throw primaryErr;
  }
}

// Health check endpoint with GCP & Model metadata
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    models: {
      chat: CHAT_MODEL,
      tts: TTS_MODEL,
    },
    gcp: {
      region: GCP_REGION,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasGcpProject: Boolean(GCP_PROJECT),
      clients: {
        vertexAi: Boolean(GCP_PROJECT),
        aiStudio: Boolean(process.env.GEMINI_API_KEY),
        cloudTts: Boolean(cloudTtsClient),
        cloudSpeech: Boolean(cloudSpeechClient),
      }
    }
  });
});

const GRAMMAR_STRICTNESS_LEVELS = ['conversational', 'tutor', 'strict'];

// Gemini Conversational Chat API with Italian pedagogical grammar analysis
app.post('/api/chat', async (req, res) => {
  try {
    const { personaId, history, userMessage, temperature = 0.7, grammarStrictness = 'tutor' } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Missing userMessage' });
    }

    // The system prompt is built only from server-owned text, so a caller
    // cannot repurpose the endpoint with their own instructions.
    const personaPrompt = typeof personaId === 'string' && Object.hasOwn(PERSONA_PROMPTS, personaId)
      ? PERSONA_PROMPTS[personaId]
      : undefined;
    if (!personaPrompt) {
      return res.status(400).json({ error: `Unknown personaId: ${String(personaId)}` });
    }
    if (!GRAMMAR_STRICTNESS_LEVELS.includes(grammarStrictness)) {
      return res.status(400).json({ error: `grammarStrictness must be one of ${GRAMMAR_STRICTNESS_LEVELS.join(', ')}` });
    }

    if (!HAS_GENAI_CREDENTIALS) {
      return res.status(503).json({
        error: 'Neither GCP_PROJECT nor GEMINI_API_KEY is configured',
        fallbackNeeded: true
      });
    }

    const systemInstruction = `
${personaPrompt}
Tu sei un tutor madrelingua italiano per una piattaforma di apprendimento conversazionale ("Parliamo Italiano").
Rigidità correzione: "${grammarStrictness}".
Rispondi SEMPRE in italiano naturale, accogliente e culturalmente autentico.
Includi sempre la traduzione in inglese e da 1 a 3 note grammaticali/culturali concrete (parole nuove, congiuntivo, modi di dire, pronuncia).

Restituisci ESCLUSIVAMENTE un oggetto JSON valido con la seguente struttura esatta:
{
  "text": "La tua risposta in italiano",
  "translation": "English translation of your reply",
  "grammarNotes": [
    {
      "wordOrPhrase": "parola o espressione chiave",
      "explanation": "spiegazione in inglese chiara e sintetica",
      "category": "verb" | "idiom" | "grammar" | "vocabulary" | "cultural"
    }
  ]
}
`.trim();

    // Map conversation history safely, skipping any malformed items
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h && typeof h === 'object' && typeof h.text === 'string' && h.text.trim().length > 0) {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await generateContentWithFallback({
      model: CHAT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0.1), 1.2),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Italian conversational response' },
            translation: { type: Type.STRING, description: 'Accurate English translation' },
            grammarNotes: {
              type: Type.ARRAY,
              description: 'Grammar and cultural notes',
              items: {
                type: Type.OBJECT,
                properties: {
                  wordOrPhrase: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['wordOrPhrase', 'explanation', 'category']
              }
            }
          },
          required: ['text', 'translation', 'grammarNotes']
        }
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    res.json(parsed);
  } catch (error: any) {
    console.error('Chat generation error:', error);
    res.status(500).json({
      error: error.message || 'Error communicating with AI model',
      fallbackNeeded: true
    });
  }
});

// Text-to-Speech (TTS) Endpoint supporting both Google Cloud TTS & Gemini Native Audio
app.post('/api/tts', async (req, res) => {
  try {
    const { 
      text, 
      voiceName = 'Fenrir', 
      provider = 'gemini_live',
      rate = 1.0, 
      pitch = 0.0,
      gender = 'male' 
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // 1. Google Cloud Text-to-Speech (Neural2 / Journey voices)
    const isCloudTtsRequested = provider === 'gcp_cloud_tts' || (typeof voiceName === 'string' && voiceName.startsWith('it-IT-'));
    if (isCloudTtsRequested && cloudTtsClient) {
      try {
        const isFemale = gender === 'female' || voiceName.includes('Neural2-A') || voiceName.includes('Journey-F');
        const targetVoice = voiceName && voiceName.startsWith('it-IT-') 
          ? voiceName 
          : (isFemale ? 'it-IT-Neural2-A' : 'it-IT-Neural2-C');

        const [gcpResponse] = await cloudTtsClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode: 'it-IT',
            name: targetVoice,
            ssmlGender: (isFemale ? 'FEMALE' : 'MALE') as any,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.min(Math.max(Number(rate) || 1.0, 0.25), 4.0),
            pitch: Math.min(Math.max(Number(pitch) || 0.0, -20.0), 20.0),
          },
        });

        if (gcpResponse.audioContent) {
          const audioBase64 = Buffer.from(gcpResponse.audioContent as Uint8Array).toString('base64');
          return res.json({
            audioBase64,
            mimeType: 'audio/mp3',
            voiceUsed: targetVoice,
            provider: 'gcp_cloud_tts'
          });
        }
      } catch (cloudErr: any) {
        console.warn('[GCP TTS] Google Cloud Text-to-Speech failed, falling back to Gemini TTS:', cloudErr.message);
      }
    }

    // 2. Gemini Native Multimodal Audio Generation
    if (!HAS_GENAI_CREDENTIALS) {
      return res.status(503).json({
        error: 'No AI credentials configured for Gemini TTS',
        fallbackToBrowser: true
      });
    }

    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    let selectedVoice = voiceName;
    if (!allowedVoices.includes(selectedVoice)) {
      selectedVoice = voiceName.includes('Kore') ? 'Kore' :
                      voiceName.includes('Puck') ? 'Puck' :
                      voiceName.includes('Charon') ? 'Charon' :
                      voiceName.includes('Zephyr') ? 'Zephyr' : 'Fenrir';
    }

    const response = await generateContentWithFallback({
      model: TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Natural and expressive native Italian conversational speaker'
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({
        error: 'No audio generated by Gemini',
        fallbackToBrowser: true
      });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceUsed: selectedVoice,
      provider: 'gemini_live'
    });
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      error: error.message || 'TTS generation failed',
      fallbackToBrowser: true
    });
  }
});

/** Strip any `data:...;base64,` prefix from an incoming base64 payload. */
export function stripBase64DataUrlPrefix(payload: string): string {
  return payload.includes(',') ? payload.split(',')[1] : payload;
}

/** Map a browser recording MIME type to a Cloud Speech-to-Text encoding, or null if unsupported. */
export function cloudSttEncodingFor(mimeType: string): 'WEBM_OPUS' | 'OGG_OPUS' | 'LINEAR16' | null {
  if (mimeType.includes('webm')) return 'WEBM_OPUS';
  if (mimeType.includes('ogg')) return 'OGG_OPUS';
  if (mimeType.includes('wav')) return 'LINEAR16';
  return null;
}

// Production-Grade Speech-to-Text (STT) Endpoint
// Dual pipeline: Google Cloud Speech-to-Text with Gemini Multimodal Audio Transcription fallback
app.post('/api/stt', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', languageCode = 'it-IT' } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    const cleanBase64 = stripBase64DataUrlPrefix(audioBase64);

    // 1. Try Google Cloud Speech-to-Text if the client is available and can decode
    // this container. Safari records audio/mp4 (AAC), which Cloud STT does not accept,
    // so those requests go straight to Gemini instead of failing a round-trip first.
    const cloudEncoding = cloudSttEncodingFor(mimeType);
    if (cloudSpeechClient && cloudEncoding) {
      try {
        const [gcpSpeechResponse] = await cloudSpeechClient.recognize({
          audio: { content: cleanBase64 },
          config: {
            languageCode,
            alternativeLanguageCodes: ['en-US'],
            enableAutomaticPunctuation: true,
            encoding: cloudEncoding,
            // WAV carries its rate in the header; browser Opus capture is 48 kHz
            ...(cloudEncoding === 'LINEAR16' ? {} : { sampleRateHertz: 48000 }),
          }
        });

        const transcript = gcpSpeechResponse.results
          ?.map((r: any) => r.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ')
          .trim();

        if (transcript) {
          return res.json({
            transcript,
            provider: 'gcp_cloud_speech'
          });
        }
      } catch (cloudSttErr: any) {
        console.warn('[GCP STT] Cloud Speech-to-Text failed, falling back to Gemini Multimodal STT:', cloudSttErr.message);
      }
    }

    // 2. Multimodal Audio Transcription via Gemini
    if (HAS_GENAI_CREDENTIALS) {
      const cleanMimeType = mimeType.split(';')[0] || 'audio/webm';
      const geminiResponse = await generateContentWithFallback({
        model: CHAT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: cleanBase64
                }
              },
              {
                text: `You are an accurate speech-to-text transcriber for a conversational Italian learning platform ("Parliamo Italiano").
Transcribe the speaker's audio verbatim. 
The student is speaking Italian (or attempting to speak Italian, with possible learner accents or brief English words).
Do NOT reply with conversation, commentary, or corrections.
Return ONLY a valid JSON object matching this schema:
{
  "transcript": "Exact transcribed speech"
}`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING, description: 'Verbatim transcribed speech' }
            },
            required: ['transcript']
          }
        }
      });

      const responseText = geminiResponse.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        transcript: parsed.transcript || '',
        provider: 'gemini_multimodal_stt'
      });
    }

    res.status(503).json({ error: 'No STT backend providers available' });
  } catch (error: any) {
    console.error('STT processing error:', error);
    res.status(500).json({
      error: error.message || 'Speech-to-text transcription failed'
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Parliamo Italiano server listening on http://localhost:${PORT}`);
    console.log(`[Config] Chat Model: ${CHAT_MODEL} | TTS Model: ${TTS_MODEL}`);
    console.log(`[Config] GCP Project: ${GCP_PROJECT || '(none - using API key)'} | Region: ${GCP_REGION}`);
  });
}

// Tests import `app` and drive it with supertest, so don't bind a port or load Vite there
if (!process.env.VITEST) {
  startServer();
}

export { app };
