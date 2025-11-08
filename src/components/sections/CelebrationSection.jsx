import React, { useContext, useEffect, useState } from 'react';
import { animated } from '@react-spring/web';
import { GradientButton } from '../ui/GradientButton';
import { ExperiencesContext } from '../../contexts/ExperiencesContext';
import { useBreathingAnimation } from '../../hooks/useBreathingAnimation';
import { CelebrationParticles } from '../particles/CelebrationParticles';
import { useCelebrationParticles } from '../../hooks/useCelebrationParticles';

export function CelebrationSection() {
  const { liked, priority } = useContext(ExperiencesContext);
  const [celebrated, setCelebrated] = useState(false);
  const breathing = useBreathingAnimation();
  const { bursts, fire } = useCelebrationParticles();

  useEffect(() => {
    if (!celebrated && liked.length >= 3) {
      fire();
      setCelebrated(true);
    }
  }, [celebrated, liked.length, fire]);

  if (!liked.length) return null;

  return (
    <section className="py-24 px-6 relative">
      <CelebrationParticles bursts={bursts} />
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Next steps</p>
        <h2 className="text-4xl text-[#0B1728] font-['Plus_Jakarta_Sans']">Celebrating your journey</h2>
        <p className="text-[#0B1728]/70 max-w-2xl mx-auto">
          Your inbox just received a calm itinerary + receipt. Settle into the visualization below as your mandala earns
          a new petal, or simply rest before moving forward.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <GradientButton>Explore more</GradientButton>
          <button className="rounded-full border border-[#1971C2]/30 text-[#1971C2] px-8 py-3 font-semibold">
            Return home
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3 text-left">
            <p className="text-sm uppercase tracking-[0.4em] text-[#1971C2]/70">Breathing exercise</p>
            <p className="text-[#0B1728]/70">Inhale 4 · Hold 7 · Exhale 8 — repeat three times at your own pace.</p>
            <p className="text-[#0B1728]/60 text-sm">
              {priority.length} priority retreats saved · {liked.length} total experiences in your stack.
            </p>
          </div>
          <animated.div
            style={breathing}
            className="mx-auto w-48 h-48 rounded-full bg-gradient-to-br from-[#3BC9DB] via-[#1971C2] to-[#B197FC] opacity-80 shadow-[0_0_120px_rgba(25,113,194,0.35)]"
          />
        </div>

        <div className="space-y-3 text-sm text-[#0B1728]/70">
          <p>Email confirmation sent with subject: <strong>“Serenity AI itinerary ready.”</strong></p>
          <p>Mandala status: <strong>{celebrated ? 'Petal added · keep breathing' : 'Awaiting likes'}</strong></p>
        </div>
      </div>
    </section>
  );
}
