const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(process.env.IDZ_TEST_SOURCE || path.join(__dirname, '../idz-app.js'), 'utf8');
function section(start, end) { return source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))); }

test('provider authentication errors do not tell the student to log in again', () => {
  const ctx = vm.createContext({});
  vm.runInContext(section('function friendlyBackendError(', 'function getFriendlyCheckoutError('), ctx);
  assert.doesNotMatch(ctx.friendlyBackendError({ status: 400 }, { error: 'authorization value not present' }), /Entre novamente/);
  assert.match(ctx.friendlyBackendError({ status: 401 }, { code: 'AUTH_TOKEN_EXPIRED' }), /sessão expirou/);
});

test('admin can retry a failed load and malformed responses never become zero students', async () => {
  let result = { students: [{ uid: 'student' }] };
  let failing = true;
  const ctx = vm.createContext({ isAdmin: true, window: { IDZ_AUTH_STATE: 'ADMIN' },
    adminUsersLoadingPromise: null, adminUsersLoadError: null, adminUsersLoaded: false,
    adminUsersCache: [], registeredUsers: [], renderDashboard() {}, verifyBackendSession: async () => {},
    adminApi: async () => { if (failing) throw new Error('Temporary failure'); return result; }, console: { warn() {} } });
  vm.runInContext(section('async function loadAdminUsersFromBackend()', 'function progressKey()'), ctx);
  await assert.rejects(ctx.loadAdminUsersFromBackend());
  assert.equal(ctx.adminUsersLoaded, false);
  assert.equal(ctx.adminUsersLoadingPromise, null);
  failing = false;
  await ctx.loadAdminUsersFromBackend();
  assert.equal(ctx.adminUsersCache.length, 1);
  assert.equal(ctx.adminUsersLoadError, null);
  result = {};
  await assert.rejects(ctx.loadAdminUsersFromBackend(), /Resposta inválida/);
  assert.equal(ctx.adminUsersLoaded, false);
});

test('reopening overview or students retries a failed initial load', () => {
  let retries = 0;
  const ctx = vm.createContext({ document: { getElementById: () => null }, renderDashboard() {},
    adminUsersLoaded: false, loadAdminUsersFromBackend: () => { retries++; return Promise.resolve([]); } });
  vm.runInContext(section('function switchAdminTab(', 'async function submitSupportTicket('), ctx);
  ctx.switchAdminTab('overview');
  ctx.switchAdminTab('alunos');
  assert.equal(retries, 2);
  ctx.adminUsersLoaded = true;
  ctx.switchAdminTab('overview');
  assert.equal(retries, 2);
});
