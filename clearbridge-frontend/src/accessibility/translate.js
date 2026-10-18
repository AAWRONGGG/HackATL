// Translates whatever is on the page (text and placeholder/aria-label/title attributes)
// through the BizBridge backend's /translate endpoint, and keeps new content translated
// as React re-renders. Only text node values are changed, never the DOM structure,
// so React keeps working normally. Switching back to English restores the originals.

import { useEffect, useState } from 'react';

const TRANSLATION_API_URL = (
  import.meta.env.VITE_TRANSLATION_API_URL ||
  "http://127.0.0.1:8001"
).replace(/\/+$/, "");

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CACHE_PREFIX = 'bizbridge-translations-v1:';
const ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG']);
const BATCH_SIZE = 60;
const MAX_LENGTH = 2000;

function shouldTranslate(text) {
  const t = text.trim();
  return t.length > 0 && t.length <= MAX_LENGTH && /\p{L}/u.test(t);
}

function isSkipped(element) {
  for (let el = element; el; el = el.parentElement) {
    if (SKIP_TAGS.has(el.tagName.toUpperCase()) || el.hasAttribute?.('data-no-translate')) return true;
  }
  return false;
}

function splitSpace(text) {
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return { lead: match[1], core: match[2], trail: match[3] };
}

class PageTranslator {
  constructor(onStatus) {
    this.onStatus = onStatus;
    this.language = 'en';
    this.textNodes = new Map(); // node -> { original, applied }
    this.attrs = new Map(); // element -> { [attr]: { original, applied } }
    this.cache = {};
    this.pending = null;
    this.observer = new MutationObserver(() => this.schedule());
    this.runId = 0;
  }

  loadCache(lang) {
    if (this.cache[lang]) return this.cache[lang];
    try {
      this.cache[lang] = JSON.parse(window.localStorage.getItem(CACHE_PREFIX + lang) || '{}');
    } catch {
      this.cache[lang] = {};
    }
    return this.cache[lang];
  }

  saveCache(lang) {
    try {
      window.localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(this.cache[lang]));
    } catch {
      /* Cache is optional. */
    }
  }

  setLanguage(lang) {
    this.language = lang;
    this.runId += 1;
    if (lang === 'en') {
      this.observer.disconnect();
      this.restore();
      this.onStatus({ status: 'idle' });
      return;
    }
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    });
    this.translatePage();
  }

  schedule() {
    clearTimeout(this.pending);
    this.pending = setTimeout(() => this.translatePage(), 120);
  }

  // Find everything that needs translating, recording the English original for each.
  collect() {
    const items = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const value = node.nodeValue;
      const known = this.textNodes.get(node);
      if (known && value === known.applied) continue; // already shows our translation
      if (!shouldTranslate(value) || isSkipped(node.parentElement)) continue;
      const entry = { original: value, applied: null };
      this.textNodes.set(node, entry);
      items.push({ kind: 'text', node, entry });
    }
    const selector = ATTRIBUTES.map((a) => `[${a}]`).join(',');
    for (const el of document.body.querySelectorAll(selector)) {
      if (isSkipped(el)) continue;
      let record = this.attrs.get(el);
      for (const attr of ATTRIBUTES) {
        const value = el.getAttribute(attr);
        if (value == null) continue;
        if (record?.[attr] && value === record[attr].applied) continue;
        if (!shouldTranslate(value)) continue;
        record = record || {};
        record[attr] = { original: value, applied: null };
        this.attrs.set(el, record);
        items.push({ kind: 'attr', el, attr, entry: record[attr] });
      }
    }
    return items;
  }

  apply(items, dict) {
    this.observer.disconnect();
    for (const item of items) {
      const { lead, core, trail } = splitSpace(item.entry.original);
      const translated = dict[core];
      if (!translated) continue;
      const text = lead + translated + trail;
      item.entry.applied = text;
      if (item.kind === 'text') {
        if (item.node.isConnected) item.node.nodeValue = text;
      } else if (item.el.isConnected) {
        item.el.setAttribute(item.attr, text);
      }
    }
    if (this.language !== 'en') {
      this.observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRIBUTES,
      });
    }
  }

  async translatePage() {
    const lang = this.language;
    const run = this.runId;
    if (lang === 'en') return;
    const items = this.collect();
    if (!items.length) return;

    const dict = this.loadCache(lang);
    this.apply(items, dict); // instant for anything seen before

    const missing = [...new Set(items.map((i) => splitSpace(i.entry.original).core))].filter((t) => !dict[t]);
    if (!missing.length) return;

    this.onStatus({ status: 'working' });
    try {
      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const res = await fetch(`${TRANSLATION_API_URL}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang, texts: batch }),
        });
        if (!res.ok) {
          let detail = '';
          try { detail = (await res.json()).detail; } catch { /* not JSON */ }
          throw new Error(typeof detail === 'string' && detail ? detail : `Translation failed (${res.status}).`);
        }
        const { translations } = await res.json();
        batch.forEach((text, j) => { if (translations[j]) dict[text] = translations[j]; });
        this.saveCache(lang);
        if (run !== this.runId) return; // language changed while we waited
        this.apply(items, dict);
      }
      this.onStatus({ status: 'idle' });
    } catch (err) {
      if (run !== this.runId) return;
      const offline = err instanceof TypeError; // fetch couldn't reach the server
      this.onStatus({
        status: 'error',
        message: offline
          ? 'Translation needs the BizBridge server. Start the backend and pick the language again.'
          : err.message,
      });
    }
  }

  restore() {
    for (const [node, entry] of this.textNodes) {
      if (node.isConnected && entry.applied && node.nodeValue === entry.applied) node.nodeValue = entry.original;
    }
    for (const [el, record] of this.attrs) {
      if (!el.isConnected) continue;
      for (const [attr, entry] of Object.entries(record)) {
        if (entry.applied && el.getAttribute(attr) === entry.applied) el.setAttribute(attr, entry.original);
      }
    }
    this.textNodes.clear();
    this.attrs.clear();
  }
}

let translator = null;

export function usePageTranslation(language) {
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => {
    if (!translator) translator = new PageTranslator((s) => setState(s));
    translator.onStatus = (s) => setState(s);
    // Let React finish rendering before reading the page.
    const t = setTimeout(() => translator.setLanguage(language), 0);
    return () => clearTimeout(t);
  }, [language]);

  return state;
}
