import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle2, Headphones } from 'lucide-react';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { GlassCard } from '../ui/GlassCard';
import { ParticleField } from '../ui/ParticleField';
import { OrbParticles } from '../particles/OrbParticles';
import { useTypedText } from '../../hooks/useTypedText';
import { RadialProgress } from '../ui/RadialProgress';
import { AmbientSoundscape } from '../sound/AmbientSoundscape';
import { CameraPreview } from '../ui/CameraPreview';

const indicators = [
  { key: 'stress', label: 'Stress', color: '#F06595' },
  { key: 'energy', label: 'Energy', color: '#51CF66' },
  { key: 'valence', label: 'Mood Valence', color: '#3BC9DB' },
];

export function EmotionalCheckIn() {
  const { entry, setEntry, analyzing, analyzeEntry, analysis } = useContext(EmotionalContext);
  const [response, setResponse] = useState('');
  const [inputError, setInputError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      sender: 'ai',
      text: 'I’m here and listening. Tell me how your mind and body feel right now.',
    },
  ]);
  const typedResponse = useTypedText(response, 28);

  const orbColor = useMemo(() => {
    if (!analysis) return 'from-[#3BC9DB] to-[#B197FC]';
    if (analysis.stress > 80) return 'from-[#F06595] to-[#F783AC]';
    if (analysis.stress > 55) return 'from-[#F59F00] to-[#FFD43B]';
    return 'from-[#51CF66] to-[#3BC9DB]';
  }, [analysis]);

  useEffect(() => {
    if (!analysis) return undefined;
    const summary = `I'm hearing ${analysis.dominantEmotion} cues. Stress ${analysis.stress}/100, energy ${analysis.energy}/100. Let me guide you toward ${analysis.recommendations[0]}.`;
    setResponse(summary);
    setMessages((prev) => [
      ...prev.filter((msg) => !msg.pending),
      { id: `ai-${Date.now()}`, sender: 'ai', text: summary },
    ]);
    setSuccess(true);
    const timer = setTimeout(() => setSuccess(false), 2400);
    return () => clearTimeout(timer);
  }, [analysis]);

  const handleAnalyze = () => {
    if (!entry.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 500);
      return;
    }
    const userText = entry.trim();
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'you', text: userText },
      {
        id: 'pending',
        sender: 'ai',
        text: 'Listening closely to your tone, pauses, and words...',
        pending: true,
      },
    ]);
    analyzeEntry(userText);
    setEntry('');
  };

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
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr,0.8fr] gap-10 items-start">
        <div className="space-y-6" data-cinematic-content="1">
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Emotional check-in</p>
                <h2 className="mt-2 text-3xl font-['Plus_Jakarta_Sans'] text-[#0B1728]">
                  Say how you feel, we’ll translate it into care.
                </h2>
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

            <div className="space-y-4 max-h-[360px] overflow-y-auto no-scrollbar">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-3 rounded-3xl max-w-[80%] text-sm leading-relaxed ${
                      message.sender === 'you'
                        ? 'bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white shadow-lg'
                        : 'bg-white/85 text-[#0B1728]'
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-white/80">
            <CameraPreview />
          </GlassCard>
        </div>

        <div className="space-y-6" data-cinematic-content="1">
          <div className="flex flex-col lg:flex-row gap-6">
            <GlassCard className="p-6 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <label className="text-sm uppercase tracking-[0.4em] text-[#1971C2]/80">
                  voice + text
                </label>
                <div className="flex items-center gap-2 text-xs text-[#0B1728]/60">
                  <Headphones size={14} />
                  Best with headphones
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
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white px-5 py-2 serenity-interactive"
                >
                  <Mic size={16} />
                  Listen
                </button>
                <AnimatePresence>
                  {success && (
                    <motion.span
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      className="inline-flex items-center gap-1 text-sm text-[#51CF66]"
                    >
                      <CheckCircle2 size={16} />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <AmbientSoundscape analysis={analysis} />
            </GlassCard>

          </div>

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
