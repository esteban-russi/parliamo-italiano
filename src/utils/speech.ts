/**
 * Speech Service supporting real server-side Gemini 3.8 Flash TTS audio and fallback browser Web Speech API
 */

/** Speed multiplier used when a learner asks the tutor to speak more slowly. */
const SLOW_FACTOR = 0.8;

interface ServerTtsCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Fetch audio from /api/tts and play it. Resolves true once playback starts,
   * false if the request or playback could not start.
   */
  private async playServerTts(
    body: Record<string, unknown>,
    options: ServerTtsCallbacks & { playbackRate?: number; defaultMimeType: string }
  ): Promise<boolean> {
    this.stopSpeaking();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error(`TTS server returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('No audio payload received');
      }

      const mime = data.mimeType || options.defaultMimeType;
      const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
      audio.playbackRate = options.playbackRate ?? 1;
      this.currentAudioElement = audio;

      audio.onplay = () => {
        if (options.onStart) options.onStart();
      };

      audio.onended = () => {
        this.currentAudioElement = null;
        if (options.onEnd) options.onEnd();
      };

      audio.onerror = () => {
        this.currentAudioElement = null;
        if (options.onError) options.onError();
      };

      await audio.play();
      return true;
    } catch (err) {
      console.warn('Server TTS failed, falling back to browser synthesis:', err);
      if (options.onError) options.onError();
      return false;
    }
  }

  /**
   * Play real server-side Gemini TTS audio (WAV 24kHz)
   */
  public speakWithGemini(
    text: string,
    options: ServerTtsCallbacks & {
      voiceName?: string;
      /** Audio playback speed; 1 is natural. */
      playbackRate?: number;
    } = {}
  ): Promise<boolean> {
    return this.playServerTts(
      { text, voiceName: options.voiceName || 'Fenrir' },
      { ...options, defaultMimeType: 'audio/wav' }
    );
  }

  /**
   * Play real server-side Google Cloud Text-to-Speech audio (Neural2 / Journey)
   */
  public speakWithGcpCloudTts(
    text: string,
    options: ServerTtsCallbacks & {
      voiceName?: string;
      playbackRate?: number;
      gender?: 'male' | 'female';
    } = {}
  ): Promise<boolean> {
    return this.playServerTts(
      {
        text,
        provider: 'gcp_cloud_tts',
        voiceName: options.voiceName || 'it-IT-Neural2-C',
        gender: options.gender || 'male',
        rate: options.playbackRate ?? 1.0,
      },
      { ...options, defaultMimeType: 'audio/mp3' }
    );
  }

  /**
   * Speak Italian text using browser speech synthesis (it-IT)
   */
  public speakItalian(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      gender?: 'male' | 'female';
      onBoundary?: (charIndex: number) => void;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ): void {
    this.stopSpeaking();

    if (!this.synth) {
      if (options.onStart) options.onStart();
      setTimeout(() => {
        if (options.onEnd) options.onEnd();
      }, 1500);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || (options.gender === 'female' ? 1.05 : 0.95);

    const voices = this.synth.getVoices();
    const italianVoices = voices.filter(v => v.lang.startsWith('it'));
    if (italianVoices.length > 0) {
      const preferred = italianVoices.find(v => {
        const name = v.name.toLowerCase();
        if (options.gender === 'female') {
          return name.includes('female') || name.includes('alice') || name.includes('federica') || name.includes('elsa') || !name.includes('cosimo');
        } else {
          return name.includes('male') || name.includes('cosimo') || name.includes('diego') || name.includes('luca');
        }
      });
      utterance.voice = preferred || italianVoices[0];
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onboundary = (e) => {
      if (options.onBoundary) options.onBoundary(e.charIndex);
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      if (options.onError) options.onError();
    };

    this.synth.speak(utterance);
  }

  /**
   * Smart speech function: attempts Gemini real server TTS first if selected, then falls back cleanly
   */
  public async speakSmart(
    text: string,
    options: {
      provider: string;
      voiceName?: string;
      rate?: number;
      /** Slow the voice down for learners (Gemini audio and browser speech). */
      slow?: boolean;
      gender?: 'male' | 'female';
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): Promise<void> {
    if (options.slow) {
      options = { ...options, rate: (options.rate || 0.95) * SLOW_FACTOR };
    }

    // A failed server request can surface both as onError and as a false
    // return value; guard so the browser fallback only speaks once.
    let fellBack = false;
    const fallbackToBrowser = () => {
      if (fellBack) return;
      fellBack = true;
      this.speakItalian(text, options);
    };

    if (options.provider === 'gemini_live') {
      const success = await this.speakWithGemini(text, {
        voiceName: options.voiceName,
        playbackRate: options.slow ? SLOW_FACTOR : 1,
        onStart: options.onStart,
        onEnd: options.onEnd,
        onError: fallbackToBrowser
      });

      if (!success) fallbackToBrowser();
      return;
    }

    if (options.provider === 'gcp_cloud_tts') {
      const success = await this.speakWithGcpCloudTts(text, {
        voiceName: options.voiceName?.startsWith('it-IT-') ? options.voiceName : undefined,
        playbackRate: options.slow ? SLOW_FACTOR : (options.rate || 1.0),
        gender: options.gender,
        onStart: options.onStart,
        onEnd: options.onEnd,
        onError: fallbackToBrowser
      });

      if (!success) fallbackToBrowser();
      return;
    }

    // Default to browser
    this.speakItalian(text, options);
  }

  public stopSpeaking(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch { /* ignore */ }
      this.currentAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return Boolean(
      (this.currentAudioElement && !this.currentAudioElement.paused) ||
      (this.synth && this.synth.speaking)
    );
  }

  public playDtmfTone(key: string): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209],
      '2': [697, 1336],
      '3': [697, 1477],
      '4': [770, 1209],
      '5': [770, 1336],
      '6': [770, 1477],
      '7': [852, 1209],
      '8': [852, 1336],
      '9': [852, 1477],
      '*': [941, 1209],
      '0': [941, 1336],
      '#': [941, 1477]
    };

    const freqs = dtmfFreqs[key] || [770, 1336];

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.18);
      osc2.stop(now + 0.18);
    } catch {
      // AudioContext unavailable
    }
  }

  public playRingtoneBurst(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.setValueAtTime(0.05, now + 0.6);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } catch {
      // Ignore
    }
  }

  public playHangupTone(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(425, now);
      osc.frequency.setValueAtTime(350, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }
}

export const speechService = new SpeechService();

export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
) {
  if (typeof window === 'undefined') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let isFinalResult = false;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinalResult = true;
        }
      }
      onResult(finalTranscript, isFinalResult);
    };

    if (onEnd) recognition.onend = onEnd;
    if (onError) recognition.onerror = onError;

    return recognition;
  } catch (err) {
    console.warn('Speech recognition error:', err);
    return null;
  }
}

/**
 * Transcribe recorded audio blob via the backend /api/stt endpoint
 * Supports Google Cloud Speech-to-Text and Gemini Multimodal fallback
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  languageCode: string = 'it-IT'
): Promise<{ transcript: string; provider?: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const data = res.includes(',') ? res.split(',')[1] : res;
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const response = await fetch('/api/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || 'audio/webm',
      languageCode,
    })
  });

  if (!response.ok) {
    throw new Error(`STT request failed with status ${response.status}`);
  }

  return await response.json();
}

export interface AudioRecorderOptions {
  onAudioLevel?: (level: number) => void;
  onSilenceDetected?: (blob: Blob) => void;
  silenceThresholdMs?: number;
  rmsThreshold?: number;
}

/**
 * Cross-browser AudioRecorder using standard MediaRecorder and Web Audio API Analyser
 * Enables reliable microphone input on Chrome, Safari, Firefox, iOS and Android
 */
export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private isRecording: boolean = false;
  private hasSpoken: boolean = false;
  private lastSoundTime: number = 0;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      silenceThresholdMs: 1200,
      rmsThreshold: 0.02,
      ...options,
    };
  }

  public async start(): Promise<boolean> {
    if (this.isRecording) return true;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Find supported mimeType across browsers
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus'
      ];
      const mimeType = candidateTypes.find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || '';

      this.mediaRecorder = mimeType 
        ? new MediaRecorder(this.mediaStream, { mimeType }) 
        : new MediaRecorder(this.mediaStream);

      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Set up AudioContext Analyser for real-time visualizer & Voice Activity Detection (VAD)
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);
        this.startLevelMonitoring();
      }

      this.mediaRecorder.start(250); // Emit chunk every 250ms
      this.isRecording = true;
      this.hasSpoken = false;
      this.lastSoundTime = Date.now();
      return true;
    } catch (err) {
      console.warn('Could not start AudioRecorder:', err);
      return false;
    }
  }

  private startLevelMonitoring() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.isRecording || !this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedLevel = Math.min(avg / 128, 1);

      if (this.options.onAudioLevel) {
        this.options.onAudioLevel(normalizedLevel);
      }

      const now = Date.now();
      const threshold = this.options.rmsThreshold || 0.02;

      if (normalizedLevel > threshold) {
        this.hasSpoken = true;
        this.lastSoundTime = now;
      } else if (this.hasSpoken) {
        const silenceDuration = now - this.lastSoundTime;
        const silenceLimit = this.options.silenceThresholdMs || 1200;
        if (silenceDuration > silenceLimit) {
          this.hasSpoken = false;
          if (this.options.onSilenceDetected) {
            this.captureSnippet().then((blob) => {
              if (blob && blob.size > 0 && this.options.onSilenceDetected) {
                this.options.onSilenceDetected(blob);
              }
            });
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    this.animationFrameId = requestAnimationFrame(checkLevel);
  }

  private async captureSnippet(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.audioChunks.length === 0) return null;
    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
    const blob = new Blob([...this.audioChunks], { type: mimeType });
    this.audioChunks = [];
    return blob;
  }

  public async stop(): Promise<Blob | null> {
    if (!this.isRecording) return null;
    this.isRecording = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioCtx) {
      try { await this.audioCtx.close(); } catch { /* ignore */ }
      this.audioCtx = null;
      this.analyser = null;
    }

    return new Promise<Blob | null>((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(t => t.stop());
          this.mediaStream = null;
        }
        resolve(finalBlob);
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  }

  public cancel(): void {
    this.isRecording = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch { /* ignore */ }
      this.audioCtx = null;
      this.analyser = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch { /* ignore */ }
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.audioChunks = [];
  }
}
