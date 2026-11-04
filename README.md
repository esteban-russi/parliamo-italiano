# Parliamo Italiano

Learn conversational Italian by talking to people, not flashcards.

Parliamo Italiano is a web app where you practise Italian with five AI tutors, each with their own city, personality, interests and level. You can chat with them in writing or start a hands-free video call: speak into your microphone, and they answer out loud in natural Italian, with live bilingual subtitles and short grammar notes to help you learn from every reply.

## Meet the tutors

| Tutor | City | Who they are | Level | Talks about |
|---|---|---|---|---|
| **Matteo** | Firenze | Barista and foodie guide | A1-A2 | Coffee, ordering at restaurants, weather, Florence city walks |
| **Nonna Rosa** | Napoli | Master of traditional Italian cooking | A2-B1 | Family recipes, fresh pasta, childhood stories, Italian holidays |
| **Sofia** | Roma | Art historian and museum curator | B1-B2 | Art, museums, Roman architecture, Italian cinema, travel |
| **Giulia** | Bologna | Indie musician and linguistics student | B1-B2 | Indie music, everyday slang, student life, backpacking |
| **Marco** | Milano | Product designer and tech entrepreneur | B2-C1 | Work and startups, design, sustainability, aperitivo in the Navigli |

Each tutor has a hand-written persona prompt, a native saying, a sample greeting and their own Gemini voice, so conversations feel different depending on who you call.

## Features

- **Chat with a tutor.** Every reply comes in Italian with an English translation and 1 to 3 notes on vocabulary, verbs, idioms, grammar or culture.
- **Hands-free video calls.** Speech recognition (`it-IT`) listens while you talk, so there is no send button. The tutor thinks, then speaks back.
- **Live bilingual subtitles.** Follow each line of the call in Italian, with an optional English translation.
- **Natural voices.** Replies are spoken with Gemini text-to-speech. If it is unavailable, the app falls back to the browser's built-in Italian voice.
- **Adjustable tutoring.** A settings drawer lets you choose how strictly mistakes are corrected (conversational, tutor or strict), how much regional slang to use, speech rate, subtitles, auto-play and a custom system prompt.

## How it works

```
Browser (React)                         Server (Express)                Gemini
---------------                         ----------------                ------
Web Speech API  ── your speech ──▶  POST /api/chat  ──────────▶  gemini-3.8-flash
                                     (persona prompt + history,      returns JSON:
                                      correction strictness)         text, translation,
                                                                     grammarNotes
Audio player   ◀── WAV audio ────  POST /api/tts   ──────────▶  gemini-3.8-flash-lite-tts
```

The Gemini API key stays on the server. The browser only talks to `/api/chat`, `/api/tts` and `/api/health`.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion · Lucide · Express · Google Gen AI SDK (`@google/genai`) · Web Speech API

## Running locally

**Prerequisites:** Node.js 20.19+ or 22.12+ and a [Gemini API key](https://aistudio.google.com/apikey).

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your key:
   ```bash
   cp .env.example .env
   # then set GEMINI_API_KEY in .env
   ```

3. Start the dev server (Express + Vite with hot reload):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and allow microphone access when you start a call.

### Other scripts

| Command | What it does |
|---|---|
| `npm run build` | Builds the frontend into `dist/` |
| `npm start` | Serves the production build with Express |
| `npm run lint` | Type-checks the project with `tsc --noEmit` |

Speech recognition relies on the browser's Web Speech API, so voice calls work best in Chrome or Edge.

## Project structure

```
├── server.ts                  # Express server: /api/chat, /api/tts, /api/health, Vite/static serving
├── src/
│   ├── App.tsx                # App state and view routing
│   ├── components/
│   │   ├── HomePage.tsx       # Landing page and tutor gallery
│   │   ├── SocialSidebar.tsx  # Contact list of tutors
│   │   ├── ChatInterface.tsx  # Text chat with translations and grammar notes
│   │   ├── VideoCallModal.tsx # Hands-free voice/video call with subtitles
│   │   ├── DevSettingsDrawer.tsx
│   │   ├── PersonaProfileModal.tsx
│   │   └── PersonaBadge.tsx
│   ├── data/personas.ts       # Tutor personas, prompts and starter messages
│   ├── utils/speech.ts        # Gemini TTS playback, browser TTS fallback, speech recognition
│   └── types/index.ts
└── index.html
```
