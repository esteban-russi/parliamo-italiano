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
  Play,
  Mic
} from 'lucide-react';
import { DevSettings, VoiceProvider, SttProvider } from '../types';
import { speechService } from '../utils/speech';
import { EMMANUELE } from '../data/personas';
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
        ? 'Calling Gemini TTS server...'
        : localSettings.voiceProvider === 'gcp_cloud_tts'
          ? 'Calling Google Cloud Text-to-Speech (Neural2)...'
          : 'Local speech synthesis in progress...'
    );

    const testText = localSettings.voiceProvider === 'gcp_cloud_tts'
      ? 'Ciao! Questo è un test audio con sintesi vocale neurale di Google Cloud. Buona conversazione!'
      : localSettings.voiceProvider === 'gemini_live'
        ? 'Ciao! Questo è un test audio con sintesi vocale Gemini. Buona conversazione!'
        : 'Ciao! Questo è un test audio con sintesi vocale locale del browser. Buona conversazione!';

    await speechService.speakSmart(
      testText,
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
          setTestStatusMessage('Voice test failed. Check the server logs.');
          setTimeout(() => setTestStatusMessage(''), 3000);
        }
      }
    );
  };

  const handleResetDefaults = () => {
    const defaults: DevSettings = {
      voiceProvider: 'gemini_live',
      voiceId: EMMANUELE.voiceId,
      sttProvider: 'production_cloud',
      temperature: 0.7,
      speechRate: 0.95,
      audioSamplingRate: '24kHz',
      grammarStrictness: 'tutor',
      subtitlesEnabled: true,
      autoPlayAudio: false,
    };
    setLocalSettings(defaults);
    onSaveSettings(defaults);
  };

  const payloadInspection = {
    runtime: 'Parliamo Italiano Video & Audio Engine v3.2',
    endpoints: {
      tts: '/api/tts (Gemini 3.8 Flash-Lite TTS, 24kHz WAV)',
      chat: '/api/chat (Gemini 2.5 Flash + Pedagogical JSON)'
    },
    activeConfig: {
      provider: localSettings.voiceProvider,
      targetLanguage: 'it-IT',
      activePersona: activePersonaName,
      voiceConfig: {
        voiceId: localSettings.voiceId,
        speechRate: localSettings.speechRate,
        samplingRate: localSettings.audioSamplingRate,
      },
      modelParameters: {
        temperature: localSettings.temperature,
        pedagogicalMode: localSettings.grammarStrictness,
      }
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payloadInspection, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-lab-title"
        tabIndex={-1}
        className="w-full max-w-md bg-surface border-l border-line sm:rounded-l-[24px] h-full flex flex-col shadow-2xl overflow-hidden focus:outline-none"
      >

        {/* Drawer Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cobalt-tint flex items-center justify-center text-cobalt">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 id="voice-lab-title" className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
                Voice & Backend Lab
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cobalt-tint text-cobalt font-mono font-bold border border-line">
                  SERVER LIVE
                </span>
              </h3>
              <p className="text-xs text-ink-muted">Configure voice models and backend parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-xl hover:bg-cobalt-tint text-cobalt transition-colors"
              title="Reset to defaults"
              aria-label="Reset settings to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-cobalt-tint text-cobalt transition-colors"
              title="Close drawer"
              aria-label="Close Voice Lab"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-ink">
          
          {/* SECTION 1: VOICE MODEL PROVIDER */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-cobalt" />
              <span>Voice Model Provider</span>
            </div>

            <div className="grid grid-cols-1 gap-2" role="group" aria-label="Voice model provider">
              {[
                { 
                  id: 'gcp_cloud_tts', 
                  name: 'Google Cloud Text-to-Speech (Neural2 / Journey)', 
                  desc: 'High-fidelity Italian neural voices via @google-cloud/text-to-speech on GCP.', 
                  badge: 'GCP CLOUD',
                  badgeColor: 'bg-emerald-600 text-white font-bold',
                  isLive: true
                },
                { 
                  id: 'gemini_live', 
                  name: 'Google Gemini Native Audio (Server)', 
                  desc: 'Server-side native audio synthesis via @google/genai.', 
                  badge: 'GEMINI AUDIO',
                  badgeColor: 'bg-cobalt text-white font-bold',
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
                  badgeColor: 'bg-cobalt-tint text-cobalt border border-line',
                  isLive: false
                },
                { 
                  id: 'openai_tts', 
                  name: 'OpenAI Whisper + TTS-1 HD', 
                  desc: 'Architectural parameter mock. Ready for OPENAI_API_KEY.', 
                  badge: 'MOCK SPEC',
                  badgeColor: 'bg-cobalt-tint text-cobalt border border-line',
                  isLive: false
                },
              ].map(provider => {
                const isSelected = localSettings.voiceProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleChange('voiceProvider', provider.id as VoiceProvider)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-cobalt-tint border-cobalt text-ink shadow-xs'
                        : 'bg-surface border-line hover:bg-cobalt-tint text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink">{provider.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${provider.badgeColor}`}>
                        {provider.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">{provider.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: VOICE ID / PRESET */}
          <div className="space-y-2">
            <label htmlFor="voice-lab-voice-id" className="block text-xs font-bold text-ink">
              {localSettings.voiceProvider === 'gcp_cloud_tts' ? 'Google Cloud Neural2 / Journey Voice' : 'Gemini Prebuilt Voice ID'}
            </label>
            <select
              id="voice-lab-voice-id"
              value={localSettings.voiceId}
              onChange={(e) => handleChange('voiceId', e.target.value)}
              className="w-full bg-cobalt-tint border border-line rounded-2xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-cobalt focus:bg-surface"
            >
              {localSettings.voiceProvider === 'gcp_cloud_tts' ? (
                <>
                  <option value="it-IT-Neural2-C">it-IT-Neural2-C · Male Native Italian (Emmanuele)</option>
                  <option value="it-IT-Neural2-A">it-IT-Neural2-A · Female Native Italian</option>
                  <option value="it-IT-Journey-D">it-IT-Journey-D · Conversational Male</option>
                  <option value="it-IT-Journey-F">it-IT-Journey-F · Conversational Female</option>
                  <option value="it-IT-Wavenet-C">it-IT-Wavenet-C · Male Classic</option>
                  <option value="it-IT-Wavenet-A">it-IT-Wavenet-A · Female Classic</option>
                </>
              ) : (
                <>
                  <option value="Charon">Charon · Deep & steady (Emmanuele)</option>
                  <option value="Fenrir">Fenrir · Warm, natural & reassuring</option>
                  <option value="Kore">Kore · Gentle & welcoming</option>
                  <option value="Puck">Puck · Lively, youthful & bright</option>
                  <option value="Zephyr">Zephyr · Neutral, clear & balanced</option>
                </>
              )}
            </select>
            
            <div className="pt-1">
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="w-full py-2.5 px-3 rounded-full bg-cobalt hover:bg-cobalt-strong text-white flex items-center justify-center gap-2 transition-all font-bold text-xs disabled:opacity-50 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingVoice ? 'Synthesizing audio...' : 'Test Gemini Server Voice Now'}</span>
              </button>
              <p className="text-[11px] text-cobalt text-center mt-1.5 font-semibold min-h-[1em] empty:mt-0" role="status">
                {testStatusMessage}
              </p>
            </div>
          </div>

          {/* SECTION 3: AUDIO & STREAMING PARAMS */}
          <div className="space-y-4 pt-2 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
              <Volume2 className="w-3.5 h-3.5 text-cobalt" />
              <span>Audio & Stream Parameters</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="voice-lab-speech-rate" className="text-ink font-semibold">Speech Rate</label>
                <span className="font-mono text-cobalt font-bold">{localSettings.speechRate.toFixed(2)}x</span>
              </div>
              <input
                id="voice-lab-speech-rate"
                type="range"
                aria-valuetext={`${localSettings.speechRate.toFixed(2)} times speed`}
                min="0.7"
                max="1.3"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
                className="w-full accent-cobalt cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-cobalt" aria-hidden="true">
                <span>0.7x (Beginner)</span>
                <span>1.0x (Standard)</span>
                <span>1.3x (Native)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Audio sampling rate">
              {(['16kHz', '24kHz', '48kHz'] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => handleChange('audioSamplingRate', rate)}
                  aria-pressed={localSettings.audioSamplingRate === rate}
                  className={`py-1.5 rounded-xl border text-center transition-colors text-xs font-bold ${
                    localSettings.audioSamplingRate === rate
                      ? 'bg-cobalt-tint border-cobalt text-cobalt'
                      : 'bg-surface border-line text-cobalt hover:bg-cobalt-tint'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION: VOICE INPUT (SPEECH-TO-TEXT) */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
              <Mic className="w-3.5 h-3.5 text-cobalt" />
              <span>Voice Input (STT) Pipeline</span>
            </div>

            <div className="grid grid-cols-1 gap-2" role="group" aria-label="Speech to text provider">
              {[
                {
                  id: 'production_cloud',
                  name: 'Cloud Voice Pipeline (Production)',
                  desc: 'Audio recorded with MediaRecorder, transcribed via GCP Speech & Gemini Multimodal. Cross-browser reliable.',
                  badge: 'PRODUCTION READY',
                  badgeColor: 'bg-cobalt text-white font-bold',
                },
                {
                  id: 'browser_web_speech',
                  name: 'Browser Web Speech API',
                  desc: 'webkitSpeechRecognition. Instant zero-server preview (Chrome/Safari desktop).',
                  badge: 'BROWSER',
                  badgeColor: 'bg-stone-200 text-slate-800 font-semibold',
                }
              ].map(stt => {
                const isSelected = localSettings.sttProvider === stt.id;
                return (
                  <button
                    key={stt.id}
                    onClick={() => handleChange('sttProvider', stt.id as SttProvider)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-cobalt-tint border-cobalt text-ink shadow-xs'
                        : 'bg-surface border-line hover:bg-cobalt-tint text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink">{stt.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${stt.badgeColor}`}>
                        {stt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">{stt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: PEDAGOGY & REGIONAL PARAMETERS */}
          <div className="space-y-4 pt-2 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-cobalt" />
              <span>Pedagogy & Regional Dialects</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="voice-lab-temperature" className="text-ink font-semibold">LLM Temperature (Creativity)</label>
                <span className="font-mono text-cobalt font-bold">{localSettings.temperature.toFixed(2)}</span>
              </div>
              <input
                id="voice-lab-temperature"
                type="range"
                min="0.1"
                max="1.3"
                step="0.05"
                value={localSettings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-cobalt cursor-pointer"
              />
            </div>

            <div>
              <div id="voice-lab-strictness" className="block text-xs font-bold text-ink mb-1.5">
                Grammar Correction Strictness
              </div>
              <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="voice-lab-strictness">
                {[
                  { id: 'conversational', label: 'Casual' },
                  { id: 'tutor', label: 'Friendly Tutor' },
                  { id: 'strict', label: 'Strict Professor' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleChange('grammarStrictness', s.id as 'conversational' | 'tutor' | 'strict')}
                    aria-pressed={localSettings.grammarStrictness === s.id}
                    className={`py-1.5 rounded-xl border text-center text-xs transition-colors font-bold ${
                      localSettings.grammarStrictness === s.id
                        ? 'bg-cobalt text-white shadow-xs'
                        : 'bg-surface border-line text-cobalt hover:bg-cobalt-tint'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: LIVE PAYLOAD INSPECTOR */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-cobalt" />
                <span>Backend Payload Inspector</span>
              </span>
              <button
                onClick={copyPayload}
                className="text-[11px] text-cobalt hover:text-ink flex items-center gap-1 font-mono font-bold"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-mint-strong" /> : <Copy className="w-3 h-3" />}
                <span aria-live="polite">{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono-data text-emerald-400 overflow-x-auto max-h-40">
              {JSON.stringify(payloadInspection, null, 2)}
            </pre>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-line bg-canvas flex items-center justify-between">
          <span className="text-[11px] text-cobalt font-medium">
            Full-Stack Server active on port 3000
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-cobalt hover:bg-cobalt-strong text-white font-bold text-xs transition-colors shadow-xs"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
