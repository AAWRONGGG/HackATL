// Accessibility settings: saved per device, applied as attributes on <html>
// so every page and stylesheet can react to them (see accessibility.css).

export const SETTINGS_KEY = 'clearbridge-accessibility-v1';

export const TEXT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文 (简体)' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
];

function systemPrefers(query) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

// First visit follows the device's own settings.
export function defaultSettings() {
  return {
    textSize: 'medium',
    darkMode: systemPrefers('(prefers-color-scheme: dark)'),
    highContrast: systemPrefers('(prefers-contrast: more)'),
    dyslexiaFont: false,
    reduceMotion: systemPrefers('(prefers-reduced-motion: reduce)'),
    language: 'en',
  };
}

export function loadSettings() {
  const defaults = defaultSettings();
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    return {
      textSize: TEXT_SIZES.some((t) => t.value === saved.textSize) ? saved.textSize : defaults.textSize,
      darkMode: typeof saved.darkMode === 'boolean' ? saved.darkMode : defaults.darkMode,
      highContrast: typeof saved.highContrast === 'boolean' ? saved.highContrast : defaults.highContrast,
      dyslexiaFont: saved.dyslexiaFont === true,
      reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : defaults.reduceMotion,
      language: LANGUAGES.some((l) => l.value === saved.language) ? saved.language : 'en',
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* Storage blocked: settings still apply for this visit. */
  }
}

export function applySettings(settings) {
  const root = document.documentElement;
  root.dataset.textSize = settings.textSize;
  root.dataset.theme = settings.darkMode ? 'dark' : 'light';
  if (settings.highContrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
  if (settings.dyslexiaFont) root.dataset.dyslexia = 'true';
  else delete root.dataset.dyslexia;
  if (settings.reduceMotion) root.dataset.reduceMotion = 'true';
  else delete root.dataset.reduceMotion;
  root.lang = settings.language;
  root.style.colorScheme = settings.darkMode ? 'dark' : 'light';
}
