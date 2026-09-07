const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('idz-app.js', 'utf8');

test('certificado usa o centro e as áreas do template original', () => {
  assert.match(source, /width:\s*1080,\s*height:\s*720/);
  assert.match(source, /name:\s*\{\s*centerX:\s*540/);
  assert.match(source, /maxWidth:\s*520/);
  assert.match(source, /firstLineY:\s*230,\s*secondLineY:\s*258/);
  assert.match(source, /date:\s*\{\s*centerX:\s*368,\s*baselineY:\s*686/);
  assert.match(source, /number:\s*\{\s*centerX:\s*530,\s*baselineY:\s*686/);
});

test('identificador dinâmico do certificado contém somente dígitos', () => {
  assert.match(source, /String\(uObj\.certificateNumber\)\.replace\(\/\\D\/g, ''\)/);
  assert.match(source, /String\(userObj\.certificateNumber \|\| ''\)\.replace\(\/\\D\/g, ''\)/);
  assert.doesNotMatch(source, /userObj\.certificateNumber\s*=\s*\`IDZ-/);
});

test('exportação permanece em PDF com a imagem original como fundo', () => {
  assert.match(source, /new jsPDF\(\{ orientation:'landscape', unit:'pt', format:\[layout\.width, layout\.height\] \}\)/);
  assert.match(source, /doc\.addImage\(img, imageFormat, 0, 0, layout\.width, layout\.height\)/);
  assert.match(source, /assets\/certificado-idz-clean-template\.png/);
});
