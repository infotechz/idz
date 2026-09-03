const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(new URL('../index.html',`file://${__filename}`),'utf8');
const css=fs.readFileSync(new URL('../idz-design-system.css',`file://${__filename}`),'utf8');

test('Design System IDZ está carregado e preserva a logo oficial',()=>{
  assert.match(html,/idz-design-system\.css/);
  assert.match(html,/assets\/logo-idz-oficial-v2\.png/);
  assert.match(css,/--idz-navy:/);
  assert.match(css,/--idz-cyan:/);
  assert.doesNotMatch(css,/background:\s*#fff[^!]/i);
});

test('glass, botões, RGB e movimento reduzido são globais',()=>{
  assert.match(css,/backdrop-filter:blur\(16px\) saturate\(125%\)/);
  assert.match(css,/\.btn::before,\.btn-outline::before/);
  assert.match(css,/@keyframes idzRgb/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('Etapa 0 tem seis vídeos e não altera os 12 módulos',()=>{
  assert.match(html,/Etapa 0 — Começando o Informática do Zero/);
  for(const item of ['0.1','0.2','0.3','0.4','0.5','0.6'])assert.match(html,new RegExp(item.replace('.','\\.')));
  assert.match(html,/não conta entre os 12 módulos oficiais/i);
  assert.doesNotMatch(html,/Módulo 0/i);
});

test('aula, player e accordions usam a hierarquia visual nova',()=>{
  assert.match(html,/Aula atual · \$\{mod\.title\}/);
  assert.match(css,/\.video-frame,\.image-frame/);
  assert.match(html,/O que vai aprender/);
  assert.match(html,/Descrição detalhada/);
  assert.match(html,/Objetivos pedagógicos/);
});

test('checkout, suporte, reembolso, perfil e Google seguem o padrão IDZ',()=>{
  assert.match(html,/12 módulos \+ Projeto Final \+ 3 bônus/);
  assert.match(html,/FALAR COM A MODERAÇÃO/);
  assert.match(html,/ENVIAR PARA ANÁLISE/);
  assert.match(html,/profile-upload-label/);
  assert.match(html,/google-connection-card/);
  assert.doesNotMatch(html,/>Escolher arquivo</i);
  assert.doesNotMatch(html,/Cartão de Débito Virtual CAIXA/);
});

test('Admin possui navegação agrupada e gestão individual segmentada',()=>{
  for(const group of ['Gestão','Conteúdo','Certificação','Financeiro','Atendimento','Comunicação'])assert.match(html,new RegExp(`>${group}<`));
  for(const tab of ['overview','course','project','bonus','certificate','access','support','refund'])assert.match(html,new RegExp(`data-manager-tab="${tab}"`));
});

test('breakpoints obrigatórios não permitem largura fixa administrativa',()=>{
  for(const width of ['460','768','900'])assert.match(css,new RegExp(`max-width:${width}px`));
  assert.match(css,/max-width:100%/);
  assert.match(css,/overflow-x:auto/);
  assert.doesNotMatch(css,/min-width:\s*(?:[5-9]\d\d|\d{4,})px/);
});

test('toast global possui quatro estados',()=>{
  assert.match(html,/id="idz-toast-stack"/);
  assert.match(html,/function showToast/);
  for(const state of ['success','error','warning','info'])assert.match(html,new RegExp(`'${state}'`));
});
