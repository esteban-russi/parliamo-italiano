import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Play, 
  Pause, 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Volume2, 
  CheckCircle2, 
  Zap, 
  Sliders, 
  Compass, 
  Globe2,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { Persona } from '../types';
import { PersonaBadge } from './PersonaBadge';
import { CULTURAL_STORIES, ITALIAN_PRACTICE_PHRASES } from '../data/personas';
import { speechService } from '../utils/speech';

interface HomePageProps {
  personas: Persona[];
  onStartChatWith: (persona: Persona) => void;
  onStartCallWith: (persona: Persona, mode: 'audio' | 'video') => void;
  onOpenStudio: () => void;
  onOpenDevLab: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  personas,
  onStartChatWith,
  onStartCallWith,
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
    <div className="min-h-screen bg-[#fcfcfb] text-slate-900 font-sans selection:bg-red-100 selection:text-red-900 flex flex-col">
      
      {/* 1. TOP BAR CONTRACT: [Brand Wordmark] — [Nav Links] — [Primary CTA] */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <a href="#hero" className="text-xl font-editorial font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2">
            <span>Parlami</span>
            <span className="text-[11px] font-sans font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200/80">
              Italiano AI
            </span>
          </a>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#tutors" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              I Nostri Tutor
            </a>
            <a href="#metodo" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Metodo Telefonico
            </a>
            <a href="#demo" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Laboratorio Vocale
            </a>
            <a href="#storie" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Espresso Culturale
            </a>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenDevLab}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
              title="Parametri vocali e server Gemini"
            >
              <Sliders className="w-3.5 h-3.5 text-red-600" />
              <span>Voice Lab</span>
            </button>
            <button
              onClick={onOpenStudio}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Apri Messenger</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION: Conversational Italian via Phone & Realtime Chat */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-16 md:pb-28 border-b border-slate-200/80 overflow-hidden bg-gradient-to-b from-white via-[#fcfcfb] to-stone-50/60">
        
        {/* Subtle ambient red background radiance */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Editorial Copy */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Natural kicker metadata */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-red-700 font-bold uppercase tracking-wider">Parlami Studio</span>
                <span aria-hidden="true">·</span>
                <span>Gemini 3.8 Neural Speech</span>
                <span aria-hidden="true">·</span>
                <span>5 Città Italiane</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-editorial leading-[1.12] text-balance">
                Parla l&apos;italiano vero al telefono e in chat, senza paura di sbagliare.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Dimentica le lezioni passive. Conversa a voce o scriviti con tutor madrelingua italiani dotati di personalità autentiche: dal barista di Firenze alla storica dell&apos;arte di Roma, con sintesi vocale neurale in tempo reale e spiegazioni grammaticali istantanee.
              </p>

              {/* Primary Action Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenStudio}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Inizia la Chiamata di Prova</span>
                </button>
                <button
                  onClick={() => handlePlayHeroSample(personas[0])}
                  className="px-5 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-stone-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                >
                  {playingPersonaId === personas[0].id ? (
                    <Pause className="w-4 h-4 text-red-600" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-red-600" />
                  )}
                  <span>Ascolta Matteo a Firenze</span>
                </button>
              </div>

              {/* Quantitative Proof Strip */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-8 text-xs text-slate-600">
                <div>
                  <div className="text-xl font-bold text-slate-900 font-mono-data">5 Dialetti</div>
                  <div className="text-slate-500">Firenze, Roma, Napoli, Milano, Bologna</div>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="text-xl font-bold text-red-700 font-mono-data">&lt; 300 ms</div>
                  <div className="text-slate-500">Latenza Audio Gemini 3.8</div>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="text-xl font-bold text-slate-900 font-mono-data">A1 - C1</div>
                  <div className="text-slate-500">Livelli QCER supportati</div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Call Interface Card Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                
                {/* Card Top Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">Simulazione Telefonica Live</span>
                  </div>
                  <span className="text-[11px] font-mono-data text-red-700 bg-red-50 px-2 py-0.5 rounded font-semibold border border-red-200">
                    01:42 · Audio HD
                  </span>
                </div>

                {/* Persona Showcase Centerpiece */}
                <div className="flex flex-col items-center text-center py-4">
                  <PersonaBadge
                    persona={personas[0]}
                    size="lg"
                    speakingState={playingPersonaId === personas[0].id ? 'speaking' : 'idle'}
                  />
                  <h3 className="text-lg font-bold text-slate-900 font-editorial mt-3">
                    {personas[0].fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {personas[0].city} · {personas[0].role}
                  </p>

                  {/* Frequency Visualizer */}
                  <div className="flex items-center gap-1.5 my-3">
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-red-600 animate-wave-1' : 'bg-slate-200 h-2'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-red-600 animate-wave-2' : 'bg-slate-200 h-4'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-red-600 animate-wave-3' : 'bg-slate-200 h-1.5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-red-600 animate-wave-4' : 'bg-slate-200 h-5'}`} />
                    <span className={`w-1 rounded-full ${playingPersonaId === personas[0].id ? 'bg-red-600 animate-wave-5' : 'bg-slate-200 h-3'}`} />
                  </div>

                  {/* Speech transcript sample */}
                  <div className="w-full bg-stone-50 border border-slate-200/80 rounded-2xl p-3 text-left text-xs my-2">
                    <div className="text-[10px] text-red-700 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Battuta in Italiano</span>
                      <span>Livello {personas[0].cefrLevel}</span>
                    </div>
                    <p className="text-slate-900 font-medium leading-snug">
                      &ldquo;{personas[0].sampleAudioText}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-200/60 pt-1">
                      &ldquo;Welcome to Florence! I will teach you how to order the perfect espresso at the counter!&rdquo;
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => onStartCallWith(personas[0], 'audio')}
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Chiama Matteo</span>
                    </button>
                    <button
                      onClick={() => onStartChatWith(personas[0])}
                      className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                      <span>Apri Chat</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 3. FEATURED TUTORS & REGIONAL VOICES DIRECTORY */}
      <section id="tutors" className="py-16 md:py-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
                <Compass className="w-4 h-4" />
                <span>Personaggi & Dialetti</span>
              </div>
              <h2 className="text-3xl font-bold font-editorial text-slate-900 tracking-tight">
                Scegli con chi vuoi conversare oggi
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Ogni tutor ha un registro linguistico, accento e bagaglio culturale specifico per farti praticare situazioni reali.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl shrink-0 self-start md:self-auto">
              {[
                { id: 'all', label: 'Tutti' },
                { id: 'beginner', label: 'Base (A1-A2)' },
                { id: 'intermediate', label: 'Intermedio (B1-B2)' },
                { id: 'advanced', label: 'Avanzato (C1)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
                  className="bg-[#fcfcfb] border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-red-300 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Header: Badge + Level */}
                    <div className="flex items-start justify-between mb-4">
                      <PersonaBadge
                        persona={persona}
                        size="md"
                        speakingState={isPlaying ? 'speaking' : 'idle'}
                      />
                      <span className="text-[11px] font-mono-data font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {persona.levelLabel}
                      </span>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-lg font-bold text-slate-900 font-editorial group-hover:text-red-700 transition-colors">
                      {persona.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>{persona.city}, {persona.region}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{persona.role}</span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {persona.bio}
                    </p>

                    {/* Motto */}
                    <div className="p-3 bg-white border border-slate-200/80 rounded-2xl mb-4 text-xs">
                      <div className="text-[10px] text-red-700 font-bold uppercase tracking-wider mb-0.5">
                        Motto
                      </div>
                      <div className="font-editorial italic text-slate-900">
                        &ldquo;{persona.nativeSaying}&rdquo;
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        {persona.nativeSayingTranslation}
                      </div>
                    </div>

                    {/* Topics tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {persona.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-slate-700 border border-slate-200">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePlayHeroSample(persona)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Ascolta campione vocale"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Ferma' : 'Voce'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onStartChatWith(persona)}
                        className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chatta</span>
                      </button>
                      <button
                        onClick={() => onStartCallWith(persona, 'audio')}
                        className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chiama</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. THE 3-PILLAR CONVERSATIONAL METHOD */}
      <section id="metodo" className="py-16 md:py-24 border-b border-slate-200/80 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
              Metodo Didattico Attivo
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-900 tracking-tight">
              Come Parlami ti fa raggiungere la scioltezza
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Sviluppato per superare il tipico blocco di chi studia grammatica da anni ma si blocca quando deve ordinare un cappuccino o fare una telefonata in Italia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-mono-data font-bold text-lg mb-5">
                  01
                </div>
                <h3 className="text-xl font-bold font-editorial text-slate-900 mb-2">
                  La Sfida della Telefonata
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Parlare al telefono è la prova del nove per chi studia una lingua: niente gesti su cui appoggiarsi, solo ascolto attivo e risposta immediata. Parlami simula chiamate reali con audio autentico a bassa latenza.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-red-700 font-semibold flex items-center gap-1">
                <span>Pulsanti chiamata regolari (Mute, Speaker, Tastierino)</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-mono-data font-bold text-lg mb-5">
                  02
                </div>
                <h3 className="text-xl font-bold font-editorial text-slate-900 mb-2">
                  Note Grammaticali & Modismi
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Durante le chat, ogni messaggio del tutor include l&apos;analisi delle costruzioni linguistiche, dai verbi riflessivi e il congiuntivo fino agli idiomatismi giovanili come <em>&quot;al volo&quot;</em> e <em>&quot;ci sta&quot;</em>.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-red-700 font-semibold flex items-center gap-1">
                <span>Spiegazione parola per parola + Traduzione istantanea</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-mono-data font-bold text-lg mb-5">
                  03
                </div>
                <h3 className="text-xl font-bold font-editorial text-slate-900 mb-2">
                  Voce Gemini 3.8 Server
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Grazie all&apos;architettura full-stack con il modello neurale Google Gemini 3.8 Flash-Lite TTS, l&apos;accento e l&apos;intonazione sono fluenti e naturali, con timbri dedicati a ciascuna personalità italiana.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-red-700 font-semibold flex items-center gap-1">
                <span>Flusso audio a 24kHz ad alta fedeltà</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE LIVE PHRASES & AUDIO DEMO STATION */}
      <section id="demo" className="py-16 md:py-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                Prova d&apos;Ascolto Immediata
              </div>
              <h2 className="text-3xl font-bold font-editorial text-slate-900 tracking-tight">
                Ascolta la pronuncia italiana corretta
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tocca una delle frasi essenziali qui accanto per ascoltare immediatamente la voce sintetizzata dal server Gemini con pronuncia madrelingua e intonazione naturale.
              </p>

              <div className="p-4 rounded-2xl bg-stone-50 border border-slate-200 text-xs space-y-2 mt-4">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span>Sei uno sviluppatore?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Puoi testare latency target, temperature del modello e parametri di strictness grammaticale aprendo il nostro <strong>Voice Lab</strong> integrato.
                </p>
                <button
                  onClick={onOpenDevLab}
                  className="mt-1 text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1"
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
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isPlaying
                        ? 'bg-red-50 border-red-300 shadow-sm'
                        : 'bg-[#fcfcfb] border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <span>{item.it}</span>
                        {isPlaying && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
                      </div>
                      <div className="text-xs text-slate-500 italic mt-0.5">
                        {item.en}
                      </div>
                    </div>

                    <button
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-red-600 text-white'
                          : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
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

      {/* 6. CULTURAL STORIES & ESPRESSO SECTION */}
      <section id="storie" className="py-16 md:py-20 bg-stone-50/50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                Pillole di Cultura
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-slate-900 tracking-tight">
                Espresso Culturale
              </h2>
            </div>
            <button
              onClick={onOpenStudio}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <span>Vedi tutte nel Messenger</span>
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
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {persona?.city}
                      </span>
                      <span className="text-[10px] font-mono-data text-slate-400">
                        {story.duration}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 font-editorial mb-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      {story.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {story.snippet}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-red-700">
                    <span>Parla con {persona?.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 bg-white mt-auto border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-base font-bold text-slate-900">Parlami</span>
            <span>· Piattaforma di Conversazione Italiana AI</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onOpenStudio} className="hover:text-red-700 transition-colors">
              Messenger & Chiamate
            </button>
            <button onClick={onOpenDevLab} className="hover:text-red-700 transition-colors">
              Voice Model Lab
            </button>
            <a href="#hero" className="hover:text-red-700 transition-colors">
              Torna in Alto
            </a>
          </div>

          <div className="text-[11px] text-slate-400">
            Powered by Google Gemini 3.8 Server-side TTS
          </div>
        </div>
      </footer>

    </div>
  );
};
