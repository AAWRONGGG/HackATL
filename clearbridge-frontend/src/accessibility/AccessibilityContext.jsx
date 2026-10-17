import React, { createContext, useContext, useEffect, useState } from 'react';
import { applySettings, defaultSettings, loadSettings, saveSettings } from './settings.js';
import { usePageTranslation } from './translate.js';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  const translation = usePageTranslation(settings.language);

  function update(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function reset() {
    setSettings({ ...defaultSettings(), language: 'en' });
  }

  return (
    <AccessibilityContext.Provider value={{ settings, update, reset, translation }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) throw new Error('useAccessibility must be used inside <AccessibilityProvider>');
  return value;
}
