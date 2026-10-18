// Demo-only sign-in for the hackathon: one hardcoded account, no backend, no real security.
// Change the credentials below if you like.

export const DEMO_EMAIL = 'demo@bizbridge.app';
export const DEMO_PASSWORD = 'bizbridge';

const SESSION_KEY = 'bizbridge-session-v1';

function read(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage blocked: you stay signed in until the page reloads. */
  }
}

const normalizeEmail = (email) => email.trim().toLowerCase();

export function getSession() {
  const s = read(SESSION_KEY, null);
  return s && s.email ? s : null;
}

export function signOut() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function signIn({ email, password }) {
  if (normalizeEmail(email) !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error("That email and password don't match. Use the demo account shown below.");
  }
  return startDemo();
}

export function startDemo() {
  const session = { email: DEMO_EMAIL, name: 'Demo owner', businessName: 'Peachtree Coffee', demo: true };
  write(SESSION_KEY, session);
  return session;
}

export function initials(session) {
  const source = session?.name || session?.email || '';
  const parts = source.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}
