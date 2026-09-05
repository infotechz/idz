const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const app = fs.readFileSync(new URL('../idz-app.js', `file://${__filename}`), 'utf8');
const courseSource = fs.readFileSync(new URL('../course-v2.js', `file://${__filename}`), 'utf8');

test('scripts inline clássicos possuem sintaxe válida', () => {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !match[1].includes('type="module"'))
    .map(match => match[2]).filter(Boolean);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename:`inline-${index}.js` })));
});

test('checkout usa configuração pública segura e separa PIX de cartão', () => {
  assert.match(app, /\/api\/config/);
  assert.match(app, /mercadoPagoCredentialsCompatible/);
  assert.match(html, /id="checkout-method-pix"[\s\S]*?<span>PIX<\/span>[\s\S]*?<\/button>/);
  assert.match(html, /id="checkout-method-card"[\s\S]*?<span>CARTÃO<\/span>[\s\S]*?<\/button>/);
  assert.match(app, /\/api\/payments\/pix/);
  assert.match(app, /\/api\/payments\/card/);
  assert.doesNotMatch(html + app, /const\s+MP_PUBLIC_KEY|APP_USR-|TEST-/);
  assert.doesNotMatch(html + app, /Débito Virtual CAIXA/);
  assert.doesNotMatch(html + app, /Meios de pagamento|Parcelamento disponível|paymentBrick_container|bricks\(\)\.create/);
  assert.match(app, /mp\.cardForm\(\{/);
  assert.match(app, /iframe:true/);
  assert.match(html, /id="form-checkout__cardNumber"/);
  assert.match(html, /id="form-checkout__securityCode"/);
  assert.match(app, /token:data\.token/);
  assert.doesNotMatch(html + app, /cardNumber:data|securityCode:data/);
});

test('helper autenticado protege PIX e cartão com Firebase ID Token', () => {
  assert.match(app, /async function requireFirebaseSession\(\)/);
  assert.match(app, /await user\.getIdToken\(\)/);
  assert.match(app, /headers\.set\(['"]Authorization['"], `Bearer \$\{token\}`\)/);
  assert.match(app, /async function backendRequest\(path, options = \{\}\)/);
  assert.match(app, /backendRequest\(['"]\/api\/payments\/pix['"]/);
  assert.match(app, /backendRequest\(['"]\/api\/payments\/card['"]/);
  assert.match(app, /Entre na sua conta para continuar/);
});

test('checkout IDZ é responsivo nos celulares alvo', () => {
  assert.match(html, /@media\(max-width:460px\)/);
  assert.match(html, /min-height:100svh/);
  assert.match(html, /\.idz-card-grid\{grid-template-columns:1fr\}/);
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
  assert.match(app, /\/api\/admin\/students\/\$\{encodeURIComponent\(activeManagedStudentUid\)\}\/progress/);
  assert.match(app, /certificateOverride/);
  assert.match(app, /adminSetAccess/);
  assert.match(app, /adminDeleteStudent/);
  assert.doesNotMatch(app, /function\s+setStudentPaymentStatus/);
  assert.match(app, /finalProjectProgress/);
  assert.match(app, /bonusProgress/);
});

test('FCM trata permissão negada sem nova solicitação', () => {
  assert.match(app, /Notification\.permission\s*===\s*['"]denied['"]/);
  assert.match(app, /As notificações estão bloqueadas neste navegador/);
});
