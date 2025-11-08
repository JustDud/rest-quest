import React, { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { animated } from '@react-spring/web';
import { GradientButton } from '../ui/GradientButton';
import { FlowPattern } from '../ui/FlowPattern';
import { ParticleField } from '../ui/ParticleField';
import { useBreathingAnimation } from '../../hooks/useBreathingAnimation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { HeroVisual } from '../interactive/HeroVisual';
import { RestQuestLogo } from '../ui/RestQuestLogo';

export function HeroSection() {
  const breathing = useBreathingAnimation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { analysis } = useContext(EmotionalContext) || {};
  const emotion = useMemo(() => analysis?.dominantEmotion ?? 'calm', [analysis]);

  const handleBegin = () => {
    const target = document.getElementById('emotional-checkin');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <section
      id="hero"
      data-cinematic-section="0"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#E7F5FF] via-[#EFF7FF] to-[#FFE8CC]" />
      <FlowPattern />
      <ParticleField count={isMobile ? 18 : 34} className="mix-blend-lighten" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          <div className="text-center lg:text-left space-y-8" data-cinematic-content="0">
            {/* Logo First - Most Prominent - Always Visible */}
            <div className="mx-auto lg:mx-0 flex justify-center lg:justify-start">
              <animated.div
                style={breathing}
                className="flex items-center justify-center"
              >
                <RestQuestLogo
                  size={isMobile ? 180 : 260}
                  animated
                  className="drop-shadow-[0_0_50px_rgba(25,113,194,0.35)]"
                />
              </animated.div>
            </div>

            <motion.p
              className="text-sm uppercase tracking-[0.5em] text-[#1971C2]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Serenity AI · Luxury Wellness Concierge
            </motion.p>
            <motion.h1
              className="font-['Plus_Jakarta_Sans'] text-[clamp(2.5rem,6vw,4.8rem)] text-[#0B1728] leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Your emotions, understood. Your wellness, personalized.
            </motion.h1>
            <motion.p
              className="font-['Crimson_Pro'] italic text-2xl text-[#34495E]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Transform emotional awareness into life-changing experiences.
            </motion.p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <GradientButton className="serenity-interactive" onClick={handleBegin}>
                Begin Emotional Scan
              </GradientButton>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end" data-cinematic-content="0">
            <HeroVisual emotion={emotion} />
          </div>
        </div>

        <motion.div
          className="flex flex-col items-center gap-2 text-[#0B1728]/70"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>Scroll softly</span>
          <span className="text-3xl">↓</span>
        </motion.div>
      </div>
    </section>
  );
}
