import fs from 'node:fs/promises';

const luminance = hex => {
  const channels = hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const leads = [];
// Reproduce the exact empty-input calculations in OverviewAnalyticsStrip.tsx.
const pipeline = Array.from({ length: 6 }, (_, i) => Math.max(2, leads.filter((_, idx) => idx % 6 === i).length + i));
const closed = Array.from({ length: 6 }, (_, i) => Math.max(1, leads.filter((l, idx) => idx % 6 === i && l.status === 'closed').length + Math.floor(i / 2)));
const result = {
  basis: 'Deterministic source-code calculations, not customer analytics or hosted measurements.',
  emptyInputExecutiveChart: { labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], pipeline, closed, expected: [0, 0, 0, 0, 0, 0] },
  contrastOnWhite: Object.fromEntries(['818285', '14A850', '0072BC', '475569', '0D6042'].map(hex => [hex, contrast(hex, 'FFFFFF')])),
  projectAvailabilityWithZeroAvailable: Math.min(100, Math.max(8, Math.round((0 / 100) * 100))),
  contractedFor100UnitsWithoutReadingSoldCount: Math.min(Math.round(100 * 0.72), 100),
};
await fs.writeFile('docs/research/2026-11-24-ux-assets/calculations.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
