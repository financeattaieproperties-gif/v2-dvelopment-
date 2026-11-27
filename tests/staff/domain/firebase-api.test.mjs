import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function loadApi() {
  const filename = new URL('../../../apps/staff/src/api.ts', import.meta.url);
  const source = fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env.', 'globalThis.__staffTestEnv.');
  const compiled = ts.transpile(source, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 })
    .replaceAll('"../../../packages/staff-contracts/role-preference.mjs"', JSON.stringify(new URL('../../../packages/staff-contracts/role-preference.mjs', import.meta.url).href))
    .replaceAll('"./auth/firebase.mjs"', JSON.stringify(new URL('../../../apps/staff/src/auth/firebase.mjs', import.meta.url).href));
  return (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${Math.random()}`)).api;
}

test('staff API exchanges password with Firebase and sends only ID token to PHP', async () => {
  globalThis.__staffTestEnv = { VITE_STAFF_FIREBASE_API_KEY: 'fixture-public-key' };
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (String(url).startsWith('https://identitytoolkit.googleapis.com/')) return Response.json({ idToken: 'fixture-token' });
    return Response.json({ data: { csrfToken: 'fixture-csrf', user: { id: 8 } } });
  };
  try {
    const api = await loadApi();
    await api.login('agent@example.test', 'fixture-password');
    const provider = calls.find(call => String(call.url).includes('identitytoolkit.googleapis.com'));
    assert.ok(provider, 'Credentials must be checked by Firebase');
    assert.equal(JSON.parse(provider.options.body).password, 'fixture-password');
    const phpLogin = calls.find(call => String(call.url).endsWith('/auth/login'));
    assert.deepEqual(JSON.parse(phpLogin.options.body), { idToken: 'fixture-token' });
    assert.equal(phpLogin.options.headers['X-CSRF-Token'], 'fixture-csrf');
    await api.resetPassword('agent@example.test');
    assert.ok(calls.some(call => String(call.url).includes('accounts:sendOobCode')));
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.__staffTestEnv;
  }
});
