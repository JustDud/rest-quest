import React from 'react';
import { EmotionalProvider } from '../contexts/EmotionalContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { ExperiencesProvider } from '../contexts/ExperiencesContext';
import { PreferenceAutoSync } from '../components/system/PreferenceAutoSync';

export function AppProviders({ children }) {
  return (
    <EmotionalProvider>
      <PreferencesProvider>
        <ExperiencesProvider>
          <PreferenceAutoSync />
          {children}
        </ExperiencesProvider>
      </PreferencesProvider>
    </EmotionalProvider>
  );
}
