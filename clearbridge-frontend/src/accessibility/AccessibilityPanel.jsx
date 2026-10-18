import React, { useEffect, useId, useRef, useState } from 'react';
import { Accessibility, Contrast, Languages, Moon, Pause, RotateCcw, Type, X } from 'lucide-react';
import { useAccessibility } from './AccessibilityContext.jsx';
import { LANGUAGES, TEXT_SIZES } from './settings.js';

function Switch({ icon: Icon, label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="a11y-row">
      <Icon size={18} aria-hidden="true" />
      <div className="a11y-row-text">
        <span id={id}>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        className="a11y-switch"
        onClick={() => onChange(!checked)}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

export default function AccessibilityPanel({ open: controlledOpen, onClose, returnFocusRef }) {
  const { settings, update, reset, translation } = useAccessibility();
  const [localOpen, setLocalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : localOpen;
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const titleId = useId();
  const languageId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const trigger = returnFocusRef?.current || buttonRef.current;
    function close() {
      if (controlled) onClose();
      else setLocalOpen(false);
    }
    panelRef.current?.querySelector('input, button, select')?.focus();
    function onKey(event) {
      if (event.key === 'Escape') {
        close();
        trigger?.focus();
      }
    }
    function onPointer(event) {
      if (!panelRef.current?.contains(event.target) && !trigger?.contains(event.target)) close();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onPointer);
    };
  }, [open, controlled, onClose, returnFocusRef]);

  return (
    <div className={controlled ? 'a11y a11y-account' : 'a11y'}>
      {!controlled && <button
        ref={buttonRef}
        type="button"
        className="a11y-trigger"
        aria-expanded={open}
        aria-controls="a11y-panel"
        onClick={() => setLocalOpen((o) => !o)}
      >
        <Accessibility size={18} aria-hidden="true" />
        <span>Accessibility</span>
      </button>}

      {open && (
        <div id="a11y-panel" ref={panelRef} className="a11y-panel" role="dialog" aria-labelledby={titleId}>
          <div className="a11y-head">
            <h2 id={titleId}>Accessibility</h2>
            <button type="button" className="a11y-close" aria-label="Close accessibility settings" onClick={() => { if (controlled) onClose(); else setLocalOpen(false); (returnFocusRef?.current || buttonRef.current)?.focus(); }}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="a11y-sizes">
            <legend><Type size={18} aria-hidden="true" /> Text size</legend>
            <div className="a11y-size-options">
              {TEXT_SIZES.map((size, i) => (
                <label key={size.value} className={settings.textSize === size.value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="a11y-text-size"
                    value={size.value}
                    checked={settings.textSize === size.value}
                    onChange={() => update('textSize', size.value)}
                  />
                  <span className="a11y-size-sample" style={{ fontSize: `${13 + i * 3}px` }} aria-hidden="true">Aa</span>
                  <span>{size.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Switch icon={Moon} label="Dark mode" checked={settings.darkMode} onChange={(v) => update('darkMode', v)} />
          <Switch icon={Contrast} label="High contrast" hint="Stronger colors and borders" checked={settings.highContrast} onChange={(v) => update('highContrast', v)} />
          <Switch icon={Type} label="Dyslexia-friendly font" hint="Easier-to-read letter shapes" checked={settings.dyslexiaFont} onChange={(v) => update('dyslexiaFont', v)} />
          <Switch icon={Pause} label="Reduce motion" hint="Turns off animations" checked={settings.reduceMotion} onChange={(v) => update('reduceMotion', v)} />

          <div className="a11y-language">
            <label htmlFor={languageId}><Languages size={18} aria-hidden="true" /> Language</label>
            <select
              id={languageId}
              value={settings.language}
              onChange={(e) => update('language', e.target.value)}
              data-no-translate
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value} lang={l.value}>{l.label}</option>)}
            </select>
            <p className={`a11y-status ${translation.status === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
              {translation.status === 'working' && 'Translating…'}
              {translation.status === 'error' && translation.message}
            </p>
          </div>

          <button type="button" className="a11y-reset" onClick={reset}>
            <RotateCcw size={15} aria-hidden="true" /> Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}
