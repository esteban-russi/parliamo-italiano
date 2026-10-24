/**
 * Speech Service supporting real server-side Gemini 3.8 Flash TTS audio and fallback browser Web Speech API
 */

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
   * Play real server-side Gemini TTS audio (WAV 24kHz)
   */
  public async speakWithGemini(
    text: string,
    options: {
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ): Promise<boolean> {
    this.stopSpeaking();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: options.voiceName || 'Fenrir'
        })
      });

      if (!res.ok) {
        throw new Error(`TTS server returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('No audio payload received');
      }

      const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
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
      console.warn('Real Gemini TTS server failed, falling back to browser synthesis:', err);
      if (options.onError) options.onError();
      return false;
    }
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
      gender?: 'male' | 'female';
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): Promise<void> {
    if (options.provider === 'gemini_live') {
      const success = await this.speakWithGemini(text, {
        voiceName: options.voiceName,
        onStart: options.onStart,
        onEnd: options.onEnd,
        onError: () => {
          // Fallback to browser
          this.speakItalian(text, options);
        }
      });

      if (!success) {
        this.speakItalian(text, options);
      }
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
