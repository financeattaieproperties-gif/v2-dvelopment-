import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Video,
  Maximize2,
  Minimize2,
  ExternalLink,
  Share2,
  Check,
  Film,
  Building2,
  Sparkles,
} from 'lucide-react';

export interface ApartmentWalkthroughVideoProps {
  url: string;
  title?: string;
  subtitle?: string;
  posterUrl?: string | null;
  location?: string;
  unitNumber?: string;
  className?: string;
  compact?: boolean;
  autoPlay?: boolean;
}

export type VideoProvider = 'youtube' | 'vimeo' | 'direct';

export interface ParsedVideoInfo {
  provider: VideoProvider;
  id?: string;
  hash?: string | null;
  start?: string | null;
  embedUrl: string;
  externalUrl: string;
  defaultPoster?: string;
  providerLabel: string;
}

export function parseVideoUrl(rawUrl: string): ParsedVideoInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // 1. YouTube matching (watch?v=, youtu.be, embed, shorts)
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    const timeMatch = trimmed.match(/[?&](?:t|start)=(\d+)/);
    const start = timeMatch ? timeMatch[1] : null;
    const startParam = start ? `&start=${start}` : '';

    return {
      provider: 'youtube',
      id,
      start,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${startParam}`,
      externalUrl: `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`,
      defaultPoster: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      providerLabel: 'YouTube HD Walkthrough',
    };
  }

  // 2. Vimeo matching (vimeo.com/12345, player.vimeo.com/video/12345, unlisted hashes)
  const vmMatch = trimmed.match(
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)(?:\/([a-zA-Z0-9]+))?|player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-zA-Z0-9]+))?)/
  );
  if (vmMatch) {
    const id = vmMatch[1] || vmMatch[3];
    const hash = vmMatch[2] || vmMatch[4] || null;
    const hashParam = hash ? `&h=${hash}` : '';

    return {
      provider: 'vimeo',
      id,
      hash,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&badge=0&dnt=1${hashParam}`,
      externalUrl: hash ? `https://vimeo.com/${id}/${hash}` : `https://vimeo.com/${id}`,
      defaultPoster: undefined,
      providerLabel: 'Vimeo Cinematic Tour',
    };
  }

  // 3. Direct video (MP4 / WebM / Stream)
  return {
    provider: 'direct',
    embedUrl: trimmed,
    externalUrl: trimmed,
    providerLabel: 'HD Video Tour',
  };
}

export function ApartmentWalkthroughVideo({
  url,
  title = 'Apartment Interior Walkthrough',
  subtitle = 'Experience high-definition interior details, daylight illumination, and architectural finishes',
  posterUrl,
  location,
  unitNumber,
  className = '',
  compact = false,
  autoPlay = false,
}: ApartmentWalkthroughVideoProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isTheater, setIsTheater] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoInfo = parseVideoUrl(url);

  // Initialize and validate poster image
  useEffect(() => {
    if (posterUrl) {
      setPosterSrc(posterUrl);
    } else if (videoInfo?.defaultPoster) {
      setPosterSrc(videoInfo.defaultPoster);
    } else {
      setPosterSrc(null);
    }
  }, [posterUrl, videoInfo?.defaultPoster]);

  // Handle fallback if maxresdefault.jpg fails on YouTube
  const handlePosterError = () => {
    if (videoInfo?.provider === 'youtube' && videoInfo.id && posterSrc?.includes('maxresdefault')) {
      setPosterSrc(`https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`);
    } else {
      setPosterSrc(null);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoInfo) return;
    navigator.clipboard.writeText(videoInfo.externalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }).catch(() => {});
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!videoInfo) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-brand-navy/10 bg-brand-navy transition-all duration-300 shadow-brand-md ${
        isTheater ? 'ring-2 ring-brand-gold/60 shadow-2xl my-6' : ''
      } ${className}`}
    >
      {/* Header Bar (When not in compact mode) */}
      {!compact && (
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
              <Film size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                <span className="font-bold text-brand-gold uppercase tracking-wider text-[11px]">
                  {unitNumber ? `Unit ${unitNumber} Walkthrough` : 'Video Walkthrough'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{videoInfo.providerLabel}</span>
                {location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{location}</span>
                  </>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy truncate">
                {title}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              type="button"
              onClick={handleCopyLink}
              title={copied ? 'Copied!' : 'Copy video link'}
              aria-label="Copy video link"
              className="relative p-2 rounded-lg text-neutral-500 hover:text-brand-navy hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Share2 size={16} />
              )}
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-brand-navy text-[10px] text-white font-medium whitespace-nowrap shadow-sm pointer-events-none">
                  Copied
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsTheater((prev) => !prev)}
              title={isTheater ? 'Default view' : 'Theater mode'}
              aria-label={isTheater ? 'Exit theater view' : 'Enter theater view'}
              className="p-2 rounded-lg text-neutral-500 hover:text-brand-navy hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {isTheater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {videoInfo.provider !== 'direct' && (
              <a
                href={videoInfo.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open on ${videoInfo.provider === 'youtube' ? 'YouTube' : 'Vimeo'}`}
                aria-label={`Open on ${videoInfo.provider === 'youtube' ? 'YouTube' : 'Vimeo'}`}
                className="p-2 rounded-lg text-neutral-500 hover:text-brand-gold hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Video Viewport (16:9 cinematic aspect ratio) */}
      <div
        className={`relative w-full bg-neutral-950 ${
          isTheater ? 'aspect-[21/9] min-h-[380px]' : 'aspect-video'
        } transition-all duration-300`}
      >
        {isPlaying ? (
          videoInfo.provider === 'direct' ? (
            <video
              src={videoInfo.embedUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
              title={title}
            />
          ) : (
            <iframe
              src={videoInfo.embedUrl}
              title={title}
              className="w-full h-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : (
          /* Interactive Luxury Poster Stage */
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPlaying(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPlaying(true);
              }
            }}
            aria-label={`Play walkthrough video for ${title}`}
            className="group absolute inset-0 cursor-pointer overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-inset"
          >
            {/* Background Poster Image */}
            {posterSrc ? (
              <img
                src={posterSrc}
                alt={title}
                onError={handlePosterError}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-navy-deep via-brand-navy to-brand-navy-light">
                <div className="absolute inset-0 islamic-pattern opacity-15" />
                <Building2 size={72} className="text-white/10" />
              </div>
            )}

            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 group-hover:via-black/30 transition-colors duration-300" />

            {/* Provider & Walkthrough Badge Top */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-sm">
                <Video size={13} className="text-brand-gold" />
                <span>{videoInfo.providerLabel}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-gold/90 text-white shadow-sm">
                <Sparkles size={12} />
                <span>Virtual Walkthrough</span>
              </span>
            </div>

            {/* Central Animated Golden Play Button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className="relative mb-4"
              >
                {/* Subtle pulsing glow ring */}
                <div className="absolute -inset-2.5 rounded-full bg-brand-gold/30 blur-md group-hover:bg-brand-gold/50 transition-all duration-300 animate-pulse" />
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-brand-gold hover:bg-brand-gold-dark text-white flex items-center justify-center shadow-gold-lg transition-colors border-2 border-white/30">
                  <Play size={32} fill="white" className="ml-1 text-white" />
                </div>
              </motion.div>

              <div className="max-w-md pointer-events-none">
                <h4 className="text-white font-bold text-base sm:text-xl drop-shadow-md mb-1 leading-snug">
                  {title}
                </h4>
                {subtitle && (
                  <p className="text-white/80 text-xs sm:text-sm line-clamp-2 drop-shadow-sm font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Bar Info */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-white/75 pointer-events-none">
              <span className="inline-flex items-center gap-1.5">
                <Film size={13} className="text-brand-gold" />
                <span>Click to start interior tour</span>
              </span>
              <span className="font-semibold text-white/90">
                Full HD 1080p · 60fps
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Details Bar (compact view) */}
      {compact && (
        <div className="px-4 py-3 bg-white border-t border-neutral-100 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-brand-navy truncate">{title}</p>
            <p className="text-neutral-500 text-[11px] truncate">{subtitle}</p>
          </div>
          {videoInfo.provider !== 'direct' && (
            <a
              href={videoInfo.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-gold hover:underline shrink-0"
            >
              <span>{videoInfo.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
