import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Calendar,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { CareersDirectoryContent } from '../components/about/CareersDirectoryContent';

interface KabulWeatherCache {
  tempC: number;
  weatherCode: number;
  fetchedAt: number;
}

let cachedKabulWeather: KabulWeatherCache | null = null;

export const KabulLiveInfoBar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
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
      .then(res => {
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
      })
      .then(data => {
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
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

  const getWeatherMeta = (code: number) => {
    if (code === 0) return { label: t('careersPage.weatherClear'), Icon: Sun };
    if (code === 1 || code === 2) return { label: t('careersPage.weatherPartlyCloudy'), Icon: CloudSun };
    if (code === 3 || code === 45 || code === 48) return { label: t('careersPage.weatherCloudy'), Icon: Cloud };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: t('careersPage.weatherRain'), Icon: CloudRain };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: t('careersPage.weatherSnow'), Icon: CloudSnow };
    if (code >= 95) return { label: t('careersPage.weatherStorm'), Icon: CloudLightning };
    return { label: t('careersPage.weatherPartlyCloudy'), Icon: CloudSun };
  };

  const weatherMeta = weather ? getWeatherMeta(weather.weatherCode) : null;
  const WeatherIcon = weatherMeta?.Icon ?? CloudSun;

  return (
    <div className="inline-flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-brand-gold shrink-0" />
        <span className="text-sm font-bold text-white">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-gold shrink-0" />
        <span className="text-sm font-bold text-white font-mono">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-2">
        <WeatherIcon className="w-4 h-4 text-brand-gold shrink-0" />
        {weather ? (
          <span className="text-sm font-bold text-white">
            {weather.tempC}°C · {weatherMeta?.label}
          </span>
        ) : (
          <span className="text-sm text-white/75">
            {weatherFailed ? t('careersPage.weatherUnavailable') : '…'}
          </span>
        )}
      </div>
    </div>
  );
};

export default function CareersPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <SeoHead />
      <Navbar />

      <section className="relative bg-brand-navy pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[
              { label: t('nav.about', 'About Us'), href: '/about' },
              { label: t('nav.careers', 'Careers') },
            ]}
            className="mb-4"
          />
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-lt text-xs font-bold uppercase tracking-widest mb-4">
              <Briefcase className="w-3.5 h-3.5" />
              {t('careersPage.eyebrow')}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              {t('careersPage.title')}
            </h1>
            <p className="text-white/75 text-base md:text-lg leading-relaxed">
              {t('careersPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <CareersDirectoryContent />
      </main>

      <Footer />
    </div>
  );
}
