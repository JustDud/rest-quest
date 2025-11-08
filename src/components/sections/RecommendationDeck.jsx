import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExperiencesContext } from '../../contexts/ExperiencesContext';
import { GradientButton } from '../ui/GradientButton';
import { useCardSwipe } from '../../hooks/useCardSwipe';
import { Heart, Undo2, X, Star } from 'lucide-react';
import { RadialProgress } from '../ui/RadialProgress';

export function RecommendationDeck() {
  const {
    deck,
    liked,
    priority,
    likeExperience,
    superLikeExperience,
    passExperience,
    undoLast,
  } = useContext(ExperiencesContext);
  const [index, setIndex] = useState(0);
  const [modalExperience, setModalExperience] = useState(null);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [trail, setTrail] = useState(null);

  const current = deck[index];
  const nextCards = useMemo(() => deck.slice(index + 1, index + 3), [deck, index]);
  const deckFinished = index >= deck.length;

  const triggerTrail = useCallback((direction) => {
    setTrail({ direction, id: Date.now() });
    setTimeout(() => setTrail(null), 600);
  }, []);

  const handleLike = useCallback(() => {
    if (!current) return;
    likeExperience(current);
    setIndex((prev) => prev + 1);
    triggerTrail('right');
  }, [current, likeExperience, triggerTrail]);

  const handlePass = useCallback(() => {
    if (!current) return;
    passExperience(current);
    setIndex((prev) => prev + 1);
    triggerTrail('left');
  }, [current, passExperience, triggerTrail]);

  const handleSuperLike = useCallback(() => {
    if (!current) return;
    superLikeExperience(current);
    setIndex((prev) => prev + 1);
    triggerTrail('up');
  }, [current, superLikeExperience, triggerTrail]);

  const { bind, style } = useCardSwipe({
    onLike: handleLike,
    onPass: handlePass,
    onInfo: () => current && setModalExperience(current),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (event) => {
      if (!current) return;
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleLike();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handlePass();
      } else if (event.code === 'ArrowUp' || event.code === 'Space') {
        event.preventDefault();
        handleSuperLike();
      } else if (event.code === 'Backspace') {
        event.preventDefault();
        undoLast();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, handleLike, handlePass, handleSuperLike, undoLast]);

  return (
    <section id="quest-deck" data-cinematic-section="4" className="py-24 px-6">
      <div className="max-w-5xl mx-auto" data-cinematic-content="4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Curated retreats</p>
            <h2 className="text-4xl text-[#0B1728] font-['Plus_Jakarta_Sans']">
              Swipe to teach Serenity what feels right.
            </h2>
          </div>
          <div className="text-sm text-[#0B1728]/70 space-y-1">
            <div>
              {liked.length} liked · {Math.max(deck.length - index, 0)} waiting
            </div>
            <p className="text-[#B197FC]">
              {priority.length} in your priority list
            </p>
          </div>
        </div>

        <div className="relative h-[560px] flex items-center justify-center" data-cinematic-content="4">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence>
              {trail && (
                <motion.span
                  key={trail.id}
                  className="w-[380px] h-[380px] rounded-full"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: 0.45,
                    scale: 1.3,
                    x: trail.direction === 'right' ? 180 : trail.direction === 'left' ? -180 : 0,
                    y: trail.direction === 'up' ? -180 : 0,
                  }}
                  exit={{ opacity: 0, scale: 1.6 }}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(59,201,219,0.25), rgba(177,151,252,0.08))',
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            {nextCards.map((card, idx) => (
              <div
                key={card.id}
                className="w-full max-w-3xl rounded-[40px] overflow-hidden"
                style={{
                  transform: `scale(${0.94 - idx * 0.04}) translateY(${idx * 18}px)`,
                  opacity: 0.3,
                  border: '1px solid rgba(255,255,255,0.4)',
                  background: '#fff',
                }}
              >
                <img src={card.images[0]} alt={card.title} className="w-full h-full object-cover opacity-40" />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id}
                {...bind()}
                style={style}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-3xl rounded-[40px] bg-white shadow-2xl border border-white/60 overflow-hidden"
              >
                <div className="h-72 relative">
                  <img src={current.images[0]} alt={current.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1728]/70 to-transparent" />
                  <div className="absolute top-6 left-6 flex gap-3">
                    <span className="px-4 py-2 rounded-full bg-white/30 backdrop-blur text-white">
                      {current.location}
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/30 backdrop-blur text-white">
                      {current.type}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 text-white space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">Experience</p>
                    <h3 className="text-3xl font-semibold">{current.title}</h3>
                    <p className="text-white/80">{current.description}</p>
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-[#0B1728]/70">
                      <span>Stress reduction</span>
                    </div>
                    <RadialProgress value={current.stressReductionScore} size={140} label="Ease" />
                    <div className="flex gap-4 text-sm text-[#0B1728]/80">
                      <span>Duration · {current.duration}</span>
                      <span>Travel · {current.travelTime}</span>
                    </div>
                    <div className="text-sm text-[#0B1728]/60">
                      Availability · {current.availability}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {current.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-[#0B1728]/80">
                        <span className="text-[#3BC9DB]">•</span>
                        {feature}
                      </div>
                    ))}
                    <div className="text-3xl font-semibold text-[#0B1728]">${current.price}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!current && deckFinished && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-[#0B1728]/60">
              <div>
                <p className="text-sm uppercase tracking-[0.3em]">Deck complete</p>
                <h3 className="text-3xl font-semibold mt-2">Review your tailored stack below.</h3>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-xl mx-auto mt-10 space-y-5">
          <div className="rounded-[40px] bg-white/80 border border-white/60 shadow-[0_15px_40px_rgba(11,23,40,0.12)] px-8 py-5 grid grid-cols-4 gap-4">
            <button
              onClick={undoLast}
              className="w-14 h-14 rounded-full bg-white/90 border border-white text-[#1971C2] shadow serenity-interactive flex items-center justify-center"
              aria-label="Undo last swipe"
            >
              <Undo2 />
            </button>
            <button
              onClick={handlePass}
              className="w-14 h-14 rounded-full bg-white border border-[#FF8787]/40 text-[#FF6B6B] serenity-interactive flex items-center justify-center"
              aria-label="Pass"
            >
              <X />
            </button>
            <button
              onClick={handleSuperLike}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B197FC] to-[#3BC9DB] text-white shadow-lg serenity-interactive flex items-center justify-center"
              aria-label="Super like"
            >
              <Star />
            </button>
            <button
              onClick={handleLike}
               className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1971C2] to-[#3BC9DB] text-white shadow-glow serenity-interactive flex items-center justify-center"
              aria-label="Like"
            >
              <Heart />
            </button>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <GradientButton
              onClick={() => current && setModalExperience(current)}
              className="px-10 disabled:opacity-50"
              disabled={!current}
            >
              Learn more
            </GradientButton>
            <button
              onClick={() => setMatchesOpen(true)}
              className="rounded-full border border-[#1971C2]/40 text-[#1971C2] px-10 py-3 font-semibold serenity-interactive disabled:opacity-50"
              disabled={!liked.length}
            >
              View matches ({liked.length})
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalExperience && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0B1728]/60 backdrop-blur-xl flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-[40px] md:rounded-[40px] w-full md:w-3/4 lg:w-1/2 max-h-[90vh] overflow-y-auto p-8"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#1971C2]/70">{modalExperience.location}</p>
                  <h3 className="text-3xl text-[#0B1728]">{modalExperience.title}</h3>
                </div>
                <button onClick={() => setModalExperience(null)} className="text-[#1971C2]">
                  Close
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {modalExperience.images.map((src) => (
                  <img key={src} src={src} alt="" className="rounded-[24px] w-full h-60 object-cover" loading="lazy" />
                ))}
              </div>
              <p className="mt-6 text-[#0B1728]/80">{modalExperience.description}</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                {modalExperience.features.map((feature) => (
                  <div key={feature} className="rounded-[20px] bg-[#E7F5FF] px-4 py-3 text-[#1971C2]">
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="text-3xl font-semibold text-[#0B1728]">${modalExperience.price}</div>
                <GradientButton>Book this experience</GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchesOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0B1728]/60 backdrop-blur-xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-[32px] w-full max-w-5xl max-h-[85vh] overflow-y-auto p-8"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">
                    Saved matches
                  </p>
                  <h3 className="text-3xl text-[#0B1728]">Your ritual shortlist</h3>
                </div>
                <button onClick={() => setMatchesOpen(false)} className="text-[#1971C2]">
                  Close
                </button>
              </div>
              {liked.length === 0 ? (
                <p className="text-[#0B1728]/60">Swipe right to save a few journeys first.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {liked.map((experience) => {
                    const isPriority = priority.some((item) => item.id === experience.id);
                    return (
                      <div
                        key={experience.id}
                        className="rounded-[24px] bg-white/85 border border-white/60 p-4 space-y-2"
                      >
                        {isPriority && (
                          <span className="text-xs uppercase tracking-[0.3em] text-[#B197FC]">
                            Priority
                          </span>
                        )}
                        <p className="text-sm text-[#0B1728]/70">{experience.location}</p>
                        <h4 className="text-xl font-semibold text-[#0B1728]">
                          {experience.title}
                        </h4>
                        <p className="text-sm text-[#0B1728]/60">
                          {experience.duration} • {experience.travelTime}
                        </p>
                        <p className="text-lg font-semibold text-[#1971C2]">
                          ${experience.price}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
