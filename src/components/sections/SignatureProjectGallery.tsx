import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, MapPin, Pause, Play } from 'lucide-react';
import type { Project } from '../../lib/dbService';

const STILL_MS = 6500;
const FILM_PREVIEW_SECONDS = 15;
const STARTUP_TIMEOUT_MS = 6500;

function inlineFilm(url: string | null): string | undefined {
  if (!url) return undefined;
  // Embedded providers retain their existing player on the project detail page.
  try {
    const parsed = new URL(url, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)$/i.test(parsed.hostname)) return undefined;
    return parsed.href;
  } catch { return undefined; }
}

export function SignatureProjectGallery({ projects, loading = false }: { projects: Project[]; loading?: boolean }) {
  const { t, i18n } = useTranslation('common');
  const fa = i18n.language.startsWith('fa');
  const copy = (en: string, dari: string) => fa ? dari : en;
  const reduced = useReducedMotion();
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [failedPosition, setFailedPosition] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const advanced = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const featured = projects.filter(project => Boolean(project.image_url || project.gallery_images?.[0]));
  const count = featured.length;
  const activeIndex = count ? ((position % count) + count) % count : 0;
  const active = featured[activeIndex];
  const film = inlineFilm(active?.video_url ?? null);
  const filmAvailable = Boolean(film) && failedPosition !== position;
  const auto = !reduced && !paused && visible && documentVisible;
  const advance = useCallback((step: number) => {
    if (count < 2 || step === 0) return;
    setDirection(step);
    setPosition(value => value + step);
  }, [count]);
  const nextOnce = useCallback(() => {
    if (advanced.current || !auto) return;
    advanced.current = true;
    advance(1);
  }, [advance, auto]);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    advanced.current = false;
    setProgress(0);
    setPlaying(false);
  }, [position, active?.id]);
  useEffect(() => {
    const el = video.current;
    if (!el || !filmAvailable) return;
    if (auto) {
      el.muted = true;
      el.play().catch(() => setFailedPosition(position));
    } else el.pause();
    return () => el.pause();
  }, [auto, filmAvailable, position, film]);
  useEffect(() => {
    if (!auto || count < 2 || filmAvailable) return;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const value = Math.min(1, (performance.now() - started) / STILL_MS);
      setProgress(value);
      if (value >= 1) nextOnce();
    }, 80);
    return () => window.clearInterval(timer);
  }, [auto, count, filmAvailable, position, nextOnce]);
  useEffect(() => {
    if (!auto || !filmAvailable || playing) return;
    const timer = window.setTimeout(() => setFailedPosition(position), STARTUP_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [auto, filmAvailable, playing, position]);

  const cards = Array.from({ length: Math.min(count, 3) }, (_, offset) => {
    const absolute = position + offset;
    const project = featured[((absolute % count) + count) % count];
    return { absolute, project, offset };
  });

  const control = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-35 disabled:cursor-not-allowed';
  return (
    <section ref={section} aria-labelledby="attaie-signature-projects" data-testid="signature-projects-expanding-section" className="relative overflow-hidden bg-[#171A1F] py-14 text-white lg:py-24">
      <div className="container-custom">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-12">
          <div className="max-w-xl">
            <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"><span className="h-px w-8 bg-[#19A64F]" />{t('landing.projectsEyebrow')}</p>
            <h2 id="attaie-signature-projects" className="text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.045em]">{t('landing.projectsTitle')}</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">{t('landing.projectsSubtitle')}</p>
          </div>
          <Link to="/projects" className="group inline-flex items-center gap-2 border-b border-white/50 pb-2 text-sm font-semibold text-white hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {t('landing.viewAllProjects')} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </header>
        {count > 0 ? (
          <div role="region" aria-roledescription={copy('carousel','نمایش چرخشی')} aria-label={t('landing.projectsTitle')} onKeyDown={e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); advance(-1); }
          }}>
            {/* Keep the physical travel direction right-to-left in both languages;
                text inside each card inherits the selected language direction. */}
            <div dir="ltr" className="relative flex touch-pan-y gap-4 overflow-hidden rounded-2xl lg:gap-5"
              onTouchStart={e => { const point = e.touches[0]; if (point) touchStart.current = { x: point.clientX, y: point.clientY }; suppressClick.current = false; }}
              onTouchCancel={() => { touchStart.current = null; }}
              onTouchEnd={e => {
                const start = touchStart.current;
                touchStart.current = null;
                const end = e.changedTouches[0];
                if (!start || !end) return;
                const dx = end.clientX - start.x;
                const dy = end.clientY - start.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) { suppressClick.current = true; advance(dx < 0 ? 1 : -1); }
              }}
              onClickCapture={e => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}>
              <AnimatePresence initial={false} mode="popLayout">
                {cards.map(({ absolute, project, offset }) => {
                  const isActive = offset === 0;
                  const poster = project.image_url || project.gallery_images?.[0];
                  return (
                    <motion.article key={absolute + ':' + project.id} layout={reduced ? false : true}
                      initial={reduced ? false : { opacity: 0, x: direction > 0 ? 64 : -64 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -80 : 80 }}
                      transition={{ duration: reduced ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
                      className={`group relative shrink-0 overflow-hidden rounded-2xl bg-[#262F3A] ${isActive ? 'h-[390px] w-[86%] sm:w-[72%] lg:h-[500px] lg:w-[66%]' : 'h-[390px] w-[56%] sm:w-[32%] lg:h-[500px] lg:w-[28%]'}`}>
                      {poster && <img src={poster} alt={project.name} loading={isActive ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover" />}
                      {isActive && filmAvailable && !reduced && (
                        <video ref={video} src={film} poster={poster} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover"
                          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
                          onWaiting={() => setPlaying(false)} onError={() => setFailedPosition(position)}
                          onEnded={() => { setProgress(1); nextOnce(); }}
                          onTimeUpdate={e => {
                            const el = e.currentTarget;
                            const duration = Number.isFinite(el.duration) && el.duration > 0 ? Math.min(el.duration, FILM_PREVIEW_SECONDS) : FILM_PREVIEW_SECONDS;
                            setProgress(Math.min(1, el.currentTime / duration));
                            if (el.currentTime >= duration) { el.pause(); nextOnce(); }
                          }} />
                      )}
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                      {!isActive && <button type="button" aria-label={copy('Show project: ','نمایش پروژه: ') + project.name} onClick={() => advance(offset)} className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white" />}
                      <div dir={fa ? 'rtl' : 'ltr'} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 lg:p-8">
                        <p className="mb-2 flex items-center gap-2 text-xs text-white/80">{project.location && <><MapPin size={14} aria-hidden="true" />{project.location}</>}</p>
                        <h3 className={`font-semibold tracking-tight ${isActive ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg lg:text-xl'}`}>{project.name}</h3>
                        {isActive && <div className="mt-5 flex flex-wrap items-center gap-3">
                          <Link to={`/projects/${project.id}`} className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171A1F] hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{copy('Explore project','مشاهده پروژه')} <ArrowUpRight size={16} aria-hidden="true" /></Link>
                          {project.video_url && <span className="text-xs text-white/80">{filmAvailable && !reduced ? copy('Film preview · muted','پیش‌نمایش فیلم · بی‌صدا') : copy('Film on project page','فیلم در صفحه پروژه')}</span>}
                        </div>}
                      </div>
                      {isActive && <div className="absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/25" aria-hidden="true"><div className="h-full bg-white transition-[width] duration-100" style={{ width: `${progress * 100}%` }} /></div>}
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm tabular-nums text-white/65">
                <span aria-live={auto ? 'off' : 'polite'}>{String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
                <div className="flex gap-1.5">{featured.map((project, index) => <button key={project.id} type="button" aria-label={project.name} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => advance((index - activeIndex + count) % count)} className="flex h-9 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><span className={`block h-[3px] rounded-full transition-all ${index === activeIndex ? 'w-7 bg-white' : 'w-3 bg-white/30'}`} /></button>)}</div>
              </div>
              <div dir="ltr" className="flex items-center gap-2">
                {!reduced && <button type="button" className={control} onClick={() => setPaused(value => !value)} aria-label={paused ? copy('Resume slideshow','ادامه نمایش') : copy('Pause slideshow','توقف نمایش')}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}
                <button type="button" className={control} disabled={count < 2} onClick={() => advance(-1)} aria-label={copy('Previous project','پروژه قبلی')}><ArrowLeft size={19} /></button>
                <button type="button" className={control} disabled={count < 2} onClick={() => advance(1)} aria-label={copy('Next project','پروژه بعدی')}><ArrowRight size={19} /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/15 px-6 text-center">
            <Building2 size={30} className="mb-4 text-white/60" aria-hidden="true" />
            <p role="status">{loading ? copy('Loading projects…','در حال بارگذاری پروژه‌ها…') : t('landing.projectsEmptyTitle')}</p>
            {!loading && <p className="mt-2 text-sm text-white/65">{t('landing.projectsEmptySubtitle')}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
