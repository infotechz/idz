const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const courseSource = fs.readFileSync(new URL('../course-v2.js', `file://${__filename}`), 'utf8');

test('scripts inline clássicos possuem sintaxe válida', () => {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !match[1].includes('type="module"'))
    .map(match => match[2]).filter(Boolean);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename:`inline-${index}.js` })));
});

test('checkout usa configuração pública segura e separa PIX de cartão', () => {
  assert.match(html, /\/api\/config/);
  assert.match(html, /mercadoPagoCredentialsCompatible/);
  assert.match(html, /id="checkout-method-pix"[\s\S]*?PIX<\/button>/);
  assert.match(html, /id="checkout-method-card"[\s\S]*?CARTÃO<\/button>/);
  assert.match(html, /\/api\/payments\/pix/);
  assert.match(html, /\/api\/payments\/card/);
  assert.doesNotMatch(html, /const\s+MP_PUBLIC_KEY|APP_USR-|TEST-/);
  assert.doesNotMatch(html, /Débito Virtual CAIXA/);
});

test('Course V2 mantém 12 módulos e bônus fora da contagem', () => {
  const sandbox = { window:{} };
  vm.runInNewContext(courseSource, sandbox);
  assert.equal(sandbox.window.IDZ_COURSE_V2.courseVersion, 2);
  assert.equal(sandbox.window.IDZ_COURSE_V2.modules.length, 12);
  assert.equal(sandbox.window.IDZ_COURSE_V2.finalProject.steps.length, 7);
  assert.equal(sandbox.window.IDZ_COURSE_V2.bonuses.length, 3);
  assert.doesNotMatch(html, /15\s+módulos|51\s+aulas|51\/51|0\/51/i);
});

test('admin individual usa backend autenticado e mantém estados separados', () => {
  assert.match(html, /\/api\/admin\/students\/\$\{encodeURIComponent\(activeManagedStudentUid\)\}\/progress/);
  assert.match(html, /certificateOverride/);
  assert.match(html, /adminSetAccess/);
  assert.match(html, /adminDeleteStudent/);
  assert.doesNotMatch(html, /function\s+setStudentPaymentStatus/);
  assert.match(html, /finalProjectProgress/);
  assert.match(html, /bonusProgress/);
});

test('FCM trata permissão negada sem nova solicitação', () => {
  assert.match(html, /Notification\.permission\s*===\s*['"]denied['"]/);
  assert.match(html, /As notificações estão bloqueadas neste navegador/);
});
