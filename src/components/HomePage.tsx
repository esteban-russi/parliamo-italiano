import React, { useState } from 'react';
import { 
  Video, 
  MessageSquare, 
  Play, 
  Pause, 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Volume2, 
  Sliders, 
  Compass, 
  ChevronRight,
  Heart,
  Smile,
  Globe2
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { CULTURAL_STORIES, ITALIAN_PRACTICE_PHRASES } from '../data/personas';
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
  const [playingPhraseIdx, setPlayingPhraseIdx] = useState<number | null>(null);
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

  const handlePlayPhrase = async (text: string, idx: number) => {
    if (playingPhraseIdx === idx) {
      speechService.stopSpeaking();
      setPlayingPhraseIdx(null);
      return;
    }

    setPlayingPhraseIdx(idx);
    await speechService.speakSmart(text, {
      provider: 'gemini_live',
      voiceName: 'Fenrir',
      onEnd: () => setPlayingPhraseIdx(null),
      onError: () => setPlayingPhraseIdx(null)
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

      {/* TOP BAR CONTRACT: [Brand Wordmark] — [Nav Links] — [Primary CTA] */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand with Italian Flag Accent */}
          <a href="#hero" className="text-2xl font-bold tracking-tight text-purple-950 flex items-center gap-2.5">
            <span className="tracking-tight">Parlami</span>
            <div className="flex items-center gap-1.5 bg-purple-100/70 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold text-purple-800">
              {/* Mini Italian Flag */}
              <div className="flex h-2.5 w-4 rounded-xs overflow-hidden shadow-2xs border border-white/60">
                <span className="w-1/3 bg-emerald-500" />
                <span className="w-1/3 bg-white" />
                <span className="w-1/3 bg-red-500" />
              </div>
              <span>Italiano AI</span>
            </div>
          </a>

          {/* Zone 2: Smooth Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-purple-800/80">
            <a href="#tutors" className="hover:text-purple-950 transition-colors whitespace-nowrap shrink-0">
              I Nostri Tutor
            </a>
            <a href="#video-metodo" className="hover:text-purple-950 transition-colors whitespace-nowrap shrink-0">
              Videochiamate Live
            </a>
            <a href="#demo" className="hover:text-purple-950 transition-colors whitespace-nowrap shrink-0">
              Laboratorio Vocale
            </a>
            <a href="#storie" className="hover:text-purple-950 transition-colors whitespace-nowrap shrink-0">
              Espresso Culturale
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenDevLab}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-800 bg-purple-100/70 hover:bg-purple-200/80 rounded-2xl transition-all border border-purple-200 whitespace-nowrap shrink-0"
              title="Voice Lab e parametri Gemini"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={onOpenStudio}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-md shadow-purple-500/25 transition-all whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Apri Video Studio</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION: Smooth, Colorful, Friendly */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-purple-100/80 overflow-hidden bg-gradient-to-b from-white via-[#faf7ff] to-purple-50/50">
        
        {/* Colorful ambient background gradients */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[340px] bg-gradient-to-r from-purple-200/40 via-violet-200/30 to-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[250px] bg-gradient-to-r from-rose-100/40 to-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Friendly Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Italian Flag Themed Ribbon Tag */}
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
                <span className="text-purple-700">Italiano Parlato Autentico</span>
              </div>

              {/* Smooth Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-purple-950 leading-[1.12] text-balance">
                Impara l&apos;italiano parlando in videochiamata con tutor AI.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-purple-900/80 leading-relaxed max-w-2xl font-normal">
                Connettiti faccia a faccia in video con simpatici personaggi italiani: dal barista di Firenze alla studentessa di Bologna. Dialoghi naturali con audio Gemini 3.8, correzioni gentili e zero ansia da prestazione!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => onStartVideoCallWith(personas[0])}
                  className="px-7 py-4 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all flex items-center gap-2.5 active:scale-95"
                >
                  <Video className="w-5 h-5" />
                  <span>Avvia Videochiamata con Matteo</span>
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
                  <span>Ascolta la Voce</span>
                </button>
              </div>

              {/* Quantitative Strip with Italian Flag Accents */}
              <div className="pt-6 border-t border-purple-200/60 flex flex-wrap items-center gap-6 sm:gap-8 text-xs text-purple-800">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-950 font-mono-data">5 Città</div>
                    <div className="text-purple-600/80 text-[11px]">Firenze, Roma, Napoli, Milano, Bologna</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-purple-200 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-700 font-mono-data">&lt; 300 ms</div>
                    <div className="text-purple-600/80 text-[11px]">Audio Neurale Gemini 3.8</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-purple-200 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div>
                    <div className="text-xl font-extrabold text-purple-950 font-mono-data">A1 - C1</div>
                    <div className="text-purple-600/80 text-[11px]">Dal principiante all&apos;avanzato</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Video Call Mockup Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[36px] p-6 border-2 border-purple-200 shadow-xl shadow-purple-500/10 relative overflow-hidden">
                
                {/* Italian Flag Strip on Card */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                  <span className="w-1/3 bg-emerald-500" />
                  <span className="w-1/3 bg-white" />
                  <span className="w-1/3 bg-red-500" />
                </div>

                {/* Top Video Call Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-100 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-purple-950">Videochiamata Live in Corso</span>
                  </div>
                  <span className="text-[11px] font-mono-data text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                    02:15 · HD 1080p
                  </span>
                </div>

                {/* Video Stage Visualizer */}
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

                  {/* Frequency Visualizer */}
                  <div className="flex items-center gap-1.5 my-3">
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-1' : 'bg-purple-200 h-2'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-2' : 'bg-purple-200 h-4'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-3' : 'bg-purple-200 h-1.5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-4' : 'bg-purple-200 h-5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-purple-600 animate-wave-5' : 'bg-purple-200 h-3'}`} />
                  </div>

                  {/* Live Caption Bubble */}
                  <div className="w-full bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 text-left text-xs my-2">
                    <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Battuta Videochiamata</span>
                      <span className="text-emerald-700 font-bold">Livello {personas[0].cefrLevel}</span>
                    </div>
                    <p className="text-purple-950 font-bold leading-snug">
                      &ldquo;{personas[0].sampleAudioText}&rdquo;
                    </p>
                    <p className="text-[11px] text-purple-600/80 italic mt-1 border-t border-purple-200/60 pt-1">
                      &ldquo;Welcome to Florence! I will teach you how to order the perfect espresso at the counter!&rdquo;
                    </p>
                  </div>

                  {/* Action Button: Strictly Video Call */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => onStartVideoCallWith(personas[0])}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Videochiama</span>
                    </button>
                    <button
                      onClick={() => onStartChatWith(personas[0])}
                      className="py-3 px-4 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-700" />
                      <span>Apri Chat</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* TUTORS DIRECTORY: Colorful Cards */}
      <section id="tutors" className="py-16 md:py-24 border-b border-purple-100/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
                <Compass className="w-4 h-4" />
                <span>I Nostri Amici Italiani</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-950 tracking-tight">
                Scegli con chi vuoi fare una videochiamata
              </h2>
              <p className="text-sm text-purple-700/80 mt-1 font-medium">
                Ognuno con la sua parlata regionale, aneddoti divertenti e passione per la propria terra.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-purple-50 rounded-2xl border border-purple-100 shrink-0 self-start md:self-auto">
              {[
                { id: 'all', label: 'Tutti' },
                { id: 'beginner', label: 'Base (A1-A2)' },
                { id: 'intermediate', label: 'Medio (B1-B2)' },
                { id: 'advanced', label: 'Avanzato (C1)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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

          {/* Cards Grid */}
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
                        Motto
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
                      title="Ascolta voce"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 text-purple-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Ferma' : 'Voce'}</span>
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
                        <span>Videochiama</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 3-PILLAR VIDEO METHOD */}
      <section id="video-metodo" className="py-16 md:py-24 border-b border-purple-100/80 bg-purple-50/40">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-bold text-purple-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Metodo Conversazionale Video</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-950 tracking-tight">
              Perché la Videochiamata è la Chiave per Parlare
            </h2>
            <p className="text-sm text-purple-700/80 mt-2 font-medium">
              Parlare a schermo intero con un interlocutore visivo simula la vita reale in Italia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-5">
                  01
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Contatto Visivo & Coinvolgimento
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Vedere il tuo tutor reagire, ascoltare le onde della voce e avere il tuo riquadro video ti dà la sicurezza di una vera videocall con un amico a Roma o Firenze.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Interazione visiva viva</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg mb-5">
                  02
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Sottotitoli Bilingui Live
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Se ti perdi una parola durante la videochiamata, i sottotitoli in tempo reale mostrano la frase in italiano con la traduzione immediata in inglese a scomparsa.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-purple-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Zero ansia di non capire</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-[32px] border border-purple-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center font-bold text-lg mb-5">
                  03
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">
                  Gemini 3.8 Flash Audio
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  La tecnologia audio server sintetizza ogni risposta a 24kHz, rispettando accenti e calore umano: senza pause robotiche e con intonazione calda e accogliente.
                </p>
              </div>
              <div className="pt-4 border-t border-purple-100 text-xs text-red-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Audio nativo italiano HD</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* AUDIO DEMO STATION */}
      <section id="demo" className="py-16 md:py-24 border-b border-purple-100/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Prova d&apos;Ascolto Immediata
              </div>
              <h2 className="text-3xl font-extrabold text-purple-950 tracking-tight">
                Ascolta la pronuncia italiana corretta
              </h2>
              <p className="text-sm text-purple-800/80 leading-relaxed font-normal">
                Tocca una delle frasi per ascoltare la voce neurale Gemini in tempo reale. Puoi praticare la risposta prima di entrare in videochiamata!
              </p>

              <div className="p-4 rounded-3xl bg-purple-50/70 border border-purple-200 text-xs space-y-2 mt-4">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Personalizza i Parametri AI</span>
                </div>
                <p className="text-purple-800/80 leading-relaxed">
                  Apri il <strong>Voice Lab</strong> per cambiare velocità, dialetto e rigidità grammaticale del modello.
                </p>
                <button
                  onClick={onOpenDevLab}
                  className="mt-1 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                >
                  <span>Apri il Voice Lab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {ITALIAN_PRACTICE_PHRASES.map((item, idx) => {
                const isPlaying = playingPhraseIdx === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => handlePlayPhrase(item.it, idx)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isPlaying
                        ? 'bg-purple-100/80 border-purple-400 shadow-sm'
                        : 'bg-[#faf8ff] border-purple-100 hover:bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm text-purple-950 flex items-center gap-2">
                        <span>{item.it}</span>
                        {isPlaying && <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />}
                      </div>
                      <div className="text-xs text-purple-600/80 italic mt-0.5">
                        {item.en}
                      </div>
                    </div>

                    <button
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* CULTURAL STORIES */}
      <section id="storie" className="py-16 md:py-20 bg-purple-50/30 border-b border-purple-100/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Pillole di Cultura
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight">
                Espresso Culturale
              </h2>
            </div>
            <button
              onClick={onOpenStudio}
              className="text-xs font-bold text-purple-700 hover:text-purple-950 flex items-center gap-1"
            >
              <span>Vedi tutte nello Studio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CULTURAL_STORIES.map(story => {
              const persona = personas.find(p => p.id === story.personaId);
              return (
                <div
                  key={story.id}
                  onClick={() => {
                    if (persona) onStartChatWith(persona);
                  }}
                  className="bg-white p-5 rounded-3xl border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {persona?.city}
                      </span>
                      <span className="text-[10px] font-mono-data text-purple-400">
                        {story.duration}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-purple-950 mb-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-purple-600 mb-2">
                      {story.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {story.snippet}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
                    <span>Parla con {persona?.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-white mt-auto border-t border-purple-100 text-xs text-purple-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-purple-950">Parlami</span>
            <span>· Videochiamate e Conversazione Italiana AI</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <button onClick={onOpenStudio} className="hover:text-purple-950 transition-colors">
              Video Studio & Chat
            </button>
            <button onClick={onOpenDevLab} className="hover:text-purple-950 transition-colors">
              Voice Model Lab
            </button>
            <a href="#hero" className="hover:text-purple-950 transition-colors">
              Torna in Alto
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
