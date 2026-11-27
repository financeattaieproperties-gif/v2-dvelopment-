import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toggleLanguage } from '../../i18n/index';
import { Button, cn } from '../ui/Button';
import {
  Menu,
  X,
  Globe,
  Phone,
  Calendar,
  Clock,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  ChevronDown,
  Users,
  Briefcase,
  Mail,
  Building2,
} from 'lucide-react';

interface KabulWeatherCache {
  tempC: number;
  weatherCode: number;
  fetchedAt: number;
}

let cachedKabulWeather: KabulWeatherCache | null = null;

function getWeatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3 || code === 45 || code === 48) return Cloud;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return CloudSun;
}

export const KabulHeaderWidgets: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation('common');
  const [now, setNow] = useState<Date>(() => new Date());
  const [weather, setWeather] = useState<KabulWeatherCache | null>(cachedKabulWeather);
  const [weatherFailed, setWeatherFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (cachedKabulWeather && Date.now() - cachedKabulWeather.fetchedAt < TEN_MINUTES) {
      setWeather(cachedKabulWeather);
      return;
    }

    const controller = new AbortController();
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=34.5553&longitude=69.2075&current=temperature_2m,weather_code',
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
      })
      .then((data) => {
        const temp = Number(data?.current?.temperature_2m);
        const code = Number(data?.current?.weather_code ?? 0);
        if (Number.isFinite(temp)) {
          const entry: KabulWeatherCache = {
            tempC: Math.round(temp),
            weatherCode: code,
            fetchedAt: Date.now(),
          };
          cachedKabulWeather = entry;
          setWeather(entry);
        } else {
          setWeatherFailed(true);
        }
      })
      .catch(() => {
        setWeatherFailed(true);
      });

    return () => controller.abort();
  }, []);

  const locale = i18n.language === 'fa' ? 'fa-AF' : 'en-US';

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Kabul',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now);
    } catch {
      return now.toISOString().slice(0, 10);
    }
  }, [now, locale]);

  const formattedTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Kabul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
    } catch {
      return now.toLocaleTimeString();
    }
  }, [now, locale]);

  const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode) : CloudSun;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 text-xs text-brand-navy/85 font-medium tabular-nums whitespace-nowrap',
        className
      )}
    >
      <div className="inline-flex items-center gap-1.5">
        <Calendar size={14} strokeWidth={2.2} className="text-brand-gold shrink-0" />
        <span>{formattedDate}</span>
      </div>
      <span className="text-brand-navy/25" aria-hidden="true">
        ·
      </span>
      <div className="inline-flex items-center gap-1.5">
        <Clock size={14} strokeWidth={2.2} className="text-brand-gold shrink-0" />
        <span className="font-mono">{formattedTime}</span>
      </div>
      <span className="text-brand-navy/25" aria-hidden="true">
        ·
      </span>
      <div className="inline-flex items-center gap-1.5">
        <WeatherIcon size={15} strokeWidth={2.2} className="text-brand-gold shrink-0" />
        <span>{weather ? `${weather.tempC}°C` : weatherFailed ? '—' : '…'}</span>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [aboutHoverOpen, setAboutHoverOpen] = useState(false);
  const [aboutPinnedOpen, setAboutPinnedOpen] = useState(false);
  const [mobileAboutExpanded, setMobileAboutExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const aboutMenuRef = useRef<HTMLDivElement>(null);
  const aboutMenuOpen = aboutHoverOpen || aboutPinnedOpen;

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => setIsScrolled(window.scrollY > 60));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(e.target as Node)) {
        setAboutHoverOpen(false);
        setAboutPinnedOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const aboutSubLinks = [
    { name: t('nav.about', 'About Us'), href: '/about', icon: Building2 },
    { name: t('nav.agents', 'Our Agents'), href: '/about?tab=agents', icon: Users },
    { name: t('nav.careers', 'Careers'), href: '/about?tab=careers', icon: Briefcase },
    { name: t('nav.contact', 'Contact'), href: '/about?tab=contact', icon: Mail },
  ];

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.properties'), href: '/properties' },
    { name: t('nav.projects'), href: '/projects' },
    { name: t('nav.about'), href: '/about', subLinks: aboutSubLinks },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/about') {
      return (
        pathname.startsWith('/about') ||
        pathname.startsWith('/agents') ||
        pathname.startsWith('/careers') ||
        pathname.startsWith('/contact')
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-500',
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-brand-navy/10 py-3'
          : 'bg-white/95 backdrop-blur-xl border-b border-brand-navy/10 py-5',
      )}
    >
      <div className="container-custom flex justify-between items-center gap-3">
        {/* Logo + Date, Time & Weather right beside the logo */}
        <div className="flex items-center gap-3.5 shrink-0">
          <Link to="/" className="group flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="Attaie Properties"
              className="h-14 xl:h-16 w-auto object-contain transition-opacity duration-200 group-hover:opacity-85"
              decoding="async"
            />
          </Link>
          <KabulHeaderWidgets className="hidden md:flex ps-3.5 border-s border-brand-navy/15" />
        </div>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            if (link.subLinks) {
              return (
                <div
                  key={link.name}
                  ref={aboutMenuRef}
                  className="relative flex items-center"
                  onMouseEnter={() => setAboutHoverOpen(true)}
                  onMouseLeave={() => setAboutHoverOpen(false)}
                >
                  <div className="inline-flex items-center">
                    <Link
                      to={link.href}
                      className={cn(
                        'relative inline-flex items-center gap-1 font-medium text-sm tracking-wide transition-colors duration-200 py-1 px-2.5 xl:px-3 rounded-full whitespace-nowrap',
                        active
                          ? 'text-brand-gold'
                          : 'text-brand-navy/75 hover:text-brand-gold hover:bg-brand-navy/5',
                      )}
                    >
                      <span>{link.name}</span>
                      {active && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute -bottom-1 start-3 end-3 h-[1.5px] bg-brand-gold rounded-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                    <button
                      type="button"
                      aria-label={t('nav.toggleAboutSubmenu')}
                      aria-expanded={aboutMenuOpen}
                      data-testid="nav-about-dropdown-btn"
                      onClick={() => {
                        if (aboutPinnedOpen) {
                          setAboutPinnedOpen(false);
                          setAboutHoverOpen(false);
                        } else {
                          setAboutPinnedOpen(true);
                        }
                      }}
                      className={cn(
                        'p-1 rounded-full transition-colors cursor-pointer -ms-1.5',
                        active ? 'text-brand-gold' : 'text-brand-navy/70 hover:text-brand-gold',
                      )}
                    >
                      <ChevronDown
                        size={14}
                        className={cn('transition-transform duration-200', aboutMenuOpen && 'rotate-180')}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {aboutMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.16 }}
                        data-testid="nav-about-dropdown"
                        className="absolute top-full end-0 mt-2 w-52 rounded-xl bg-white backdrop-blur-xl border border-brand-navy/15 shadow-2xl p-1.5 z-50"
                      >
                        {link.subLinks.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              to={sub.href}
                              onClick={() => {
                                setAboutPinnedOpen(false);
                                setAboutHoverOpen(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-navy/85 hover:text-brand-gold hover:bg-brand-navy/5 transition-colors"
                            >
                              <SubIcon size={15} className="text-brand-gold shrink-0" />
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'relative font-medium text-sm tracking-wide transition-colors duration-200 py-1 px-2.5 xl:px-3 rounded-full whitespace-nowrap',
                  active
                    ? 'text-brand-gold'
                    : 'text-brand-navy/75 hover:text-brand-gold hover:bg-brand-navy/5',
                )}
              >
                {link.name}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 start-3 end-3 h-[1.5px] bg-brand-gold rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-brand-navy whitespace-nowrap">
            <Phone size={16} strokeWidth={2.2} className="text-brand-gold" />
            <span className="font-bold text-sm tabular-nums" dir="ltr">+93 782 222 279</span>
          </div>
          <div className="hidden xl:block h-4 w-[1px] bg-brand-navy/20" />
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 p-2 text-sm font-medium text-brand-navy/70 transition-colors hover:text-brand-gold whitespace-nowrap"
            aria-label={t('nav.switchLanguage')}
          >
            <Globe size={17} strokeWidth={2.2} />
            {t('nav.langToggle')}
          </button>
          <Button
            variant="primary"
            className={cn(showPulse && 'pulse-gold', 'whitespace-nowrap')}
            onClick={() => navigate('/about?tab=contact')}
          >
            {t('nav.enquire')}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-brand-navy"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden absolute top-full start-0 w-full bg-brand-navy/98 backdrop-blur-xl border-t border-white/10 shadow-2xl"
          >
            <div className="container-custom py-6 flex flex-col gap-1">
              <div className="pb-3 mb-2 border-b border-white/10">
                <KabulHeaderWidgets />
              </div>
              {navLinks.map((link, i) =>
                link.subLinks ? (
                  <div key={link.name} className="border-b border-white/8">
                    <div className="flex items-center justify-between py-3.5">
                      <Link
                        to={link.href}
                        className="text-lg font-semibold text-white hover:text-brand-gold transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.name}
                      </Link>
                      <button
                        type="button"
                        aria-label={t('nav.toggleAboutSubmenu')}
                        aria-expanded={mobileAboutExpanded}
                        onClick={() => setMobileAboutExpanded((v) => !v)}
                        className="p-1.5 text-white/75 hover:text-brand-gold"
                      >
                        <ChevronDown
                          size={18}
                          className={cn('transition-transform duration-200', mobileAboutExpanded && 'rotate-180')}
                        />
                      </button>
                    </div>
                    {mobileAboutExpanded && (
                      <div className="pb-3 ps-4 flex flex-col gap-1.5">
                        {link.subLinks.map((sub) => (
                          <Link
                            key={sub.href}
                            to={sub.href}
                            className="py-1.5 text-sm font-medium text-white/80 hover:text-brand-gold transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-white/8"
                  >
                    <Link
                      to={link.href}
                      className="block text-lg font-semibold text-white py-3.5 hover:text-brand-gold transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ),
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-3 pt-5"
              >
                <div className="flex items-center gap-3 text-white">
                  <Phone size={18} className="text-brand-gold" />
                  <span className="font-bold" dir="ltr">+93 782 222 279</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate('/about?tab=contact');
                    setIsOpen(false);
                  }}
                >
                  {t('nav.enquire')}
                </Button>
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-lg text-white font-medium hover:border-brand-gold hover:text-brand-gold transition-colors"
                >
                  <Globe size={16} /> {t('nav.langToggle')}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { Navbar };
