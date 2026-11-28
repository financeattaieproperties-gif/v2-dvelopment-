import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  motion,
  AnimatePresence,
} from 'motion/react';
import {
  MapPin,
  Building2,
  Bed,
  CircleDollarSign,
  Search,
  ShieldCheck,
  Users,
  ArrowRight,
  ChevronDown,
  MessageCircle,
  Phone,
  RotateCcw,
  Check,
} from 'lucide-react';
import { PromoBanner } from './PromoBanner';
import { PopularLocationsSection } from './PopularLocationsSection';
import { ServicesSection } from './ServicesSection';
import { HotDealsSection } from './HotDealsSection';
import { PropertyCard } from '../ui/PropertyCard';
import { MotionCarousel } from '../ui/MotionCarousel';
import { PropertyCardSkeleton } from '../ui/PropertyCardSkeleton';
import { SectionHeader } from '../ui/SectionHeader';
import { ClickToCallButton } from '../ui/ClickToCallButton';
import { getProperties, getProjects, type Property, type Project } from '../../lib/dbService';
import { LandingHeroBackground } from './LandingHeroBackground';
import { SignatureProjectGallery } from './SignatureProjectGallery';

const WHATSAPP_NUMBER = '93782222279';

const FEATURED_PROPERTIES_LIMIT = 6;
const FEATURED_PROJECTS_LIMIT = 8;

function toPropertyCardProps(p: Property) {
  return {
    id: String(p.id),
    serialNumber: p.serial_number,
    title: p.title,
    price: p.price,
    location: p.location,
    beds: p.beds ?? undefined,
    baths: p.baths ?? undefined,
    area: p.area ?? undefined,
    floor: p.floor ?? undefined,
    status: p.status,
    type: p.type,
    listingType: p.listing_type,
    image: p.image_url,
    galleryImages: p.gallery_images,
  };
}

type FilterTab = 'All' | 'For Sale' | 'For Rent' | 'Commercial';
const FILTER_TABS: Array<{ id: FilterTab; labelKey: string }> = [
  { id: 'All', labelKey: 'landing.filterAll' },
  { id: 'For Sale', labelKey: 'landing.filterForSale' },
  { id: 'For Rent', labelKey: 'landing.filterForRent' },
  { id: 'Commercial', labelKey: 'landing.filterCommercial' },
];

interface HeroSelectOption {
  label: string;
  value: string;
}

function HeroCustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  icon: Icon,
  hasRightDivider = false,
  colSpanClass = 'lg:col-span-3',
}: {
  id: string;
  label: string;
  value: string;
  options: HeroSelectOption[];
  onChange: (nextVal: string) => void;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  hasRightDivider?: boolean;
  colSpanClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`${colSpanClass} relative flex items-center gap-3 px-4 py-2 ${
        hasRightDivider ? 'lg:border-e border-neutral-200' : ''
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          open || value
            ? 'bg-brand-gold text-white shadow-gold-sm border border-brand-gold'
            : 'bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xs'
        }`}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>

      <div className="flex-1 min-w-0">
        <span
          id={`${id}-label`}
          className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none"
        >
          {label}
        </span>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 text-start font-bold text-sm text-brand-navy hover:text-brand-gold focus:outline-none cursor-pointer pt-0.5 transition-colors group"
        >
          <span className="truncate">{selectedOption.label}</span>
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            className={`text-brand-navy/60 shrink-0 transition-all duration-200 ${
              open ? 'rotate-180 text-brand-gold' : 'group-hover:text-brand-gold'
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute start-2 end-2 top-[calc(100%+10px)] z-50 rounded-2xl bg-white/98 backdrop-blur-xl border border-brand-navy/12 shadow-brand-xl p-1.5 max-h-56 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value || opt.label}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-start ${
                    isSelected
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-brand-navy hover:bg-brand-ivory hover:text-brand-gold'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={16} strokeWidth={2.5} className="text-brand-gold-lt shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const LandingPageContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const kabulLocations: HeroSelectOption[] = [
    { label: t('landing.allKabul'), value: '' },
    { label: t('locations.wakName'), value: 'Wazir Akbar Khan' },
    { label: t('locations.snName'), value: 'Shahr-e-Naw' },
    { label: 'Sherpur', value: 'Sherpur' },
    { label: 'Karte Parwan', value: 'Karte Parwan' },
    { label: 'Karte Char', value: 'Karte Char' },
    { label: 'Karte Se', value: 'Karte Se' },
    { label: 'Kolola Pushta', value: 'Kolola Pushta' },
    { label: 'Darulaman', value: 'Darulaman' },
    { label: 'Microrayan', value: 'Microrayan' },
    { label: t('locations.taimaniName'), value: 'Taimani' },
  ];

  const propertyTypeOptions: HeroSelectOption[] = [
    { label: t('landing.allTypes'), value: '' },
    { label: t('propertyTypes.Apartment'), value: 'Apartment' },
    { label: t('propertyTypes.House'), value: 'House' },
    { label: t('propertyTypes.Villa'), value: 'Villa' },
    { label: t('propertyTypes.Commercial'), value: 'Commercial' },
    { label: t('propertyTypes.Land'), value: 'Land' },
  ];

  const bedroomOptions: HeroSelectOption[] = [
    { label: t('landing.any'), value: '' },
    { label: t('landing.studioOneBed'), value: '1' },
    { label: t('landing.bedsPlus', { count: 2 }), value: '2' },
    { label: t('landing.bedsPlus', { count: 3 }), value: '3' },
    { label: t('landing.bedsPlus', { count: 4 }), value: '4' },
    { label: t('landing.bedsPlus', { count: 5 }), value: '5+' },
    { label: t('landing.bedsPlus', { count: 6 }), value: '6+' },
  ];

  const budgetOptions: HeroSelectOption[] = [
    { label: t('landing.anyBudget'), value: '' },
    { label: t('landing.budgetUnder75k'), value: '75000' },
    { label: t('landing.budgetUpTo125k'), value: '125000' },
    { label: t('landing.budgetUpTo200k'), value: '200000' },
    { label: t('landing.budgetUpTo350k'), value: '350000' },
    { label: t('landing.budgetUpTo500k'), value: '500000' },
    { label: t('landing.budget500kPlus'), value: '1000000' },
  ];

  // Hero Search Bar state
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBeds, setSelectedBeds] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  const activeSearchCriteriaCount = [
    selectedLocation,
    selectedType,
    selectedBeds,
    selectedBudget,
  ].filter(Boolean).length;

  useEffect(() => {
    Promise.all([
      getProperties().catch(() => null),
      getProjects().catch(() => null),
    ])
      .then(([props, projs]) => {
        if (Array.isArray(props)) {
          setProperties(props.slice(0, FEATURED_PROPERTIES_LIMIT));
        } else {
          setProperties([]);
        }

        if (Array.isArray(projs)) {
          setProjects(projs.slice(0, FEATURED_PROJECTS_LIMIT));
        } else {
          setProjects([]);
        }
      })
      .finally(() => setLoadingFeatured(false));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedLocation) params.set('search', selectedLocation);
    if (selectedType) params.set('type', selectedType);
    if (selectedType === 'Commercial') params.set('purpose', 'commercial');
    if (selectedBeds) params.set('beds', selectedBeds);
    if (selectedBudget) params.set('maxPrice', selectedBudget);
    const qs = params.toString();
    navigate(qs ? `/properties?${qs}` : '/properties');
  };

  const featuredProperties = properties.map(toPropertyCardProps);

  const filteredProperties = featuredProperties.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'For Sale') return p.listingType === 'sale';
    if (activeFilter === 'For Rent') return p.listingType === 'rent';
    if (activeFilter === 'Commercial') return p.type === 'Commercial';
    return true;
  });

  return (
    <>
      {/* ── 1. STITCH ARCHITECTURAL HERO SECTION + FLOATING SEARCH BAR ── */}
      <section className="relative z-30 pt-24 lg:pt-28 pb-12 bg-brand-cream">
        <div className="relative min-h-[540px] lg:min-h-[600px] flex flex-col justify-between">
          {/* Single Architectural Hero Background (Dynamic admin-configured or default) */}
          <LandingHeroBackground />

          {/* Left Column Hero Copy */}
          <div className="container-custom relative z-10 pt-10 lg:pt-16 pb-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <span className="eyebrow inline-block mb-3 tracking-[0.22em]">
                {t('landing.heroEyebrow')}
              </span>

              <h1 className="font-display font-extrabold text-brand-navy text-display tracking-tight leading-[1.06] mb-5">
                {t('landing.heroTitleLine1')}
                <br />
                {t('landing.heroTitleLine2')}
              </h1>

              <p className="text-neutral-600 text-base md:text-lg leading-relaxed max-w-md mb-7">
                {t('landing.heroSubtitle')}
              </p>

              {/* 3 Trust Pillars with high-visibility icon badges */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} strokeWidth={2.2} />
                  </span>
                  <span>{t('landing.pillar1')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <Building2 size={20} strokeWidth={2.2} />
                  </span>
                  <span>{t('landing.pillar2')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <Users size={20} strokeWidth={2.2} />
                  </span>
                  <span>{t('landing.pillar3')}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Horizontal Search Card */}
          <div className="container-custom relative z-20 pb-2">
            <motion.form
              onSubmit={handleHeroSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-3 md:p-4 shadow-brand-xl border border-brand-navy/8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-0 items-center"
            >
              {/* 1. Location */}
              <HeroCustomSelect
                id="hero-location"
                label={t('landing.searchLocationLabel')}
                value={selectedLocation}
                options={kabulLocations}
                onChange={setSelectedLocation}
                icon={MapPin}
                hasRightDivider={true}
                colSpanClass="lg:col-span-3"
              />

              {/* 2. Property Type */}
              <HeroCustomSelect
                id="hero-type"
                label={t('landing.searchTypeLabel')}
                value={selectedType}
                options={propertyTypeOptions}
                onChange={setSelectedType}
                icon={Building2}
                hasRightDivider={true}
                colSpanClass="lg:col-span-3"
              />

              {/* 3. Bedrooms */}
              <HeroCustomSelect
                id="hero-beds"
                label={t('landing.searchBedsLabel')}
                value={selectedBeds}
                options={bedroomOptions}
                onChange={setSelectedBeds}
                icon={Bed}
                hasRightDivider={true}
                colSpanClass="lg:col-span-2"
              />

              {/* 4. Budget */}
              <HeroCustomSelect
                id="hero-budget"
                label={t('landing.searchBudgetLabel')}
                value={selectedBudget}
                options={budgetOptions}
                onChange={setSelectedBudget}
                icon={CircleDollarSign}
                hasRightDivider={false}
                colSpanClass="lg:col-span-2"
              />

              {/* 5. Search CTA Button */}
              <div className="lg:col-span-2 ps-0 lg:ps-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-gold-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  <Search size={18} strokeWidth={2.4} />
                  <span>{t('landing.searchButton')}</span>
                </button>
              </div>
            </motion.form>

            {/* Motion.dev Live Search Feedback Bar */}
            <AnimatePresence>
              {activeSearchCriteriaCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-brand-navy/90 backdrop-blur-md text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-brand-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-brand-gold">{t('landing.activeFilter')}</span>
                    <span>
                      {[
                        selectedLocation || t('landing.allKabul'),
                        selectedType ? t(`propertyTypes.${selectedType}`, selectedType) : t('landing.allPropertyTypes'),
                        selectedBeds ? t('landing.bedsPlus', { count: Number(selectedBeds.replace('+', '')) }) : null,
                        selectedBudget
                          ? `$${Number(selectedBudget).toLocaleString()}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation('');
                      setSelectedType('');
                      setSelectedBeds('');
                      setSelectedBudget('');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} strokeWidth={2.2} />
                    <span>{t('landing.reset')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Desktop-first signature gallery: real published project photos and official logo. */}
      <SignatureProjectGallery projects={projects} />

      {/* ── 3. LATEST PROPERTIES SECTION ─────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-brand-cream">
        <div className="container-custom">
          {/* Header Row matching Stitch design */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-navy">
              {t('landing.latestPropertiesTitle')}
            </h2>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-brand-gold-dark transition-colors group"
            >
              <span>{t('landing.viewAllProperties')}</span>
              <ArrowRight
                size={17}
                strokeWidth={2.4}
                className="group-hover:translate-x-1 transition-transform rtl:rotate-180"
              />
            </Link>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              {FILTER_TABS.map((tab) => {
                const isActive = tab.id === activeFilter;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-navy text-white shadow-brand-sm'
                        : 'bg-white text-neutral-600 border border-brand-navy/10 hover:border-brand-gold hover:text-brand-navy'
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Listings: Default Swiper Carousel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {loadingFeatured && filteredProperties.length === 0 ? (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading featured properties"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12"
                >
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <PropertyCardSkeleton key={idx} />
                  ))}
                </div>
              ) : filteredProperties.length > 0 ? (
                <MotionCarousel
                  gap={24}
                  slidesPerView={{ base: 1, sm: 2, lg: 3 }}
                  autoplayDelay={5500}
                  showNavigation
                  showPagination
                  className="pb-12"
                >
                  {filteredProperties.map((prop) => (
                    <div key={prop.id} className="h-auto">
                      <PropertyCard {...prop} />
                    </div>
                  ))}
                </MotionCarousel>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                  <Building2 size={32} className="mx-auto text-brand-gold/60 mb-3" />
                  <p className="text-brand-navy font-semibold text-base mb-1">
                    {properties.length === 0
                      ? t('landing.propertiesEmptyTitle')
                      : t('landing.noMatchingFilter')}
                  </p>
                  {properties.length === 0 && (
                    <p className="text-neutral-500 text-sm">
                      {t('landing.propertiesEmptySubtitle')}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <PromoBanner
        eyebrow={t('landing.promoEyebrow')}
        title={t('landing.promoTitle')}
        description={t('landing.promoDesc')}
        bullets={[
          t('landing.promoBullet1'),
          t('landing.promoBullet2'),
          t('landing.promoBullet3'),
          t('landing.promoBullet4'),
        ]}
        ctaLabel={t('landing.promoCta')}
        ctaHref="/contact"
        imageSide="left"
        projectCovers={projects
          .filter((p) => Boolean(p.image_url))
          .map((p) => ({
            imageUrl: p.image_url as string,
            projectName: p.name,
            projectLocation: p.location,
          }))}
      />

      <PopularLocationsSection />

      <ServicesSection />

      <HotDealsSection />

      {/* ── CTA Strip ────────────────────────────────────────────────────── */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ background: 'var(--color-brand-navy)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(0,114,188,0.22) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 islamic-pattern opacity-25 pointer-events-none" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(0,114,188,0.5), transparent)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(0,114,188,0.5), transparent)',
          }}
        />

        <div className="container-custom relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold uppercase tracking-[0.3em] mb-5 flex items-center justify-center gap-3"
            style={{ color: 'var(--color-brand-gold)' }}
          >
            <span
              className="inline-block w-8 h-px"
              style={{ background: 'rgba(0,114,188,0.4)' }}
            />
            {t('landing.ctaEyebrow')}
            <span
              className="inline-block w-8 h-px"
              style={{ background: 'rgba(0,114,188,0.4)' }}
            />
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-bold text-white mb-6 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('landing.ctaTitleBefore')}
            <br />
            <span style={{ color: 'var(--color-brand-gold)' }}>{t('landing.ctaTitleHighlight')}</span> {t('landing.ctaTitleAfter')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-base mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {t('landing.ctaSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              aria-label={t('landing.whatsappUs')}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-colors shadow-lg"
              style={{
                background: '#25D366',
                boxShadow: '0 8px 28px rgba(37,211,102,0.35)',
              }}
            >
              <MessageCircle size={22} strokeWidth={2.4} aria-hidden="true" /> {t('landing.whatsappUs')}
            </motion.a>
            <motion.a
              href="tel:+93782222279"
              aria-label="Call us"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-colors"
              style={{
                background: 'var(--color-brand-gold)',
                boxShadow: '0 8px 28px rgba(0,114,188,0.4)',
              }}
            >
              <Phone size={21} strokeWidth={2.4} aria-hidden="true" /> <span dir="ltr">+93 782 222 279</span>
            </motion.a>
            <ClickToCallButton className="px-8 py-4 rounded-2xl font-bold text-base" />
          </motion.div>
        </div>
      </section>
    </>
  );
};
