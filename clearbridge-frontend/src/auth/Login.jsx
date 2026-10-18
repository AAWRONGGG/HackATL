import React, { useId, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, FileSearch, ListChecks, ShieldCheck } from 'lucide-react';
import AccessibilityPanel from '../accessibility/AccessibilityPanel.jsx';
import { DEMO_EMAIL, DEMO_PASSWORD, signIn, startDemo } from './auth.js';

const POINTS = [
  [ListChecks, 'A checklist of the licenses and permits your Atlanta business needs'],
  [FileSearch, 'Upload your documents and see what still needs attention'],
  [ShieldCheck, 'Every requirement links to the official government source'],
];

function Field({ label, error, hint, children }) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && <small id={`${id}-hint`}>{hint}</small>}
      {error && <small id={`${id}-error`} className="auth-error-text">{error}</small>}
    </div>
  );
}

export default function Login({ onSignedIn }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter an email address like name@business.com.';
    if (!form.password) e.password = 'Enter your password.';
    return e;
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      // Wait for React to mark the fields invalid, then move focus to the first one.
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    try {
      onSignedIn(signIn(form));
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="auth">
      <section className="auth-brand" aria-label="About BizBridge">
        <div className="brand auth-logo">
          <span className="brandmark">C</span>
          <span>BizBridge<small>Business made simpler</small></span>
        </div>
        <div className="auth-pitch">
          <h2>Know what your business needs, and whether you have it.</h2>
          <ul>
            {POINTS.map(([Icon, text]) => (
              <li key={text}><span className="auth-point-icon"><Icon size={18} aria-hidden="true" /></span>{text}</li>
            ))}
          </ul>
        </div>
        <p className="auth-foot">Built for small businesses inside Atlanta city limits.</p>
      </section>

      <main className="auth-main">
        <div className="auth-topbar"><AccessibilityPanel /></div>
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to pick up where you left off.</p>

          <form ref={formRef} onSubmit={submit} noValidate>
            <Field label="Email" error={errors.email}>
              {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} />}
            </Field>
            <Field label="Password" error={errors.password}>
              {(p) => (
                <div className="auth-password">
                  <input
                    {...p}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>

            {formError && <p className="auth-form-error" role="alert">{formError}</p>}

            <button type="submit" className="auth-submit">
              Sign in <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button type="button" className="auth-demo" onClick={() => onSignedIn(startDemo())}>
            Explore with a demo account
          </button>

          <p className="auth-note">
            Demo account: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_PASSWORD}</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
