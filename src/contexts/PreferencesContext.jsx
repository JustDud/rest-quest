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
  const [lockedPreferences, setLockedPreferences] = useState({});

  const valuesEqual = useCallback((left, right) => {
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) return false;
      return left.every((value, index) => value === right[index]);
    }
    return left === right;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(
    (key, value, options = {}) => {
      const source = options.source ?? 'user';
      setPreferences((prev) => {
        if (valuesEqual(prev[key], value)) {
          return prev;
        }
        return { ...prev, [key]: value };
      });
      if (source === 'user') {
        setLockedPreferences((prev) => {
          if (prev[key]) return prev;
          return { ...prev, [key]: true };
        });
      }
    },
    [valuesEqual]
  );

  const autoUpdatePreference = useCallback(
    (key, value) => {
      setPreferences((prev) => {
        if (lockedPreferences[key]) {
          return prev;
        }
        if (valuesEqual(prev[key], value)) {
          return prev;
        }
        return { ...prev, [key]: value };
      });
    },
    [lockedPreferences, valuesEqual]
  );

  const unlockPreference = useCallback((key) => {
    setLockedPreferences((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleExperience = useCallback((value) => {
    setPreferences((prev) => {
      const exists = prev.experiences.includes(value);
      const experiences = exists
        ? prev.experiences.filter((item) => item !== value)
        : [...prev.experiences, value];
      return { ...prev, experiences };
    });
    setLockedPreferences((prev) => (prev.experiences ? prev : { ...prev, experiences: true }));
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      updatePreference,
      autoUpdatePreference,
      unlockPreference,
      lockedPreferences,
      toggleExperience,
    }),
    [preferences, updatePreference, autoUpdatePreference, unlockPreference, lockedPreferences, toggleExperience]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
