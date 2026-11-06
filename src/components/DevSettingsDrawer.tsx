import React, { useRef, useState } from 'react';
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
import { useDialog } from '../hooks/useDialog';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, isOpen, onClose);

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
        ? 'Calling Gemini 3.8 TTS server...'
        : 'Local speech synthesis in progress...'
    );

    await speechService.speakSmart(
      `Ciao! Questo è un test audio con sintesi vocale ${localSettings.voiceProvider === 'gemini_live' ? 'Gemini 3.8 Flash Lite TTS' : 'locale'}. Buona conversazione!`,
      {
        provider: localSettings.voiceProvider,
        voiceName: localSettings.voiceId,
        rate: localSettings.speechRate,
        onStart: () => {
          setTestStatusMessage('Playing audio stream...');
        },
        onEnd: () => {
          setIsTestingVoice(false);
          setTestStatusMessage('Voice test completed successfully!');
          setTimeout(() => setTestStatusMessage(''), 3000);
        },
        onError: () => {
          setIsTestingVoice(false);
          setTestStatusMessage('Playback finished.');
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
    runtime: 'Parliamo Italiano Video & Audio Engine v3.2',
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
    <div className="fixed inset-0 z-50 flex justify-end bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-lab-title"
        tabIndex={-1}
        className="w-full max-w-md bg-white border-l border-purple-200 h-full flex flex-col shadow-2xl overflow-hidden focus:outline-none"
      >
        
        {/* Italian Tricolore Top Accent */}
        <div className="h-1 w-full flex">
          <span className="w-1/3 bg-emerald-500" />
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-red-500" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 id="voice-lab-title" className="text-sm font-bold text-purple-950 font-friendly tracking-tight flex items-center gap-2">
                Voice & Backend Lab
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold border border-purple-200">
                  SERVER LIVE
                </span>
              </h3>
              <p className="text-xs text-purple-600/80">Configure voice models and backend parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-xl hover:bg-purple-100 text-purple-600 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-purple-100 text-purple-600 transition-colors"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-purple-950">
          
          {/* SECTION 1: VOICE MODEL PROVIDER */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider font-friendly">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Model Provider</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { 
                  id: 'gemini_live', 
                  name: 'Google Gemini 3.8 Flash-Lite TTS (Server)', 
                  desc: 'Server-side native audio synthesis via @google/genai.', 
                  badge: 'SERVER LIVE',
                  badgeColor: 'bg-purple-600 text-white font-bold',
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
                  desc: 'Architectural parameter mock. Ready for ELEVENLABS_API_KEY.', 
                  badge: 'MOCK SPEC',
                  badgeColor: 'bg-purple-50 text-purple-600 border border-purple-200',
                  isLive: false
                },
                { 
                  id: 'openai_tts', 
                  name: 'OpenAI Whisper + TTS-1 HD', 
                  desc: 'Architectural parameter mock. Ready for OPENAI_API_KEY.', 
                  badge: 'MOCK SPEC',
                  badgeColor: 'bg-purple-50 text-purple-600 border border-purple-200',
                  isLive: false
                },
              ].map(provider => {
                const isSelected = localSettings.voiceProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleChange('voiceProvider', provider.id as VoiceProvider)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-500 text-purple-950 shadow-xs'
                        : 'bg-white border-purple-100 hover:bg-purple-50/50 text-purple-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-950">{provider.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${provider.badgeColor}`}>
                        {provider.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700/80 mt-1">{provider.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: VOICE ID / PRESET */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-purple-900 font-friendly">
              Gemini Prebuilt Voice ID
            </label>
            <select
              value={localSettings.voiceId}
              onChange={(e) => handleChange('voiceId', e.target.value)}
              className="w-full bg-purple-50/60 border border-purple-200 rounded-2xl px-3 py-2 text-xs text-purple-950 focus:outline-none focus:border-purple-600 focus:bg-white"
            >
              <option value="Fenrir">Fenrir · Warm, natural & reassuring (Recommended)</option>
              <option value="Kore">Kore · Gentle, welcoming & maternal (Nonna / Sofia)</option>
              <option value="Puck">Puck · Lively, youthful & bright (Giulia)</option>
              <option value="Charon">Charon · Deep, authoritative & modern (Marco)</option>
              <option value="Zephyr">Zephyr · Neutral, clear & balanced</option>
            </select>
            
            <div className="pt-1">
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 transition-all font-bold text-xs disabled:opacity-50 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingVoice ? 'Synthesizing audio...' : 'Test Gemini Server Voice Now'}</span>
              </button>
              {testStatusMessage && (
                <p className="text-[11px] text-purple-700 text-center mt-1.5 font-semibold animate-in fade-in">
                  {testStatusMessage}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: AUDIO & STREAMING PARAMS */}
          <div className="space-y-4 pt-2 border-t border-purple-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider font-friendly">
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Audio & Stream Parameters</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-900 font-semibold">Speech Rate</span>
                <span className="font-mono text-purple-700 font-bold">{localSettings.speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-400">
                <span>0.7x (Beginner)</span>
                <span>1.0x (Standard)</span>
                <span>1.3x (Native)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['16kHz', '24kHz', '48kHz'] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => handleChange('audioSamplingRate', rate)}
                  className={`py-1.5 rounded-xl border text-center transition-colors text-xs font-bold ${
                    localSettings.audioSamplingRate === rate
                      ? 'bg-purple-100 border-purple-400 text-purple-800'
                      : 'bg-white border-purple-100 text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: PEDAGOGY & REGIONAL PARAMETERS */}
          <div className="space-y-4 pt-2 border-t border-purple-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider font-friendly">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Pedagogy & Regional Dialects</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-900 font-semibold">LLM Temperature (Creativity)</span>
                <span className="font-mono text-purple-700 font-bold">{localSettings.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.3"
                step="0.05"
                value={localSettings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 mb-1.5 font-friendly">
                Grammar Correction Strictness
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'conversational', label: 'Casual' },
                  { id: 'tutor', label: 'Friendly Tutor' },
                  { id: 'strict', label: 'Strict Professor' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleChange('grammarStrictness', s.id as 'conversational' | 'tutor' | 'strict')}
                    className={`py-1.5 rounded-xl border text-center text-xs transition-colors font-bold ${
                      localSettings.grammarStrictness === s.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white border-purple-100 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: LIVE PAYLOAD INSPECTOR */}
          <div className="space-y-2 pt-2 border-t border-purple-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider font-friendly">
                <Terminal className="w-3.5 h-3.5 text-purple-600" />
                <span>Backend Payload Inspector</span>
              </span>
              <button
                onClick={copyPayload}
                className="text-[11px] text-purple-700 hover:text-purple-900 flex items-center gap-1 font-mono font-bold"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono-data text-emerald-400 overflow-x-auto max-h-40">
              {JSON.stringify(payloadInspection, null, 2)}
            </pre>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-purple-100 bg-[#faf8ff] flex items-center justify-between">
          <span className="text-[11px] text-purple-600 font-medium">
            Full-Stack Server active on port 3000
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs font-friendly"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
