import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('release preparation defaults to isolated V2 staging', () => {
  const result = spawnSync(process.execPath, ['scripts/package-dashboard-completion.mjs', '--audit-source'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Target: https:\/\/website\.attaieproperties\.com/);
});

test('conflicting release targets fail before output is created', () => {
  const result = spawnSync(process.execPath, ['scripts/package-dashboard-completion.mjs', '--staging', '--production', '--audit-source'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Choose one target/);
});

test('production preparation requires the explicit production flag', () => {
  const result = spawnSync(process.execPath, ['scripts/package-dashboard-completion.mjs', '--production', '--audit-source'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Target: https:\/\/attaieproperties\.com/);
  assert.doesNotMatch(result.stdout, /Target: https:\/\/website\./);
});
