import React, { useState } from 'react';
import { 
  Video, 
  MessageSquare, 
  Play, 
  Pause, 
  Sparkles, 
  MapPin, 
  Volume2, 
  Sliders, 
  Compass, 
  ArrowRight
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { speechService } from '../utils/speech';

interface HomePageProps {
  personas: Persona[];
  onStartChatWith: (persona: Persona) => void;
  onStartVideoCallWith: (persona: Persona) => void;
  onOpenStudio: () => void;
  onOpenDevLab: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  personas,
  onStartChatWith,
  onStartVideoCallWith,
  onOpenStudio,
  onOpenDevLab
}) => {
  const [playingPersonaId, setPlayingPersonaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredPersonas = personas.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'beginner') return p.cefrLevel === 'A1' || p.cefrLevel === 'A2';
    if (activeTab === 'intermediate') return p.cefrLevel === 'B1' || p.cefrLevel === 'B2';
    if (activeTab === 'advanced') return p.cefrLevel === 'C1';
    return true;
  });

  const handlePlayHeroSample = async (persona: Persona) => {
    if (playingPersonaId === persona.id) {
      speechService.stopSpeaking();
      setPlayingPersonaId(null);
      return;
    }

    setPlayingPersonaId(persona.id);
    await speechService.speakSmart(persona.sampleAudioText, {
      provider: 'gemini_live',
      voiceName: persona.voiceId,
      gender: persona.voiceGender,
      onEnd: () => setPlayingPersonaId(null),
      onError: () => setPlayingPersonaId(null)
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-purple-950 font-friendly selection:bg-purple-200 selection:text-purple-900 flex flex-col">
      
      {/* Italian Flag Tricolore Top Accent Ribbon */}
      <div className="h-1.5 w-full flex">
        <span className="w-1/3 bg-emerald-500" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-red-500" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
          
          {/* Brand Wordmark with Italian Flag Badge */}
          <a href="#hero" className="text-2xl font-bold tracking-tight text-purple-950 flex items-center gap-2.5">
            <span className="tracking-tight">Parlami</span>
            <div className="flex items-center gap-1.5 bg-purple-100/70 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold text-purple-800">
              <div className="flex h-2.5 w-4 rounded-xs overflow-hidden shadow-2xs border border-white/60">
                <span className="w-1/3 bg-emerald-500" />
                <span className="w-1/3 bg-white" />
                <span className="w-1/3 bg-red-500" />
              </div>
              <span>Italian AI</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-purple-800/80">
            <a href="#tutors" className="hover:text-purple-950 transition-colors whitespace-nowrap">
              Tutors
            </a>
            <a href="#experience" className="hover:text-purple-950 transition-colors whitespace-nowrap">
              How It Works
            </a>
          </nav>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenDevLab}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-800 bg-purple-100/70 hover:bg-purple-200/80 rounded-2xl transition-all border border-purple-200 whitespace-nowrap"
              title="Voice Model Provider & Server Gemini parameters"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={onOpenStudio}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-md shadow-purple-500/25 transition-all whitespace-nowrap flex items-center gap-2 active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Open Studio</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SHOWCASE SECTION */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-18 md:pb-24 border-b border-purple-100/80 overflow-hidden bg-gradient-to-b from-white via-[#faf7ff] to-purple-50/40">
        
        {/* Ambient Glow Accents */}
        <div className="absolute top-0 left-1/3 w-[550px] h-[320px] bg-gradient-to-r from-purple-200/35 via-violet-200/25 to-emerald-100/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[220px] bg-gradient-to-r from-rose-100/35 to-amber-100/35 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline and Call-to-Actions */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Italian Tricolore Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-purple-200 shadow-2xs text-xs font-bold text-purple-900">
                <div className="flex h-3 w-5 rounded-xs overflow-hidden shadow-2xs border border-white">
                  <span className="w-1/3 bg-emerald-500" />
                  <span className="w-1/3 bg-white" />
                  <span className="w-1/3 bg-red-500" />
                </div>
                <span className="text-emerald-700">Verde</span>
                <span className="text-slate-400">·</span>
                <span className="text-purple-800">Bianco</span>
                <span className="text-slate-400">·</span>
                <span className="text-red-600">Rosso</span>
                <span className="text-purple-300">|</span>
                <span className="text-purple-700">Authentic Conversational Italian</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-purple-950 leading-[1.12] text-balance">
                Master Italian naturally with live video calls & native AI personas.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-purple-900/80 leading-relaxed max-w-2xl font-normal">
                Hop on a real-time call with authentic Italian characters: from a Florentine barista to a friendly Nonna from Naples. Hands-free live conversation with warm neural voices and instant bilingual subtitles.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => onStartVideoCallWith(personas[0])}
                  className="px-7 py-4 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all flex items-center gap-2.5 active:scale-95"
                >
                  <Video className="w-5 h-5" />
                  <span>Start Live Call with Matteo</span>
                </button>
                <button
                  onClick={() => handlePlayHeroSample(personas[0])}
                  className="px-5 py-4 text-sm font-bold text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 rounded-2xl transition-all flex items-center gap-2 shadow-xs"
                >
                  {playingPersonaId === personas[0].id ? (
                    <Pause className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  )}
                  <span>Sample Italian Voice</span>
                </button>
              </div>

              {/* Quantitative Highlights */}
              <div className="pt-6 border-t border-purple-200/60 flex flex-wrap items-center gap-6 sm:gap-8 text-xs text-purple-800">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-950 font-mono-data">5 Cities</div>
                    <div className="text-purple-600/80 text-[11px]">Florence, Rome, Naples, Milan, Bologna</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-purple-200 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-700 font-mono-data">&lt; 300 ms</div>
                    <div className="text-purple-600/80 text-[11px]">Gemini 3.8 Neural Voice Audio</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-purple-200 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-950 font-mono-data">A1 - C1</div>
                    <div className="text-purple-600/80 text-[11px]">From Beginner to Advanced</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Video Call Card Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[36px] p-6 border-2 border-purple-200 shadow-xl shadow-purple-500/10 relative overflow-hidden">
                
                {/* Italian Flag Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                  <span className="w-1/3 bg-emerald-500" />
                  <span className="w-1/3 bg-white" />
                  <span className="w-1/3 bg-red-500" />
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-100 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-purple-950">Live Video Call Active</span>
                  </div>
                  <span className="text-[11px] font-mono-data text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                    02:15 · HD 1080p
                  </span>
                </div>

                {/* Video Avatar Showcase */}
                <div className="flex flex-col items-center text-center py-4 relative">
                  <PersonaBadge
                    persona={personas[0]}
                    size="lg"
                    speakingState={playingPersonaId === personas[0].id ? 'speaking' : 'idle'}
                  />
                  <h3 className="text-xl font-extrabold text-purple-950 mt-3 font-friendly">
                    {personas[0].fullName}
                  </h3>
                  <p className="text-xs text-purple-600 font-medium">
                    {personas[0].city} · {personas[0].role}
                  </p>

                  {/* Audio Frequency Waveform */}
                  <div className="flex items-center gap-1.5 my-3">
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-1' : 'bg-purple-200 h-2'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-2' : 'bg-purple-200 h-4'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-3' : 'bg-purple-200 h-1.5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-4' : 'bg-purple-200 h-5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-5' : 'bg-purple-200 h-3'}`} />
                  </div>

                  {/* Interactive Subtitle Box */}
                  <div className="w-full bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 text-left text-xs my-2">
                    <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Live Speech Subtitle</span>
                      <span className="text-emerald-700 font-bold">{personas[0].levelLabel}</span>
                    </div>
                    <p className="text-purple-950 font-bold leading-snug">
                      &ldquo;{personas[0].sampleAudioText}&rdquo;
                    </p>
                    <p className="text-[11px] text-purple-600/80 italic mt-1 border-t border-purple-200/60 pt-1">
                      &ldquo;Welcome to Florence! I will teach you how to order the perfect espresso at the counter!&rdquo;
                    </p>
                  </div>

                  {/* Launch Actions */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => onStartVideoCallWith(personas[0])}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Call</span>
                    </button>
                    <button
                      onClick={() => onStartChatWith(personas[0])}
                      className="py-3 px-4 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-700" />
                      <span>Open Chat</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* TUTORS DIRECTORY SECTION */}
      <section id="tutors" className="py-16 md:py-24 border-b border-purple-100/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
                <Compass className="w-4 h-4" />
                <span>Our Italian Native Tutors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-950 tracking-tight">
                Choose who you want to video call
              </h2>
              <p className="text-sm text-purple-700/80 mt-1 font-medium">
                Each character brings their regional expressions, authentic humor, and cultural warmth.
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-purple-50 rounded-2xl border border-purple-100 shrink-0 self-start md:self-auto">
              {[
                { id: 'all', label: 'All Levels' },
                { id: 'beginner', label: 'Beginner (A1-A2)' },
                { id: 'intermediate', label: 'Intermediate (B1-B2)' },
                { id: 'advanced', label: 'Advanced (C1)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonas.map(persona => {
              const isPlaying = playingPersonaId === persona.id;

              return (
                <div
                  key={persona.id}
                  className="bg-[#faf8ff] border border-purple-200/80 rounded-[32px] p-6 flex flex-col justify-between hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all group relative overflow-hidden"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <PersonaBadge
                        persona={persona}
                        size="md"
                        speakingState={isPlaying ? 'speaking' : 'idle'}
                      />
                      <span className="text-[11px] font-mono-data font-bold px-3 py-1 rounded-full bg-white text-purple-800 border border-purple-200 shadow-2xs">
                        {persona.levelLabel}
                      </span>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-xl font-extrabold text-purple-950 font-friendly group-hover:text-purple-700 transition-colors">
                      {persona.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-0.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-purple-500" />
                      <span>{persona.city}, {persona.region}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{persona.role}</span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {persona.bio}
                    </p>

                    {/* Motto */}
                    <div className="p-3.5 bg-white border border-purple-100 rounded-2xl mb-4 text-xs">
                      <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-0.5">
                        Native Motto
                      </div>
                      <div className="font-bold italic text-purple-950">
                        &ldquo;{persona.nativeSaying}&rdquo;
                      </div>
                      <div className="text-[11px] text-purple-500 italic mt-0.5">
                        {persona.nativeSayingTranslation}
                      </div>
                    </div>

                    {/* Topics tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {persona.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200 font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Strictly Video Call + Chat */}
                  <div className="pt-4 border-t border-purple-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePlayHeroSample(persona)}
                      className="p-2.5 rounded-2xl bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
                      title="Sample audio voice"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 text-purple-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Stop' : 'Voice'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartChatWith(persona)}
                        className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold transition-all"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => onStartVideoCallWith(persona)}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Call</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* HOW IT WORKS / APP EXPERIENCE SECTION */}
      <section id="experience" className="py-16 md:py-24 border-b border-purple-100/80 bg-purple-50/40">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-bold text-purple-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Conversational Method</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-950 tracking-tight">
              Built for Real-World Italian Fluency
            </h2>
            <p className="text-sm text-purple-700/80 mt-2 font-medium">
              Overcome speaking hesitation with immersive video dialogues tailored to your pace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-5">
                  01
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Hands-Free Live Voice Call
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Speak naturally into your microphone without clicking send buttons. The AI tutor listens, processes your sentence, and speaks back immediately in authentic Italian.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Continuous speech recognition</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg mb-5">
                  02
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Live Bilingual Subtitles
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Never feel lost during a call. Real-time captions display the Italian speech alongside an optional English translation, so you can follow every phrase comfortably.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-purple-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Zero speaking anxiety</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center font-bold text-lg mb-5">
                  03
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Warm Neural Gemini Audio
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Powered by Gemini 3.8 Flash-Lite 24kHz neural synthesis, responses capture authentic Italian melody, natural pauses, and native regional warmth.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-red-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>High-definition voice output</span>
              </div>
            </div>

          </div>

          {/* Quick CTA to start */}
          <div className="mt-12 text-center">
            <button
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-transform active:scale-95"
            >
              <span>Explore Tutors in Video Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* CLEAN FOOTER */}
      <footer className="py-10 bg-white mt-auto border-t border-purple-100 text-xs text-purple-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-purple-950">Parlami</span>
            <span>· Conversational Italian Learning Platform</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <button onClick={onOpenStudio} className="hover:text-purple-950 transition-colors">
              Video Studio & Chat
            </button>
            <button onClick={onOpenDevLab} className="hover:text-purple-950 transition-colors">
              Voice Model Lab
            </button>
            <a href="#hero" className="hover:text-purple-950 transition-colors">
              Back to Top
            </a>
          </div>

          <div className="text-[11px] text-purple-400">
            Italian Flag Components &bull; Google Gemini 3.8 Server TTS
          </div>
        </div>
      </footer>

    </div>
  );
};
