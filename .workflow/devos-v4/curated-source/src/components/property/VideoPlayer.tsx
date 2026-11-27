import React from 'react';
import {
  ApartmentWalkthroughVideo,
  type ApartmentWalkthroughVideoProps,
} from '@/components/video/ApartmentWalkthroughVideo';

export interface Props extends Partial<ApartmentWalkthroughVideoProps> {
  url: string;
  title?: string;
  subtitle?: string;
  posterUrl?: string | null;
  location?: string;
  unitNumber?: string;
  compact?: boolean;
}

export function VideoPlayer({
  url,
  title = 'Property Video Tour',
  subtitle = 'Experience high-definition interior details and architectural walkthrough',
  posterUrl,
  location,
  unitNumber,
  compact = false,
  className,
}: Props) {
  return (
    <ApartmentWalkthroughVideo
      url={url}
      title={title}
      subtitle={subtitle}
      posterUrl={posterUrl}
      location={location}
      unitNumber={unitNumber}
      compact={compact}
      className={className}
    />
  );
}

export { ApartmentWalkthroughVideo };

