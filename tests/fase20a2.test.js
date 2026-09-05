const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const app = read('idz-app.js');
const redesign = read('fase20a-redesign.js');
const premium = read('fase20a-premium.css');
const css = read('fase20a-redesign.css');

test('visual assets load directly and without duplicate import', () => {
  assert.match(html, /fase20a-redesign\.css\?v=20a8-interaction/);
  assert.match(html, /fase20a-premium\.css\?v=20a8-interaction/);
  assert.match(html, /fase20a-redesign\.js\?v=20a8-functional2/);
  assert.doesNotMatch(css, /@import\s+url\(['"]idz-design-system\.css/);
  assert.doesNotMatch(redesign, /createElement\(['"]link['"]\)/);
});

test('Mercado Pago is lazy-loaded only for checkout card flow', () => {
  assert.doesNotMatch(html, /<script[^>]+src=["']https:\/\/sdk\.mercadopago\.com/);
  assert.match(app, /function loadMercadoPagoSdk\(/);
  assert.match(app, /data-mercado-pago-sdk/);
  assert.match(app, /await loadMercadoPagoSdk\(\)/);
});

test('canvas is adaptive, visible and pauses when hidden', () => {
  assert.match(app, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/);
  assert.match(app, /requestAnimationFrame\(animateParticles\)/);
  assert.match(app, /document\.hidden/);
  assert.match(app, /window\.innerWidth < 600 \? Math\.min\(30, Math\.max\(20/);
  assert.match(app, /\(Math\.random\(\) - 0\.42\) \* 0\.52/);
  assert.match(premium, /#particles-canvas[\s\S]*opacity: \.92/);
});

test('premium layers, orbs, motion preferences and button sheen exist', () => {
  assert.match(html, /orb orb-3/);
  assert.match(html, /orb orb-4/);
  assert.match(premium, /--20a-glass-primary/);
  assert.match(premium, /--20a-glass-secondary/);
  assert.match(premium, /--20a-glass-elevated/);
  assert.match(premium, /--20a-glass-modal/);
  assert.match(premium, /@keyframes idzOrbFloat/);
  assert.match(premium, /@keyframes idzButtonSheen/);
  assert.match(premium, /prefers-reduced-motion: reduce/);
});

test('render path avoids a whole-document mutation observer', () => {
  assert.doesNotMatch(redesign, /new MutationObserver/);
  assert.match(app, /document\.addEventListener\('visibilitychange'/);
  assert.match(redesign, /pointerEvents = 'none'/);
  assert.match(redesign, /image\.loading = 'lazy'/);
});

test('critical overlays stay out of document flow and initialization is isolated', () => {
  assert.doesNotMatch(premium, /body\.idz-20a\s*>\s*:not\(/);
  assert.match(premium, /body\.idz-20a > \.modal-overlay[\s\S]*position: fixed/);
  assert.match(premium, /body\.idz-20a > \.modal-overlay[\s\S]*position: fixed/);
  assert.match(redesign, /removeLegacyVisualMocks/);
  assert.match(redesign, /optimizeDecoration/);
});

test('Course V2 remains the only visible course structure', () => {
  assert.match(app, /window\.IDZ_COURSE_V2/);
  assert.match(html, /12 módulos \+ Projeto Final \+ 3 bônus/i);
  assert.doesNotMatch(redesign, /15 módulos|51 aulas|102 exercícios/i);
});
