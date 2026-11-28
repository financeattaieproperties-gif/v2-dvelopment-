import React, { useEffect, useState } from 'react';
import { getPublishedVisualConfig } from '../../lib/visualConfigService';
import type { LandingHeroConfig } from '../../../shared/visual-config';

export const LandingHeroBackground: React.FC<{ projectImage?: string | null; projectName?: string }> = ({ projectImage, projectName }) => {
  const [heroConfig, setHeroConfig] = useState<LandingHeroConfig | null>(null);
  useEffect(() => {
    let mounted = true;
    getPublishedVisualConfig().then(cfg => {
      if (mounted && cfg?.landingHero) setHeroConfig(cfg.landingHero);
    }).catch(() => { /* Leave the real project image or neutral canvas in place. */ });
    return () => { mounted = false; };
  }, []);
  const activeImageUrl = heroConfig?.imageUrl || projectImage;
  const focalX = heroConfig?.focalPoint?.x ?? 0.5;
  const focalY = heroConfig?.focalPoint?.y ?? 0.4;
  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-[24px] bg-[#E4E8EE] lg:min-h-[510px]">
      {activeImageUrl && <img src={activeImageUrl} alt={heroConfig?.imageUrl ? 'Attaie Properties' : projectName || 'Attaie Properties'} style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />}
      {!activeImageUrl && <div className="absolute inset-0 flex items-center justify-center"><img src="/logo.png" alt="" className="w-40 max-w-[45%] object-contain opacity-70" /></div>}
    </div>
  );
};
export default LandingHeroBackground;
