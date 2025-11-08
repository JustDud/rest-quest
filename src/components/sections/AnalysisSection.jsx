import React, { useContext, useMemo, useState } from 'react';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { GlassCard } from '../ui/GlassCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const defaultTriggers = [
  { name: 'Workload', value: 68 },
  { name: 'Digital noise', value: 52 },
  { name: 'Boundaries', value: 44 },
  { name: 'Sleep debt', value: 36 },
];

const focusTags = [
  { label: 'Ocean therapy', weight: 1.1 },
  { label: 'Somatic journaling', weight: 1 },
  { label: 'Forest sound walk', weight: 0.8 },
  { label: 'Digital sunset', weight: 0.9 },
  { label: 'Awe tracking', weight: 1.2 },
];

const recommendationsMap = {
  'Ocean therapy': [
    'Prescribe water-based retreats',
    'Prioritize breathing rituals',
    'Highlight ocean soundscapes',
  ],
  'Somatic journaling': [
    'Offer nightly somatic prompts',
    'Customize ritual journaling kit',
    'Track nervous-system shifts',
  ],
  'Forest sound walk': [
    'Suggest forest bathing itineraries',
    'Add sound healing sessions',
    'Invite morning nature walks',
  ],
  'Digital sunset': [
    'Plan nightly phone-free windows',
    'Automate bedtime blue-light filters',
    'Supply analog entertainment kits',
  ],
  'Awe tracking': [
    'Schedule awe breaks',
    'Curate views that inspire wonder',
    'Log emotions for AI calibration',
  ],
};

export function AnalysisSection() {
  const { analysis } = useContext(EmotionalContext);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [activeFocus, setActiveFocus] = useState(focusTags[0].label);

  const circleData = useMemo(() => {
    if (!analysis) return [60, 45, 30];
    return [analysis.stress, analysis.energy, analysis.valence];
  }, [analysis]);

  const triggerData = useMemo(() => {
    if (!analysis?.triggers?.length) return defaultTriggers;
    return analysis.triggers.map((trigger, index) => ({
      name: trigger,
      value: defaultTriggers[index % defaultTriggers.length].value,
    }));
  }, [analysis]);

  const focusRecommendations = recommendationsMap[activeFocus] ?? [];

  return (
    <section id="analysis" data-cinematic-section="3" className="py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-10" data-cinematic-content="3">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Analysis</p>
          <h2 className="text-4xl text-[#0B1728] font-['Plus_Jakarta_Sans']">
            Understanding your wellness journey
          </h2>
          <p className="text-[#0B1728]/70 max-w-3xl mx-auto">
            Every scan produces a sensory dashboard— emotional profile rings, trigger radar, and focus tags that guide
            our AI concierge.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <GlassCard className="p-6 space-y-6" data-cinematic-content="3">
            <h3 className="text-2xl text-[#0B1728]">Emotional profile</h3>
            <div className="relative h-56 flex items-center justify-center">
              {circleData.map((value, index) => (
                <div
                  key={index}
                  className="absolute rounded-full border border-white/70 transition-transform duration-500"
                  style={{
                    width: `${220 - index * 40}px`,
                    height: `${220 - index * 40}px`,
                    borderColor: ['#1971C2', '#3BC9DB', '#B197FC'][index],
                    opacity: 0.8 - index * 0.2,
                    transform: `scale(${0.95 + (value / 100) * 0.05})`,
                  }}
                />
              ))}
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.4em] text-[#1971C2]/70">Dominant emotion</p>
                <p className="text-3xl text-[#0B1728] font-semibold">
                  {analysis?.dominantEmotion ?? 'Calm'}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#0B1728]/70">
              Concentric rings show current state, energy baseline, and optimal serenity target.
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-4" data-cinematic-content="3">
            <h3 className="text-2xl text-[#0B1728]">Stress triggers</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={triggerData}>
                <XAxis dataKey="name" stroke="#94A3B8" />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: 16 }} />
                <Bar dataKey="value" fill="#3BC9DB" radius={[20, 20, 20, 20]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-[#0B1728]/70">
              Hover to feel how each trigger responds to curated rituals.
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-4" data-cinematic-content="3">
            <h3 className="text-2xl text-[#0B1728]">Recommended focus</h3>
            <div
              className="flex flex-wrap gap-3"
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
                const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
                setParallax({ x, y });
              }}
              onMouseLeave={() => setParallax({ x: 0, y: 0 })}
            >
              {focusTags.map((tag) => (
                <motion.button
                  key={tag.label}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setActiveFocus(tag.label)}
                  style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
                  className={`px-4 py-2 rounded-full text-sm serenity-tag ${
                    activeFocus === tag.label ? 'selected' : 'bg-white/80 text-[#1971C2]'
                  }`}
                >
                  {tag.label}
                </motion.button>
              ))}
            </div>
            <div className="text-sm text-[#0B1728]/70">
              Tap a focus to see how it translates into recommendations.
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6 mt-8">
          <div className="grid md:grid-cols-3 gap-6">
            {focusRecommendations.map((item) => (
              <div key={item} className="rounded-2xl bg-white/80 border border-[#E7F5FF] p-4 text-sm text-[#0B1728]/80">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
