import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import ts from 'typescript';

// Run the actual page component and its effects with deterministic hook state.
// Child components are boundaries; no DOM, HTTP, database, or fixtures in product code.
function mountPage(filename, service, id = '42') {
  const state = [];
  let cursor = 0;
  const effects = [];
  let mounted = false;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useRef: () => ({ current: null }),
    useMemo: fn => fn(),
    useEffect: fn => { if (!mounted) effects.push(fn); },
    lazy: () => () => null,
  };
  const boundary = new Proxy({}, { get: (_target, name) => name === '__esModule' ? true : () => null });
  const context = {
    exports: {}, console,
    require(name) {
      if (name === 'react') return { ...hooks, default: hooks, __esModule: true };
      if (name === 'react-router-dom') return { useParams: () => ({ id }), Link: 'a', useNavigate: () => () => {} };
      if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }) };
      if (name === 'motion/react') return { motion: new Proxy({}, { get: () => 'div' }), AnimatePresence: 'div' };
      if (name.endsWith('/dbService')) return service;
      if (name.endsWith('/seoConfig')) return { buildPropertySeo: () => ({}) };
      return boundary;
    },
  };
  vm.runInNewContext(ts.transpile(fs.readFileSync(filename, 'utf8'), {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true,
  }), context, { filename });
  const render = () => { cursor = 0; return context.exports.default(); };
  render();
  effects.forEach(fn => fn());
  mounted = true;
  return { async settled() { await new Promise(resolve => setImmediate(resolve)); return render(); } };
}

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  return textOf(node.props?.children);
}

test('missing property never displays fabricated inventory or booking actions', async () => {
  const page = mountPage('src/pages/PropertyDetailPage.tsx', { getProperty: async () => null });
  const text = textOf(await page.settled());
  assert.ok(text.includes('inventoryState.propertyNotFound'));
  assert.ok(!text.includes('Luxury Residence') && !text.includes('185,000'));
  assert.ok(!text.includes('visitDialog.requestVisitBtn'));
});

test('property API outage has an error state instead of an available sample listing', async () => {
  const page = mountPage('src/pages/PropertyDetailPage.tsx', { getProperty: async () => { throw new Error('offline'); } });
  const text = textOf(await page.settled());
  assert.ok(text.includes('inventoryState.loadError'));
  assert.ok(!text.includes('Luxury Residence'));
});

test('invalid property route never requests unrelated property 101', async () => {
  const calls = [];
  const page = mountPage('src/pages/PropertyDetailPage.tsx', { getProperty: async id => { calls.push(id); return null; } }, 'invalid');
  await page.settled();
  assert.deepEqual(calls, []);
});

test('project API outage stays distinct from a valid empty catalog', async () => {
  const outage = mountPage('src/pages/ProjectsPage.tsx', { getProjects: async () => { throw new Error('offline'); } });
  assert.ok(textOf(await outage.settled()).includes('inventoryState.loadError'));
  const empty = mountPage('src/pages/ProjectsPage.tsx', { getProjects: async () => [] });
  const text = textOf(await empty.settled());
  assert.ok(text.includes('projectsPage.empty'));
  assert.ok(!text.includes('inventoryState.loadError'));
});
