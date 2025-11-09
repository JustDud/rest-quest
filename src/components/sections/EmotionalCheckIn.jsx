import React, { useContext, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Headphones, Sparkles } from 'lucide-react';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { GlassCard } from '../ui/GlassCard';
import { ParticleField } from '../ui/ParticleField';
import { OrbParticles } from '../particles/OrbParticles';
import { useTypedText } from '../../hooks/useTypedText';
import { RadialProgress } from '../ui/RadialProgress';
import { AmbientSoundscape } from '../sound/AmbientSoundscape';
import { CameraPreview } from '../ui/CameraPreview';
import { ConversationLog } from '../ui/ConversationLog';
import { LiveEmotionVisual } from '../ui/LiveEmotionVisual';

const indicators = [
  { key: 'stress', label: 'Stress', color: '#F06595' },
  { key: 'energy', label: 'Energy', color: '#51CF66' },
  { key: 'valence', label: 'Mood Valence', color: '#3BC9DB' },
];

export function EmotionalCheckIn() {
  const {
    entry,
    setEntry,
    analyzing,
    analyzeEntry,
    analysis,
    sessionEvents,
    startGuidedSession,
    sessionStarting,
    micRecorder,
    liveEmotion,
  } = useContext(EmotionalContext);
  const [inputError, setInputError] = useState(false);
  const typedHeadline = useTypedText(
    'Choose the path that feels most natural—real-time guided conversation or reflective text entry.',
    26
  );

  const orbColor = useMemo(() => {
    if (!analysis) return 'from-[#3BC9DB] to-[#B197FC]';
    if (analysis.stress > 80) return 'from-[#F06595] to-[#F783AC]';
    if (analysis.stress > 55) return 'from-[#F59F00] to-[#FFD43B]';
    return 'from-[#51CF66] to-[#3BC9DB]';
  }, [analysis]);

  const handleAnalyze = () => {
    if (!entry.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 500);
      return;
    }
    const userText = entry.trim();
    analyzeEntry(userText);
    setEntry('');
  };

  const latestEvents = sessionEvents.slice(-3).reverse();

  return (
    <section
      id="emotional-checkin"
      data-cinematic-section="1"
      className="relative py-24 px-6 overflow-hidden"
    >
      <ParticleField
        count={28}
        speed={analysis ? Math.max(0.8, analysis.stress / 60) : 1}
        className="opacity-30"
      />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
        <div className="space-y-6" data-cinematic-content="1">
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Guided experience</p>
                <h2 className="text-3xl font-['Plus_Jakarta_Sans'] text-[#0B1728]">
                  Let Serenity lead the conversation
                </h2>
                <p className="text-[#0B1728]/70">{typedHeadline}</p>
              </div>
              <div className="relative w-24 h-24">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${orbColor} animate-pulse`} />
                <OrbParticles
                  stress={analysis?.stress ?? 40}
                  color={analysis?.stress > 70 ? '#F06595' : '#3BC9DB'}
                  className="mix-blend-screen"
                />
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.4em] text-[#0B1728]/60 rotate-90">
                  {analysis?.dominantEmotion ?? 'calm'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[#0B1728]/70">
                Press start to hear voiced prompts, watch the live analysis mesh, and let the AI record your responses.
              </p>
              <button
                type="button"
                onClick={startGuidedSession}
                disabled={sessionStarting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] px-6 py-3 text-white font-semibold serenity-interactive disabled:opacity-70"
              >
                <Sparkles size={16} />
                {sessionStarting ? 'Starting session…' : 'Start guided conversation'}
              </button>
            <div className="space-y-2 text-sm text-[#0B1728]/70">
              <p className="uppercase tracking-[0.4em] text-xs text-[#1971C2]/70">Live status</p>
              <ConversationLog events={sessionEvents.slice(-50).reverse()} />
              <LiveEmotionVisual emotion={liveEmotion || analysis} />
              <div className="flex items-center gap-2 text-xs text-[#0B1728]/70">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    micRecorder?.recording ? 'bg-[#F06595] animate-pulse' : 'bg-[#1971C2]'
                  }`}
                />
                {micRecorder?.recording ? 'Listening to your voice…' : 'Waiting for next prompt'}
                {micRecorder?.error && <span className="text-[#F06595] ml-2">{micRecorder.error}</span>}
              </div>
            </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-white/80">
            <CameraPreview />
          </GlassCard>
        </div>

        <div className="space-y-6" data-cinematic-content="1">
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm uppercase tracking-[0.4em] text-[#1971C2]/80">
                text check-in
              </label>
              <div className="flex items-center gap-2 text-xs text-[#0B1728]/60">
                <Headphones size={14} />
                Optional ambient soundscape
              </div>
            </div>

            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="“Work has felt like a tidal wave lately...”"
              className={`serenity-input w-full h-36 rounded-[28px] border border-transparent bg-white/70 px-6 py-4 text-lg text-[#0B1728] focus:bg-white transition-all ${
                inputError ? 'serenity-input-error' : ''
              } ${entry ? 'typing' : ''}`}
            />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white px-5 py-2 serenity-interactive disabled:opacity-60"
                disabled={analyzing}
              >
                <Mic size={16} />
                {analyzing ? 'Analyzing…' : 'Send reflection'}
              </button>
            </div>
            <AmbientSoundscape analysis={analysis} />
          </GlassCard>

          <GlassCard className="p-6 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {indicators.map((indicator) => (
                <div key={indicator.key} className="text-center">
                  <RadialProgress
                    value={analysis?.[indicator.key] ?? 0}
                    label={indicator.label}
                    colors={[indicator.color, indicator.color]}
                  />
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-[#0B1728]/70">
              <div className="p-3 rounded-2xl bg-white/70 border border-white/80">
                <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Triggers</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(analysis?.triggers ?? ['work rhythm', 'digital overload']).map((trigger) => (
                    <span key={trigger} className="px-3 py-1 rounded-full bg-[#E7F5FF] text-[#1971C2]">
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 border border-white/80">
                <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Recommendations</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(analysis?.recommendations ?? ['ocean therapy']).slice(0, 3).map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full bg-white text-[#0B1728] border border-[#E7F5FF]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
