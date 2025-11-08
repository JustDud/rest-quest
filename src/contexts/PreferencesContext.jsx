import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'serenity-preferences';

export const PreferencesContext = createContext(null);

const defaultState = {
  travelMood: '',
  intensity: 40,
  experiences: [],
  budget: [800, 3200],
  date: '',
  location: '',
  timeWindow: '',
  ritualPace: '',
};

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') return defaultState;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleExperience = useCallback((value) => {
    setPreferences((prev) => {
      const exists = prev.experiences.includes(value);
      const experiences = exists
        ? prev.experiences.filter((item) => item !== value)
        : [...prev.experiences, value];
      return { ...prev, experiences };
    });
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      updatePreference,
      toggleExperience,
    }),
    [preferences, updatePreference, toggleExperience]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
