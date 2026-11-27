import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('native build entry points force preview off and target V2 testing', () => {
  for (const name of ['build-sales-android.mjs', 'build-desktop-apps.mjs']) {
    const source = fs.readFileSync(`scripts/${name}`, 'utf8');
    assert.match(source, /https:\/\/website\.attaieproperties\.com/);
    assert.match(source, /__STAFF_PREVIEW_ALLOWED__:\s*['"]false['"]/);
    assert.match(source, /envDir:\s*false/);
  }
});

test('desktop transport never retries staff mutations on another deployment', () => {
  for (const app of ['callcenter-desktop', 'sales-desktop']) {
    const source = fs.readFileSync(`${app}/src/main.js`, 'utf8');
    assert.match(source, /DEFAULT_BACKEND_ORIGIN = 'https:\/\/website\.attaieproperties\.com'/);
    assert.doesNotMatch(source, /FALLBACK_BACKEND_ORIGINS/);
  }
});

test('Android release signing never silently uses the debug identity', () => {
  const source = fs.readFileSync('sales-android/app/build.gradle', 'utf8');
  assert.doesNotMatch(source, /signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)/);
  assert.match(source, /ATTAIE_SIGNING_STORE_FILE/);
  assert.match(source, /website\.attaieproperties\.com\/staff-api\/v1/);
});
