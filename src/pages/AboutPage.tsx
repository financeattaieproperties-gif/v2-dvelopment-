import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MotionCarousel } from '../components/ui/MotionCarousel';
import {
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  Home,
  Building2,
  CheckCircle2,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import {
  Footer,
  OFFICIAL_SOCIAL_LINKS,
  FacebookIcon,
  YoutubeIcon,
} from '../components/layout/Footer';
import { getBranches, type Branch } from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { AgentsDirectoryContent } from '../components/about/AgentsDirectoryContent';
import { CareersDirectoryContent } from '../components/about/CareersDirectoryContent';
import { ContactSectionContent } from '../components/about/ContactSectionContent';
import { useTranslation } from 'react-i18next';
import stitchHeroImg from '../assets/images/stitch_hero_kabul_panorama.jpg';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';
import categoryCommercialImg from '../assets/images/category_commercial_plaza_1794037429778.jpg';
import categoryProjectsImg from '../assets/images/category_master_projects_1794037429266.jpg';
import stitchVillaImg from '../assets/images/stitch_villa_exterior.jpg';

// Brand story chapters driven by motion/react whileInView

const BRAND_STORY_CHAPTERS = [
  {
    year: '2015',
    number: '01.',
    title: 'Founding in Wazir Akbar Khan',
    summary:
      'Attaie Properties was established on Street #13, Wazir Akbar Khan with a clear mandate: bring legal title verification (Qabala Sharaee) and transparent pricing to Kabul’s residential market.',
  },
  {
    year: '2018',
    number: '02.',
    title: 'Diaspora & Diplomatic Advisory Desk',
    summary:
      'Expanded to serve overseas Afghan families in Europe, North America, and the Gulf with remote video inspections, power-of-attorney documentation support, and escrow-backed closings.',
  },
  {
    year: '2022',
    number: '03.',
    title: 'Signature Multi-Unit Developments',
    summary:
      'Partnered with Kabul’s premier structural engineering firms to represent multi-story residential and commercial plazas in Shahr-e-Naw, Ansari Square, and Karte Parwan.',
  },
  {
    year: '2026',
    number: '04.',
    title: 'Digital Real Estate & Interactive Masterplan Platform',
    summary:
      'Launched interactive 3D floor plan inspection, neighborhood Google Maps routing, and real-time unit inventory tracking for modern buyers across Afghanistan’s capital.',
  },
];

const MILESTONE_SLIDES = [
  {
    year: '2015 — Wazir Akbar Khan HQ',
    title: 'Diplomatic Quarter Flagship Office',
    caption: 'Establishing our primary advisory headquarters on Street #13, Wazir Akbar Khan.',
    image: stitchHeroImg,
  },
  {
    year: '2019 — Executive Residences',
    title: 'Karte Parwan & Darulaman Villa Portfolio',
    caption: 'Curating private walled family compounds and executive residences across Kabul.',
    image: stitchVillaImg,
  },
  {
    year: '2023 — Commercial Landmarks',
    title: 'Shahr-e-Naw Grade-A Retail & Office Plazas',
    caption: 'Structuring high-yield commercial real estate opportunities in Ansari Square.',
    image: categoryCommercialImg,
  },
  {
    year: '2026 — Signature Towers',
    title: 'Residential & Multi-Tower Developments',
    caption: 'Seismic-grade modern apartment living with 24/7 solar-hybrid microgrids.',
    image: defaultExteriorImg,
  },
  {
    year: '2026 — Masterplan Engineering',
    title: 'Next-Generation Urban Horizon',
    caption: 'Connecting local families and global Afghan diaspora investors with verified developments.',
    image: categoryProjectsImg,
  },
];

const FALLBACK_BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Wazir Akbar Khan Headquarters',
    address: 'Street #13, Wazir Akbar Khan, Kabul, Afghanistan',
    phone: '+93 782 222 279',
    email: 'info@attaieproperties.com',
  },
  {
    id: 2,
    name: 'Shahr-e-Naw Development Sales Office',
    address: 'Ansari Square, Shahr-e-Naw, Kabul, Afghanistan',
    phone: '+93 782 222 279',
    email: 'sales@attaieproperties.com',
  },
];

type AboutTab = 'overview' | 'agents' | 'careers' | 'contact';

const ABOUT_TABS: ReadonlyArray<{ id: AboutTab; icon: typeof Building2; labelKey: string; fallback: string }> = [
  { id: 'overview', icon: Building2, labelKey: 'aboutPage.tabs.overview', fallback: 'Overview' },
  { id: 'agents', icon: Users, labelKey: 'nav.agents', fallback: 'Our Agents' },
  { id: 'careers', icon: Briefcase, labelKey: 'nav.careers', fallback: 'Careers' },
  { id: 'contact', icon: Mail, labelKey: 'nav.contact', fallback: 'Contact' },
];

export default function AboutPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: AboutTab =
    rawTab === 'agents' || rawTab === 'careers' || rawTab === 'contact' ? rawTab : 'overview';

  const setActiveTab = (tab: AboutTab) => {
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const [branches, setBranches] = useState<Branch[]>(FALLBACK_BRANCHES);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const pinnedStorySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBranches()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBranches(list);
        } else {
          setBranches(FALLBACK_BRANCHES);
        }
      })
      .catch(() => setBranches(FALLBACK_BRANCHES))
      .finally(() => setBranchesLoading(false));
  }, []);

  // Brand Story chapters use motion/react whileInView + onViewportEnter

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-16 bg-brand-navy overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
        <div className="container-custom relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <Breadcrumbs
              variant="light"
              items={
                activeTab === 'overview'
                  ? [{ label: t('nav.about', 'About Us') }]
                  : [
                      { label: t('nav.about', 'About Us'), href: '/about' },
                      {
                        label:
                          activeTab === 'agents'
                            ? t('nav.agents', 'Our Agents')
                            : activeTab === 'careers'
                            ? t('nav.careers', 'Careers')
                            : t('nav.contact', 'Contact'),
                      },
                    ]
              }
              className="w-auto"
            />
          </div>
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-4">
            {t('aboutPage.kabulLocation')}
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            {activeTab === 'agents'
              ? t('aboutPage.agentsTitle')
              : activeTab === 'careers'
              ? t('careersPage.title')
              : activeTab === 'contact'
              ? t('aboutPage.contactTitle')
              : t('aboutPage.overviewTitle')}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            {activeTab === 'agents'
              ? t('aboutPage.agentsSubtitle')
              : activeTab === 'careers'
              ? t('careersPage.subtitle')
              : activeTab === 'contact'
              ? t('aboutPage.contactSubtitle')
              : t('aboutPage.overviewSubtitle')}
          </p>
        </div>
      </section>

      {/* About Sub-Navigation Tabs: Overview · Our Agents · Careers · Contact */}
      <div className="bg-white border-b border-neutral-200/80 sticky top-[76px] z-30 shadow-2xs">
        <div className="container-custom py-3 flex items-center justify-center">
          <div
            role="tablist"
            aria-label="About sections"
            className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-brand-ivory p-1 rounded-xl border border-brand-navy/10"
          >
            {ABOUT_TABS.map(({ id, icon: TabIcon, labelKey, fallback }) => {
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`about-tab-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-neutral-600 hover:text-brand-navy hover:bg-white/70'
                  }`}
                >
                  <TabIcon size={15} className={selected ? 'text-brand-gold' : ''} />
                  <span>{t(labelKey, fallback)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === 'agents' && <AgentsDirectoryContent />}
      {activeTab === 'careers' && <CareersDirectoryContent />}
      {activeTab === 'contact' && <ContactSectionContent />}

      {activeTab === 'overview' && (
      <>
      {/* Stats */}
      <section className="bg-white border-b border-neutral-100">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 tabular-nums">
            {[
              { icon: Home, value: '500+', label: t('aboutPage.stat1Label') },
              { icon: Users, value: '1,200+', label: t('aboutPage.stat2Label') },
              { icon: Award, value: t('aboutPage.stat3Value'), label: t('aboutPage.stat3Label') },
            ].map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                  <Icon size={26} className="text-brand-gold" />
                </div>
                <p className="text-3xl font-display font-bold text-brand-navy">{value}</p>
                <p className="text-neutral-500 text-sm font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GSAP Pinned Brand Story + 21st.dev Editorial Sections */}
      <section ref={pinnedStorySectionRef} className="container-custom py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sticky / Pinned Left Narrative Anchor */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 bg-brand-navy text-white rounded-2xl p-8 md:p-10 shadow-brand-xl relative overflow-hidden">
            <div className="absolute inset-0 islamic-pattern opacity-15 pointer-events-none" />
            <div className="relative z-10">
              <span className="eyebrow inline-block mb-3">{t('aboutPage.storyEyebrow')}</span>
              <h2 className="text-3xl font-display font-bold text-white leading-tight mb-4">
                {t('aboutPage.storyTitle')}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                {t('aboutPage.storyBody')}
              </p>

              <div className="p-4 rounded-xl bg-white/10 border border-white/15 mb-6">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                  {t('aboutPage.activeChapter')} · {BRAND_STORY_CHAPTERS[activeStoryIdx]?.year}
                </p>
                <p className="text-base font-bold text-white">
                  {BRAND_STORY_CHAPTERS[activeStoryIdx]?.title}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>{t('aboutPage.trust1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>{t('aboutPage.trust2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>{t('aboutPage.trust3')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Scroll-Scrubbed Editorial Timeline Chapters */}
          <div className="lg:col-span-7 space-y-6">
            {BRAND_STORY_CHAPTERS.map((ch, idx) => {
              const isCurrent = idx === activeStoryIdx;
              return (
                <motion.div
                  key={ch.year}
                  initial={{ opacity: 0.35, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  onViewportEnter={() => setActiveStoryIdx(idx)}
                  onMouseEnter={() => setActiveStoryIdx(idx)}
                  className={`rounded-2xl p-7 md:p-8 bg-white transition-all duration-300 border ${
                    isCurrent
                      ? 'border-brand-gold shadow-brand-lg'
                      : 'border-brand-navy/8 shadow-brand-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-3 tabular-nums">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                      {ch.number} {t('aboutPage.milestoneLabel')}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-brand-navy text-white text-xs font-bold">
                      {ch.year}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-brand-navy mb-2.5">
                    {ch.title}
                  </h3>
                  <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
                    {ch.summary}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Swiper Milestone Images Carousel */}
      <section className="py-16 bg-white border-y border-neutral-200/70">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="eyebrow">{t('aboutPage.milestonesEyebrow')}</span>
              <h2 className="text-3xl font-display font-bold text-brand-navy mt-1">
                {t('aboutPage.milestonesTitle')}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              {t('aboutPage.milestonesSubtitle')}
            </p>
          </div>

          <MotionCarousel
            slidesPerView={{ base: 1, sm: 1.4, lg: 2.2 }}
            gap={24}
            autoplayDelay={5000}
            className="pb-4"
          >
            {MILESTONE_SLIDES.map((slide) => (
              <div key={slide.title} className="group rounded-2xl overflow-hidden bg-brand-navy border border-brand-navy/10 shadow-brand-md">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/30 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                      {slide.year}
                    </span>
                    <h3 className="text-xl font-display font-bold text-white mt-0.5">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-white/75 mt-1 line-clamp-2">{slide.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </MotionCarousel>
        </div>
      </section>

      {/* Admin-managed branch directory */}
      <section className="container-custom py-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold mb-2">
            {t('aboutPage.branchesEyebrow')}
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-navy">
            {t('aboutPage.branchesTitle')}
          </h2>
        </div>
        {branchesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-label="Loading branches">
            {[0, 1].map((item) => (
              <div key={item} className="h-36 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((branch) => (
              <motion.article
                key={branch.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-brand-navy/8 bg-white p-6 shadow-brand-sm hover:border-brand-gold/35 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
                    <Building2 size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">{branch.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                      {branch.address}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {branch.phone && (
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
                          href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`}
                        >
                          <Phone size={15} />
                          {branch.phone}
                        </a>
                      )}
                      {branch.email && (
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
                          href={`mailto:${branch.email}`}
                        >
                          <Mail size={15} />
                          {branch.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Quick Switch to Agents, Careers, Contact right inside About */}
      <section className="container-custom pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              id: 'agents' as const,
              icon: Users,
              title: t('nav.agents', 'Our Agents'),
              desc: t('aboutPage.quickAgentsDesc'),
            },
            {
              id: 'careers' as const,
              icon: Briefcase,
              title: t('nav.careers', 'Careers'),
              desc: t('aboutPage.quickCareersDesc'),
            },
            {
              id: 'contact' as const,
              icon: Mail,
              title: t('nav.contact', 'Contact'),
              desc: t('aboutPage.quickContactDesc'),
            },
          ].map(({ id, icon: CardIcon, title, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group text-start bg-white rounded-2xl border border-brand-navy/10 hover:border-brand-gold p-6 shadow-brand-sm hover:shadow-brand-md transition-all cursor-pointer flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <CardIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy group-hover:text-brand-gold transition-colors">
                  {title} <span className="inline-block rtl:rotate-180">→</span>
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-brand-navy mt-auto">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-white/10">
            {[
              {
                icon: MapPin,
                label: t('aboutPage.addressLabel'),
                value: t('footer.address'),
              },
              { icon: Phone, label: t('aboutPage.phoneLabel'), value: '+93 782 222 279', href: 'tel:+93782222279' },
              {
                icon: Mail,
                label: t('aboutPage.emailLabel'),
                value: 'info@attaieproperties.com',
                href: 'mailto:info@attaieproperties.com',
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-white hover:text-brand-gold transition-colors text-sm font-medium"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-white text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Official Facebook & YouTube Channels row */}
          <div className="pt-8">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4">
              {t('aboutPage.socialHeading')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {OFFICIAL_SOCIAL_LINKS.map((social) => {
                const Icon = social.platform === 'facebook' ? FacebookIcon : YoutubeIcon;
                return (
                  <a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-gold/15 flex items-center justify-center shrink-0 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider leading-none mb-1">
                          {social.label}
                        </p>
                        <p
                          className="text-xs font-semibold text-white group-hover:text-brand-gold transition-colors truncate"
                          dir="auto"
                        >
                          {social.name}
                        </p>
                      </div>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-white/40 group-hover:text-brand-gold shrink-0 transition-colors"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      <Footer />
    </main>
  );
}
