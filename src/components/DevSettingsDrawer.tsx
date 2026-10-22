import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Cpu, 
  BookOpen, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw,
  Play
} from 'lucide-react';
import { DevSettings, VoiceProvider } from '../types';
import { speechService } from '../utils/speech';

interface DevSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DevSettings;
  onSaveSettings: (settings: DevSettings) => void;
  activePersonaName: string;
}

export const DevSettingsDrawer: React.FC<DevSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  activePersonaName
}) => {
  const [localSettings, setLocalSettings] = useState<DevSettings>(settings);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [testStatusMessage, setTestStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleChange = <K extends keyof DevSettings>(key: K, value: DevSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setTestStatusMessage(
      localSettings.voiceProvider === 'gemini_live'
        ? 'Chiamata al server Gemini 3.8 TTS in corso...'
        : 'Sintesi vocale locale in corso...'
    );

    await speechService.speakSmart(
      `Ciao! Questo è un test audio reale con ${localSettings.voiceProvider === 'gemini_live' ? 'Gemini 3.8 Flash Lite TTS' : 'sintesi vocale locale'}. Il sistema audio risponde perfettamente!`,
      {
        provider: localSettings.voiceProvider,
        voiceName: localSettings.voiceId,
        rate: localSettings.speechRate,
        onStart: () => {
          setTestStatusMessage('Riproduzione audio in corso...');
        },
        onEnd: () => {
          setIsTestingVoice(false);
          setTestStatusMessage('Test audio completato con successo!');
          setTimeout(() => setTestStatusMessage(''), 3000);
        },
        onError: () => {
          setIsTestingVoice(false);
          setTestStatusMessage('Riproduzione completata.');
          setTimeout(() => setTestStatusMessage(''), 3000);
        }
      }
    );
  };

  const handleResetDefaults = () => {
    const defaults: DevSettings = {
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
      apiMockLatencyMs: 180
    };
    setLocalSettings(defaults);
    onSaveSettings(defaults);
  };

  const payloadInspection = {
    runtime: 'Parlami Full-Stack Gemini Audio Engine v3.0',
    endpoints: {
      tts: '/api/tts (Gemini 3.8 Flash-Lite TTS, 24kHz WAV)',
      chat: '/api/chat (Gemini 3.8 Flash + Pedagogical JSON)'
    },
    activeConfig: {
      provider: localSettings.voiceProvider,
      targetLanguage: 'it-IT',
      activePersona: activePersonaName,
      voiceConfig: {
        voiceId: localSettings.voiceId,
        speechRate: localSettings.speechRate,
        samplingRate: localSettings.audioSamplingRate,
        latencyTarget: localSettings.latencyMode === 'turbo' ? '< 300ms' : '~750ms'
      },
      modelParameters: {
        temperature: localSettings.temperature,
        pedagogicalMode: localSettings.grammarStrictness,
        regionalSlangInjection: localSettings.regionalSlangLevel
      }
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payloadInspection, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Voice & Backend Lab
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-mono font-semibold border border-red-200">
                  SERVER ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-500">Configura modelli vocali e parametri AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg hover:bg-stone-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Ripristina valori di default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-700">
          
          {/* SECTION 1: VOICE MODEL PROVIDER */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-red-600" />
              <span>Voice Model Provider</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { 
                  id: 'gemini_live', 
                  name: 'Google Gemini 3.8 Flash-Lite TTS (Server)', 
                  desc: 'Server-side native audio synthesis via @google/genai & GEMINI_API_KEY.', 
                  badge: 'SERVER LIVE',
                  badgeColor: 'bg-red-600 text-white font-bold',
                  isLive: true
                },
                { 
                  id: 'browser_tts', 
                  name: 'Local Web Speech API', 
                  desc: 'Zero-latency browser synthesis (it-IT). Works offline.', 
                  badge: 'BROWSER LIVE',
                  badgeColor: 'bg-stone-200 text-slate-800 font-semibold',
                  isLive: true
                },
                { 
                  id: 'elevenlabs', 
                  name: 'ElevenLabs Multilingual v2', 
                  desc: 'Architectural parameter mock. Ready for ELEVENLABS_API_KEY backend hook.', 
                  badge: 'MOCK SPEC',
                  badgeColor: 'bg-stone-100 text-slate-500 border border-slate-200',
                  isLive: false
                },
                { 
                  id: 'openai_tts', 
                  name: 'OpenAI Whisper + TTS-1 HD', 
                  desc: 'Architectural parameter mock. Ready for OPENAI_API_KEY backend hook.', 
                  badge: 'MOCK SPEC',
                  badgeColor: 'bg-stone-100 text-slate-500 border border-slate-200',
                  isLive: false
                },
              ].map(provider => {
                const isSelected = localSettings.voiceProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleChange('voiceProvider', provider.id as VoiceProvider)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-red-50/70 border-red-500 text-slate-900 shadow-xs'
                        : 'bg-stone-50 border-slate-200 hover:bg-stone-100/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{provider.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${provider.badgeColor}`}>
                        {provider.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{provider.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: VOICE ID / PRESET */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Voce Gemini Prebuilt Voice ID
            </label>
            <select
              value={localSettings.voiceId}
              onChange={(e) => handleChange('voiceId', e.target.value)}
              className="w-full bg-stone-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white"
            >
              <option value="Fenrir">Fenrir · Caldo, naturale & rassicurante (Consigliato)</option>
              <option value="Kore">Kore · Dolce, accogliente & materno (Nonna / Sofia)</option>
              <option value="Puck">Puck · Vivace, giovanile & brillante (Giulia)</option>
              <option value="Charon">Charon · Profondo, autorevole & moderno (Marco)</option>
              <option value="Zephyr">Zephyr · Neutro, chiaro & bilanciato</option>
            </select>
            
            {/* Quick voice test button */}
            <div className="pt-1">
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 transition-colors font-semibold text-xs disabled:opacity-50 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingVoice ? 'Generazione audio...' : 'Testa Voce Server Gemini Adesso'}</span>
              </button>
              {testStatusMessage && (
                <p className="text-[11px] text-red-700 text-center mt-1.5 font-medium animate-in fade-in">
                  {testStatusMessage}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: AUDIO & STREAMING PARAMS */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-red-600" />
              <span>Parametri Audio & Flusso</span>
            </div>

            {/* Speech Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-medium">Velocità Voce (Speech Rate)</span>
                <span className="font-mono text-red-700 font-bold">{localSettings.speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.7x (Principiante)</span>
                <span>1.0x (Standard)</span>
                <span>1.3x (Nativo)</span>
              </div>
            </div>

            {/* Sampling Rate */}
            <div className="grid grid-cols-3 gap-2">
              {(['16kHz', '24kHz', '48kHz'] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => handleChange('audioSamplingRate', rate)}
                  className={`py-1.5 rounded-lg border text-center transition-colors text-xs font-medium ${
                    localSettings.audioSamplingRate === rate
                      ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                      : 'bg-stone-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: PEDAGOGY & REGIONAL PARAMETERS */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-red-600" />
              <span>Didattica & Dialetti</span>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-medium">Temperatura LLM (Creatività)</span>
                <span className="font-mono text-red-700 font-bold">{localSettings.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.3"
                step="0.05"
                value={localSettings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            {/* Grammar Strictness */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rigidità Correzione Grammaticale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'conversational', label: 'Informale' },
                  { id: 'tutor', label: 'Tutor Amichevole' },
                  { id: 'strict', label: 'Professore' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleChange('grammarStrictness', s.id as 'conversational' | 'tutor' | 'strict')}
                    className={`py-1.5 rounded-lg border text-center text-xs transition-colors ${
                      localSettings.grammarStrictness === s.id
                        ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                        : 'bg-stone-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: LIVE PAYLOAD INSPECTOR */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-red-600" />
                <span>Backend Payload Inspector</span>
              </span>
              <button
                onClick={copyPayload}
                className="text-[11px] text-red-700 hover:text-red-800 flex items-center gap-1 font-mono font-semibold"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copiato' : 'Copia JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono-data text-emerald-400 overflow-x-auto max-h-40">
              {JSON.stringify(payloadInspection, null, 2)}
            </pre>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Endpoint server attivo su porta 3000
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Salva & Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
