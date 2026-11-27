import { describe, it, expect, vi, afterEach } from 'vitest';
import { SEO_CONFIG, setRuntimeSeoSettings } from '../../../src/lib/seoConfig';
afterEach(() => { vi.unstubAllEnvs(); setRuntimeSeoSettings(null); });
describe('testing metadata isolation', () => {
  it('testing build cannot inherit a stale production canonical or index flag', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://website.attaieproperties.com');
    setRuntimeSeoSettings({ canonical_base_url: 'https://attaieproperties.com', robots_index: true } as never);
    expect(SEO_CONFIG.siteUrl).toBe('https://website.attaieproperties.com');
    expect(SEO_CONFIG.robotsIndex).toBe(false);
  });
  it('a configured testing canonical is never rewritten to production', () => {
    setRuntimeSeoSettings({ canonical_base_url: 'https://website.attaieproperties.com' } as never);
    expect(SEO_CONFIG.siteUrl).toBe('https://website.attaieproperties.com');
  });
});
