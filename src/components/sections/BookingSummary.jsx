import React, { useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExperiencesContext } from '../../contexts/ExperiencesContext';
import { GradientButton } from '../ui/GradientButton';

export function BookingSummary() {
  const { liked, priority } = useContext(ExperiencesContext);
  const [compareOpen, setCompareOpen] = useState(false);
  const [itineraryOpen, setItineraryOpen] = useState(false);

  if (liked.length < 3) return null;

  const comparison = useMemo(
    () =>
      liked.map((experience) => ({
        title: experience.title,
        duration: experience.duration,
        price: experience.price,
        score: experience.stressReductionScore,
        location: experience.location,
      })),
    [liked]
  );

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#E7F5FF] to-[#FFF9F4]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Booking summary</p>
            <h2 className="text-4xl text-[#0B1728] font-['Plus_Jakarta_Sans']">
              Your curated sanctuary stack
            </h2>
            <p className="text-sm text-[#0B1728]/60">
              {priority.length} experiences marked as priority
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCompareOpen(true)}
              className="rounded-full border border-[#1971C2]/30 text-[#1971C2] px-8 py-3 font-semibold"
            >
              Compare
            </button>
            <GradientButton>Proceed to book</GradientButton>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {liked.map((experience) => {
            const isPriority = priority.some((item) => item.id === experience.id);
            return (
              <motion.div
                key={experience.id}
                className="rounded-[32px] bg-white/80 border border-white/60 p-6 shadow-lg relative overflow-hidden serenity-interactive"
                whileHover={{ translateY: -6 }}
              >
                {isPriority && (
                  <span className="absolute top-4 right-4 text-xs uppercase tracking-[0.3em] text-[#B197FC]">
                    Priority
                  </span>
                )}
                <p className="text-sm uppercase tracking-[0.3em] text-[#1971C2]/70">{experience.location}</p>
                <h3 className="text-2xl text-[#0B1728] mt-2">{experience.title}</h3>
                <p className="text-sm text-[#0B1728]/70">{experience.duration}</p>
                <p className="text-sm text-[#0B1728]/60 mt-3">{experience.features[0]}</p>
                <div className="text-2xl font-semibold text-[#1971C2] mt-4">${experience.price}</div>
                <button
                  onClick={() => setItineraryOpen(experience)}
                  className="mt-4 text-sm text-[#1971C2] underline"
                >
                  View details
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {compareOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0B1728]/60 backdrop-blur-xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-[32px] w-11/12 max-w-4xl p-8 overflow-auto max-h-[90vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#0B1728]">Experience comparison</h3>
                <button onClick={() => setCompareOpen(false)} className="text-[#1971C2]">
                  Close
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#0B1728]/80">
                  <thead>
                    <tr>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Stress Score</th>
                      <th className="pb-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row) => (
                      <tr key={row.title} className="border-t border-[#E7F5FF]">
                        <td className="py-3 font-semibold text-[#0B1728]">{row.title}</td>
                        <td className="py-3">{row.location}</td>
                        <td className="py-3">{row.duration}</td>
                        <td className="py-3">{row.score}%</td>
                        <td className="py-3">${row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itineraryOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#0B1728]/70 backdrop-blur-xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-[40px] w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 space-y-6"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#1971C2]/70">{itineraryOpen.location}</p>
                  <h3 className="text-3xl text-[#0B1728]">{itineraryOpen.title}</h3>
                </div>
                <button onClick={() => setItineraryOpen(null)} className="text-[#1971C2]">
                  Close
                </button>
              </div>
              <p className="text-sm text-[#0B1728]/70">Includes {itineraryOpen.features.join(', ')}</p>
              <div className="space-y-3">
                {itineraryOpen.experience?.daily?.slice(0, 5).map((line) => (
                  <div key={line} className="p-3 rounded-2xl bg-[#E7F5FF] text-sm text-[#0B1728]">
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
