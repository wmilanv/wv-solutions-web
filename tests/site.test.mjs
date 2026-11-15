import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const html = read('index.html');
const css = read('css/styles.css');
const appJs = read('js/app.js');

test('Security: index.html enforces CSP, referrer policy, and safe external links', () => {
  assert.match(html, /<meta[^>]+http-equiv="Content-Security-Policy"/i);
  assert.match(html, /<meta[^>]+name="referrer"[^>]+content="strict-origin-when-cross-origin"/i);

  const blankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)];
  assert.ok(blankLinks.length > 0, 'Expected at least one external target="_blank" link');
  for (const [tag] of blankLinks) {
    assert.match(tag, /rel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/i, `Missing noopener noreferrer on: ${tag}`);
  }
});

test('Security: js/app.js contains zero unsafe DOM or eval sinks', () => {
  const forbidden = [
    /\.innerHTML\s*=/,
    /\.outerHTML\s*=/,
    /\.insertAdjacentHTML\s*\(/,
    /document\.write\s*\(/,
    /\beval\s*\(/,
    /\bnew\s+Function\s*\(/
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(appJs, pattern, `Forbidden sink matched: ${pattern}`);
  }
});

test('Security: multi-platform hosting configs define enterprise security headers', () => {
  const requiredHeaders = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ];

  const vercel = JSON.parse(read('vercel.json'));
  const vercelHeaders = vercel.headers[0].headers.map((h) => h.key);
  for (const h of requiredHeaders) {
    assert.ok(vercelHeaders.includes(h), `vercel.json missing header: ${h}`);
  }

  const netlifyHeaders = read('_headers');
  const htaccess = read('.htaccess');
  for (const h of requiredHeaders) {
    assert.ok(netlifyHeaders.includes(h), `_headers missing header: ${h}`);
    assert.ok(htaccess.includes(h), `.htaccess missing header: ${h}`);
  }

  assert.ok(read('.well-known/security.txt').includes('Contact:'));
  assert.ok(read('robots.txt').includes('User-agent:'));
});

test('Accessibility & Semantics: landmarks, skip-link, images, anchors, and JSON-LD are valid', () => {
  assert.match(html, /<html\s+lang="es">/i);
  assert.match(html, /class="skip-link"[^>]+href="#contenido-principal"/i);
  assert.match(html, /<header\b/i);
  assert.match(html, /<main\b[^>]*id="contenido-principal"/i);
  assert.match(html, /<footer\b[^>]*id="contacto"/i);

  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const hashLinks = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hashLinks.length > 0);
  for (const target of hashLinks) {
    assert.ok(ids.has(target), `Broken internal anchor #${target}`);
  }

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  assert.ok(imgs.length >= 2);
  for (const [imgTag] of imgs) {
    assert.match(imgTag, /\balt="[^"]+"/i, `Missing alt on ${imgTag}`);
    assert.match(imgTag, /\bwidth="\d+"/i, `Missing width on ${imgTag}`);
    assert.match(imgTag, /\bheight="\d+"/i, `Missing height on ${imgTag}`);
  }

  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(ldMatch, 'Missing JSON-LD structured data');
  const ld = JSON.parse(ldMatch[1]);
  assert.equal(ld['@type'], 'ProfessionalService');
  assert.equal(ld.name, 'WV Solutions');
});

test('CSS: includes focus-visible, reduced-motion, and balanced braces', () => {
  assert.match(css, /:focus-visible\s*\{/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  assert.equal(opens, closes, 'Unbalanced CSS braces');
});

function createDomSandbox() {
  const byId = new Map();
  let activeElement = null;

  class MockElement {
    constructor(tagName, id = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.children = [];
      this.parentNode = null;
      this.attributes = new Map();
      this.listeners = new Map();
      this._classSet = new Set();
      this._textContent = '';
      this.tabIndex = 0;
      this.href = '';
      this.hidden = false;
      this.complete = true;
      this.naturalWidth = 100;
      this.offsetWidth = 100;
      this.classList = {
        add: (...cls) => cls.forEach((c) => this._classSet.add(c)),
        remove: (...cls) => cls.forEach((c) => this._classSet.delete(c)),
        contains: (c) => this._classSet.has(c),
        toggle: (c, force) => {
          if (force === undefined) {
            if (this._classSet.has(c)) { this._classSet.delete(c); return false; }
            this._classSet.add(c); return true;
          }
          if (force) this._classSet.add(c); else this._classSet.delete(c);
          return force;
        }
      };
      if (id) byId.set(id, this);
    }

    set className(val) {
      this._classSet = new Set(String(val).split(/\s+/).filter(Boolean));
    }
    get className() {
      return [...this._classSet].join(' ');
    }
    set textContent(val) {
      this._textContent = String(val);
      this.children = [];
    }
    get textContent() {
      if (this.children.length === 0) return this._textContent;
      return this.children.map((c) => c.textContent).join('');
    }
    setAttribute(k, v) {
      if (k === 'id') { this.id = String(v); byId.set(this.id, this); }
      this.attributes.set(k, String(v));
    }
    getAttribute(k) {
      return this.attributes.has(k) ? this.attributes.get(k) : null;
    }
    appendChild(node) {
      if (node.isFragment) {
        for (const child of node.children) this.appendChild(child);
        node.children = [];
        return node;
      }
      node.parentNode = this;
      this.children.push(node);
      return node;
    }
    replaceChildren(...nodes) {
      this.children = [];
      for (const n of nodes) this.appendChild(n);
    }
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    }
    dispatchEvent(event) {
      event.target = event.target || this;
      event.preventDefault = event.preventDefault || (() => {});
      let cur = this;
      while (cur) {
        const handlers = cur.listeners.get(event.type) || [];
        for (const h of handlers) h.call(cur, event);
        cur = cur.parentNode;
      }
    }
    closest(selector) {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        let cur = this;
        while (cur) {
          if (cur.classList && cur.classList.contains(cls)) return cur;
          cur = cur.parentNode;
        }
      }
      return null;
    }
    contains(node) {
      let cur = node;
      while (cur) {
        if (cur === this) return true;
        cur = cur.parentNode;
      }
      return false;
    }
    focus() {
      activeElement = this;
    }
    querySelectorAll(selector) {
      const res = [];
      const walk = (el) => {
        for (const c of el.children) {
          if (selector === 'a' && c.tagName === 'A') res.push(c);
          walk(c);
        }
      };
      walk(this);
      return res;
    }
  }

  const root = new MockElement('body');
  const siteHeader = new MockElement('header', 'siteHeader');
  const nav = new MockElement('nav', 'nav');
  for (const href of ['#inicio', '#nosotros', '#equipo', '#servicios', '#metodologia', '#contacto']) {
    const a = new MockElement('a');
    a.setAttribute('href', href);
    nav.appendChild(a);
  }
  const menuBtn = new MockElement('button', 'menuBtn');
  const svcTabs = new MockElement('div', 'svcTabs');
  const svcPanel = new MockElement('div', 'svcPanel');
  const svcTitle = new MockElement('h3', 'svcTitle');
  const svcWhat = new MockElement('p', 'svcWhat');
  const svcFlow = new MockElement('div', 'svcFlow');
  const svcCta = new MockElement('a', 'svcCta');
  const svcProcs = new MockElement('div', 'svcProcs');
  const year = new MockElement('span', 'year');
  const toTopBtn = new MockElement('button', 'toTopBtn');

  [siteHeader, nav, menuBtn, svcTabs, svcPanel, svcTitle, svcWhat, svcFlow, svcCta, svcProcs, year, toTopBtn]
    .forEach((el) => root.appendChild(el));

  const docListeners = new Map();
  const winListeners = new Map();

  const documentMock = {
    documentElement: { scrollHeight: 2000 },
    get activeElement() { return activeElement; },
    getElementById: (id) => byId.get(id) || null,
    createElement: (tag) => new MockElement(tag),
    createElementNS: (_ns, tag) => new MockElement(tag),
    createDocumentFragment: () => ({ isFragment: true, children: [], appendChild(n) { this.children.push(n); return n; } }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (t, fn) => {
      if (!docListeners.has(t)) docListeners.set(t, []);
      docListeners.get(t).push(fn);
    },
    dispatchEvent: (ev) => {
      for (const fn of docListeners.get(ev.type) || []) fn(ev);
    }
  };

  const windowMock = {
    innerWidth: 1280,
    innerHeight: 800,
    scrollY: 0,
    addEventListener: (t, fn) => {
      if (!winListeners.has(t)) winListeners.set(t, []);
      winListeners.get(t).push(fn);
    },
    scrollTo: () => {}
  };

  vm.runInNewContext(appJs, {
    window: windowMock,
    document: documentMock,
    encodeURIComponent,
    Number,
    String,
    Date
  });

  return { byId, documentMock, windowMock, getActiveElement: () => activeElement };
}

test('JS Behavior: service tabs render, switch on click and keyboard, and encode WhatsApp CTA', () => {
  const { byId, getActiveElement } = createDomSandbox();
  const tabs = byId.get('svcTabs').children;
  assert.equal(tabs.length, 6);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[0].getAttribute('aria-controls'), 'svcPanel');
  assert.equal(tabs[0].tabIndex, 0);
  assert.equal(tabs[1].tabIndex, -1);
  assert.equal(byId.get('svcTitle').textContent, 'Integración de procesos');
  assert.equal(byId.get('svcFlow').children.length, 5);
  assert.equal(byId.get('svcProcs').children.length, 4);

  // Click tab 2 ("Sistemas y APIs")
  tabs[2].dispatchEvent({ type: 'click' });
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'false');
  assert.equal(byId.get('svcTitle').textContent, 'Sistemas y APIs');
  assert.equal(byId.get('svcFlow').children[0].textContent, 'Tienda / Pasarela');
  assert.match(byId.get('svcCta').href, /^https:\/\/wa\.me\/573150659653\?text=/);
  assert.ok(byId.get('svcCta').href.includes('Sistemas%20y%20APIs'));

  // Keyboard navigation: End -> last tab (index 5), ArrowLeft -> index 4, Home -> index 0
  tabs[2].focus();
  byId.get('svcTabs').dispatchEvent({ type: 'keydown', key: 'End', preventDefault() {} });
  assert.equal(getActiveElement(), tabs[5]);
  assert.equal(byId.get('svcTitle').textContent, 'Seguridad de la información');

  byId.get('svcTabs').dispatchEvent({ type: 'keydown', key: 'ArrowLeft', preventDefault() {} });
  assert.equal(getActiveElement(), tabs[4]);
  assert.equal(byId.get('svcTitle').textContent, 'Desarrollo Full Stack');

  byId.get('svcTabs').dispatchEvent({ type: 'keydown', key: 'Home', preventDefault() {} });
  assert.equal(getActiveElement(), tabs[0]);
});

test('JS Behavior: mobile menu toggles aria-expanded, closes on Escape, and updates year', () => {
  const { byId, documentMock, getActiveElement } = createDomSandbox();
  const menuBtn = byId.get('menuBtn');
  const nav = byId.get('nav');

  menuBtn.dispatchEvent({ type: 'click' });
  assert.equal(nav.classList.contains('open'), true);
  assert.equal(menuBtn.getAttribute('aria-expanded'), 'true');

  documentMock.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(nav.classList.contains('open'), false);
  assert.equal(menuBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(getActiveElement(), menuBtn);

  assert.equal(byId.get('year').textContent, String(new Date().getFullYear()));
});
