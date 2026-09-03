const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const redesign = read('fase20a-redesign.js');
const premium = read('fase20a-premium.css');
const css = read('fase20a-redesign.css');

test('visual assets load directly and without duplicate import', () => {
  assert.match(html, /fase20a-redesign\.css\?v=20a2-premium/);
  assert.match(html, /fase20a-premium\.css\?v=20a2-premium/);
  assert.match(html, /fase20a-redesign\.js\?v=20a2-premium/);
  assert.doesNotMatch(css, /@import\s+url\(['"]idz-design-system\.css/);
  assert.doesNotMatch(redesign, /createElement\(['"]link['"]\)/);
});

test('Mercado Pago is lazy-loaded only for checkout card flow', () => {
  assert.doesNotMatch(html, /<script[^>]+src=["']https:\/\/sdk\.mercadopago\.com/);
  assert.match(html, /function loadMercadoPagoSdk\(/);
  assert.match(html, /data-mercado-pago-sdk/);
  assert.match(html, /await loadMercadoPagoSdk\(\)/);
});

test('canvas is adaptive, visible and pauses when hidden', () => {
  assert.match(html, /Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/);
  assert.match(html, /requestAnimationFrame\(animateParticles\)/);
  assert.match(html, /document\.hidden/);
  assert.match(html, /window\.innerWidth < 600 \? Math\.min\(36, Math\.max\(24/);
  assert.match(html, /\(Math\.random\(\) - 0\.42\) \* 0\.52/);
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
  assert.match(redesign, /performance\.mark\?\.\('idz-shell-visible'\)/);
  assert.match(redesign, /window\.IDZ_PERFORMANCE/);
  assert.match(redesign, /img\.loading='lazy'/);
});

test('Course V2 remains the only visible course structure', () => {
  assert.match(redesign, /window\.IDZ_COURSE_V2\?\.modules/);
  assert.match(redesign, /12 MÓDULOS \+ PROJETO FINAL \+ 3 BÔNUS/);
  assert.doesNotMatch(redesign, /15 módulos|51 aulas|102 exercícios/i);
});
