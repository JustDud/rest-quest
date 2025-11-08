import React from 'react';
import { EmotionalProvider } from '../contexts/EmotionalContext';
import { PreferencesProvider } from '../contexts/PreferencesContext';
import { ExperiencesProvider } from '../contexts/ExperiencesContext';

export function AppProviders({ children }) {
  return (
    <EmotionalProvider>
      <PreferencesProvider>
        <ExperiencesProvider>{children}</ExperiencesProvider>
      </PreferencesProvider>
    </EmotionalProvider>
  );
}
