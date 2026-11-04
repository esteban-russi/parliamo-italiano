import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    provider: 'gemini-3.8-flash-lite-tts',
  });
});

// Gemini Conversational Chat API with Italian pedagogical grammar analysis
app.post('/api/chat', async (req, res) => {
  try {
    const { personaPrompt, history, userMessage, temperature = 0.7, grammarStrictness = 'tutor' } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'Missing userMessage' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured',
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

    // Map conversation history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: error.message || 'Error communicating with Gemini',
      fallbackNeeded: true
    });
  }
});

// Gemini Real Text-to-Speech (TTS) Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Fenrir' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured',
        fallbackToBrowser: true
      });
    }

    // Supported Gemini 3.8 prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    let selectedVoice = voiceName;
    if (!allowedVoices.includes(selectedVoice)) {
      selectedVoice = voiceName.includes('Kore') ? 'Kore' :
                      voiceName.includes('Puck') ? 'Puck' :
                      voiceName.includes('Charon') ? 'Charon' :
                      voiceName.includes('Fenrir') ? 'Fenrir' : 'Fenrir';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
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

    // Unary output default: complete 24kHz WAV file in inlineData
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
      provider: 'gemini-3.8-flash-lite-tts'
    });
  } catch (error: any) {
    console.error('Gemini TTS error:', error);
    res.status(500).json({
      error: error.message || 'Gemini TTS generation failed',
      fallbackToBrowser: true
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
  });
}

startServer();
