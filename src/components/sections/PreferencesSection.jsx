import React, { useContext, useEffect, useMemo, useState } from 'react';
import { animate, motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, MapPin, CalendarDays } from 'lucide-react';
import { PreferencesContext } from '../../contexts/PreferencesContext';
import { GlassCard } from '../ui/GlassCard';

const experienceOptions = [
  'Ocean rituals',
  'Mountain silence',
  'Forest therapy',
  'Sound baths',
  'Movement play',
  'Spa cocoon',
];

const ritualPaceOptions = [
  { label: 'Hold me gently', value: 'guided', description: 'AI concierge orchestrates everything' },
  { label: 'Balanced structure', value: 'balanced', description: 'Mix of planned + open exploration' },
  { label: 'Let me roam', value: 'loose', description: 'Minimal structure, intuitive flow' },
];

const timeWindows = [
  { label: 'Next 2 weeks', value: 'soon' },
  { label: 'Next month', value: 'next-month' },
  { label: '2+ months', value: 'later' },
];

const destinationLibrary = ['Bali', 'Swiss Alps', 'Lisbon', 'Kyoto', 'Patagonia', 'Lofoten', 'Sedona', 'Iceland'];

export function PreferencesSection() {
  const context = useContext(PreferencesContext);
  if (!context) {
    return <div className="py-24 px-6">Loading preferences...</div>;
  }
  const { preferences, updatePreference, toggleExperience } = context;
  const [locationQuery, setLocationQuery] = useState(preferences?.location ?? '');
  const [intensityDisplay, setIntensityDisplay] = useState(preferences?.intensity ?? 40);
  const [celebrate, setCelebrate] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (!preferences?.intensity) return;
    const controls = animate(intensityDisplay, preferences.intensity, {
      duration: 0.45,
      onUpdate: (latest) => setIntensityDisplay(Math.round(latest)),
      ease: 'easeInOut',
    });
    return () => controls.stop();
  }, [preferences?.intensity, intensityDisplay]);

  const completion = useMemo(() => {
    if (!preferences) return 0;
    const checkpoints = [
      Boolean(preferences.travelMood),
      preferences.experiences?.length > 0,
      Boolean(preferences.date),
      Boolean(preferences.location),
      Boolean(preferences.timeWindow),
      Boolean(preferences.ritualPace),
    ];
    const filled = checkpoints.filter(Boolean).length;
    return Math.round((filled / checkpoints.length) * 100);
  }, [preferences]);

  const locationSuggestions = useMemo(() => {
    // Always show suggestions when input is focused or empty
    if (!locationQuery || locationQuery.trim() === '') {
      return destinationLibrary;
    }
    // Filter based on query
    const filtered = destinationLibrary.filter((city) =>
      city.toLowerCase().includes(locationQuery.toLowerCase())
    );
    // If no matches, show all; otherwise show filtered results
    return filtered.length > 0 ? filtered : destinationLibrary;
  }, [locationQuery]);

  const handleExperience = (item) => {
    toggleExperience(item);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 900);
  };

  return (
    <section
      id="preferences"
      data-cinematic-section="2"
      className="py-24 px-6 bg-gradient-to-b from-[#F8FBFF] to-[#FFF9F4]"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-[#1971C2]">Preferences</p>
          <h2 className="text-4xl font-['Plus_Jakarta_Sans'] text-[#0B1728]">
            Answer softly—our questionnaire feels like a conversation.
          </h2>
          <p className="text-[#0B1728]/70 max-w-3xl mx-auto">
            Each response shapes how the AI agent curates your ritual packs, so take a breath and respond with how you
            truly feel today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <GlassCard className="p-8 space-y-6" data-cinematic-content="2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Emotional slider</p>
                  <h3 className="text-2xl text-[#0B1728]">How intense should this trip feel?</h3>
                </div>
                <motion.span
                  key={intensityDisplay}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl text-[#1971C2] font-semibold"
                >
                  {intensityDisplay}%
                </motion.span>
              </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preferences?.intensity ?? 40}
                  onChange={(e) => updatePreference('intensity', Number(e.target.value))}
                  className="w-full accent-[#3BC9DB]"
                />
              <div className="flex justify-between text-sm text-[#0B1728]/60">
                <span>Restorative</span>
                <span>Transformative</span>
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-6" data-cinematic-content="2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Travel tone</p>
                  <h3 className="text-2xl text-[#0B1728]">Select what your nervous system craves</h3>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3BC9DB] to-[#B197FC]" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {['still', 'playful', 'ceremonial'].map((tone) => (
                  <motion.button
                    key={tone}
                    onClick={() => updatePreference('travelMood', tone)}
                    whileTap={{ scale: 0.96 }}
                    className={`px-4 py-3 rounded-2xl text-left transition serenity-interactive ${
                      preferences?.travelMood === tone
                        ? 'bg-gradient-to-r from-[#3BC9DB] to-[#51CF66] text-white shadow-lg'
                        : 'bg-white/70 text-[#0B1728]'
                    }`}
                  >
                    <p className="font-semibold capitalize">{tone}</p>
                    <p className="text-xs text-white/80">
                      {tone === 'still'
                        ? 'Soft, reflective, dreamy'
                        : tone === 'playful'
                          ? 'Light movement + delight'
                          : 'Ceremony, intention, depth'}
                    </p>
                  </motion.button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-4" data-cinematic-content="2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Energy palette</p>
                  <h3 className="text-2xl text-[#0B1728]">Choose rituals that speak to you</h3>
                </div>
                <Sparkles className="text-[#B197FC]" />
              </div>
              <div className="flex flex-wrap gap-3">
                {experienceOptions.map((item) => {
                  const selected = preferences?.experiences?.includes(item) ?? false;
                  return (
                    <button
                      key={item}
                      onClick={() => handleExperience(item)}
                      className={`serenity-tag px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 ${
                        selected
                          ? 'selected text-white'
                          : 'bg-white/70 border border-transparent text-[#0B1728]'
                      }`}
                    >
                      {selected && <Check size={14} />}
                      {item}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {celebrate && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-sm text-[#1971C2] inline-flex items-center gap-1"
                  >
                    <Sparkles size={14} />
                    Ritual logged. Beautiful choice.
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Timing</p>
                  <h3 className="text-2xl text-[#0B1728]">When do you want to feel different?</h3>
                </div>
                <CalendarDays className="text-[#1971C2]" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#1971C2]/70">Date</p>
                  <input
                    type="date"
                    value={preferences?.date ?? ''}
                    onChange={(e) => updatePreference('date', e.target.value)}
                    className="mt-2 w-full rounded-[20px] border border-[#1971C2]/20 px-4 py-3 bg-white/80"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#1971C2]/70">Time window</p>
                  <select
                    value={preferences?.timeWindow ?? ''}
                    onChange={(e) => updatePreference('timeWindow', e.target.value)}
                    className="mt-2 w-full rounded-[20px] border border-[#1971C2]/20 px-4 py-3 bg-white/80 text-[#0B1728]"
                  >
                    <option value="">Select</option>
                    {timeWindows.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Budget range</p>
                  <h3 className="text-2xl text-[#0B1728]">We’ll stay within your comfort</h3>
                </div>
              </div>
              <div className="grid gap-3">
                <label className="text-xs text-[#0B1728]/60">Minimum</label>
                <input
                  type="range"
                  min="300"
                  max={(preferences?.budget?.[1] ?? 3200) - 100}
                  value={preferences?.budget?.[0] ?? 800}
                  onChange={(e) =>
                    updatePreference('budget', [Number(e.target.value), preferences?.budget?.[1] ?? 3200])
                  }
                  className="w-full accent-[#1971C2]"
                />
                <label className="text-xs text-[#0B1728]/60">Maximum</label>
                <input
                  type="range"
                  min={(preferences?.budget?.[0] ?? 800) + 100}
                  max="9000"
                  value={preferences?.budget?.[1] ?? 3200}
                  onChange={(e) =>
                    updatePreference('budget', [preferences?.budget?.[0] ?? 800, Number(e.target.value)])
                  }
                  className="w-full accent-[#3BC9DB]"
                />
                <div className="text-sm text-[#0B1728]/70">
                  ${preferences?.budget?.[0] ?? 800} – ${preferences?.budget?.[1] ?? 3200}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Location</p>
                  <h3 className="text-2xl text-[#0B1728]">Any landscapes calling to you?</h3>
                </div>
                <MapPin className="text-[#1971C2]" />
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocationQuery(value);
                      updatePreference('location', value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Type a city or landscape"
                    className="w-full rounded-[20px] border-2 border-[#1971C2]/30 px-4 py-3 bg-white/90 focus:outline-none focus:border-[#1971C2] focus:ring-2 focus:ring-[#1971C2]/20 text-[#0B1728] placeholder:text-[#94A3B8]"
                    autoComplete="off"
                  />
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1971C2] pointer-events-none" size={20} />
                </div>
                <AnimatePresence>
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-[20px] bg-white border-2 border-[#E7F5FF] shadow-lg p-4 space-y-2 max-h-64 overflow-y-auto z-50"
                    >
                    <p className="text-xs font-semibold text-[#1971C2] px-2 mb-2 uppercase tracking-wider">Popular Destinations</p>
                    <div className="space-y-1">
                      {locationSuggestions.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            updatePreference('location', city);
                            setLocationQuery(city);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-[16px] hover:bg-[#E7F5FF] transition-colors text-[#0B1728] cursor-pointer flex items-center gap-2 group"
                        >
                          <MapPin size={16} className="text-[#1971C2] group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{city}</span>
                        </button>
                      ))}
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="rounded-[24px] bg-gradient-to-br from-[#E7F5FF] via-white to-[#FFE8CC] p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#1971C2]/70">Preview</p>
                  <p className="text-xl font-semibold text-[#0B1728]">
                    {preferences?.location || 'Tap a suggestion'}
                  </p>
                  <p className="text-sm text-[#0B1728]/60">We’ll source nearby flights + spa slots</p>
                </div>
                <div className="w-20 h-20 rounded-full border border-white/60 flex items-center justify-center text-[#1971C2]">
                  <MapPin />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-36 h-36">
            <svg width="100%" height="100%" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#E7F5FF" strokeWidth="18" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#mandalaGradient)"
                strokeWidth="18"
                fill="none"
                strokeDasharray={Math.PI * 2 * 70}
                strokeDashoffset={((100 - completion) / 100) * Math.PI * 2 * 70}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="mandalaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1971C2" />
                  <stop offset="50%" stopColor="#3BC9DB" />
                  <stop offset="100%" stopColor="#51CF66" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0B1728]">
              <span className="text-3xl font-semibold">{completion}%</span>
              <span className="text-xs uppercase tracking-[0.3em] text-[#0B1728]/60">complete</span>
            </div>
          </div>
          <div className="text-center md:text-left space-y-2 text-[#0B1728]/70">
            <p>
              {completion === 100
                ? 'Beautiful—your preferences are locked. Ready for curated experiences.'
                : 'Answer the prompts above to unlock deeper personalization.'}
            </p>
          </div>
          <button className="rounded-full bg-gradient-to-r from-[#1971C2] via-[#3BC9DB] to-[#B197FC] text-white px-10 py-4 text-lg font-semibold shadow-lg hover:translate-y-[-2px] transition serenity-interactive">
            Save & Continue
          </button>
        </div>
      </div>
    </section>
  );
}
