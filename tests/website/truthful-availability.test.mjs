import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('availability and admin project cards never invent a percentage or unit count', () => {
  const card=fs.readFileSync('src/components/ui/ProjectCard.tsx','utf8');
  const admin=fs.readFileSync('admin-panel/src/pages/Overview.tsx','utf8');
  assert.doesNotMatch(card,/Math\.max\(8,/);
  assert.doesNotMatch(admin,/totalUnits \* 0\.72|total_units \|\| 40|% Contracted/);
  assert.doesNotMatch(admin,/points: \[4, 6, 5|points: \[2, 2, 3|m\.leads \|\| 1/);
});
test('public navigation uses a readable surface at page start', () => {
  const navbar=fs.readFileSync('src/components/layout/Navbar.tsx','utf8');
  assert.doesNotMatch(navbar,/'bg-transparent py-5'/);
});
