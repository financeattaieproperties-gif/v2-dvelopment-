import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Building,
  ArrowLeft,
  ShieldCheck,
  Calculator,
  FileText,
  Sparkles,
  Phone,
  MessageCircle,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { getProperty, type Property } from '../lib/dbService';
import { ClickToCallButton } from '../components/ui/ClickToCallButton';
import { VisitRequestDialog } from '../components/forms/VisitRequestDialog';
import { SeoHead } from '../components/seo/SeoHead';
import { buildPropertySeo } from '../lib/seoConfig';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { MapSkeleton } from '../components/map/MapSkeleton';
import { PaymentPlanComparisonCard } from '../components/project/PaymentPlanComparisonCard';

const ImageGallery = lazy(() =>
  import('../components/property/ImageGallery').then((m) => ({ default: m.ImageGallery }))
);
const ApartmentWalkthroughVideo = lazy(() =>
  import('../components/video/ApartmentWalkthroughVideo').then((m) => ({
    default: m.ApartmentWalkthroughVideo,
  }))
);
const AttaieGoogleMap = lazy(() =>
  import('../components/map/AttaieGoogleMap').then((m) => ({ default: m.AttaieGoogleMap }))
);

// Detail panels use motion/react entrance animations

type DetailTab = 'overview' | 'specs' | 'payment';

export default function PropertyDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const validPropertyId = /^\d+$/.test(id || '') && Number.isSafeInteger(propertyId) && propertyId > 0;
  const isRtl = i18n.language === 'fa';

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);
  const [visitOpen, setVisitOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');

  const detailPanelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProperty(null);
    setVisitOpen(false);
    setError(null);
    setNotFound(false);
    if (!validPropertyId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getProperty(propertyId)
      .then((data) => {
        if (!active) return;
        if (data && typeof data === 'object' && typeof data.title === 'string' && Number(data.id) === propertyId) {
          setProperty(data);
        } else {
          setNotFound(true);
        }
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof Error && /not found/i.test(failure.message)) setNotFound(true);
        else setError('inventoryState.loadError');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [propertyId, validPropertyId, reload]);

  // Detail panels reveal handled via motion/react

  const allImages: string[] = property
    ? property.gallery_images && property.gallery_images.length > 0
      ? property.gallery_images
      : property.image_url
      ? [property.image_url]
      : []
    : [];

  const seo = buildPropertySeo(property, id);

  const breadcrumbItems = [
    { label: t('nav.properties', 'Properties'), href: '/properties' },
    ...(property?.type
      ? [{ label: property.type, href: `/properties?type=${encodeURIComponent(property.type)}` }]
      : []),
    { label: property?.title || t('breadcrumbs.propertyDetails', 'Property Details') },
  ];

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead seo={property ? seo : { ...seo, NoIndex: true }} context={{ property }} />
      <Navbar />

      {/* Top hierarchy bar */}
      <header className="bg-brand-navy pt-24 pb-4 border-b border-white/10">
        <div className="container-custom">
          <Breadcrumbs variant="light" items={breadcrumbItems} />
        </div>
      </header>

      {/* Swiper Fullscreen Gallery + GSAP Image Reveal */}
      <div>
        {loading ? (
          <div className="w-full h-[58vh] min-h-[420px] bg-neutral-200 animate-pulse" />
        ) : allImages.length > 0 ? (
          <div className="relative">
            <Suspense
              fallback={
                <div className="w-full h-[58vh] min-h-[420px] bg-neutral-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
                </div>
              }
            >
              <ImageGallery images={allImages} alt={property?.title ?? 'Property'} />
            </Suspense>
            <div className="absolute top-5 left-0 right-0 z-20 container-custom pointer-events-none">
              <Link
                to="/properties"
                className="pointer-events-auto inline-flex items-center gap-2 text-white hover:text-brand-gold transition-colors text-xs font-bold bg-brand-navy/80 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-xl shadow-lg"
              >
                <ArrowLeft size={15} />
                <span>Back to Properties</span>
              </Link>
            </div>
          </div>
        ) : property ? (
          <div className="w-full h-[58vh] min-h-[420px] bg-brand-navy flex items-center justify-center">
            <span className="text-white/70 text-sm">{t('inventoryState.noImages')}</span>
          </div>
        ) : null}
      </div>

      {/* Motion.dev Gallery-to-Detail Transition Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="container-custom pt-8 pb-24 sm:pb-16 flex-grow"
        ref={detailPanelsRef}
      >
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {error && (
          <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>{t(error)}</p>
            <button type="button" onClick={() => setReload(value => value + 1)} className="mt-3 font-semibold underline">{t('inventoryState.retry')}</button>
          </div>
        )}
        {notFound && !loading && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-bold text-brand-navy">{t('inventoryState.propertyNotFound')}</h1>
            <p className="mt-3 text-neutral-600">{t('inventoryState.propertyNotFoundHint')}</p>
            <Link to="/properties" className="mt-5 inline-block font-semibold text-brand-gold underline">{t('nav.properties')}</Link>
          </section>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {property && (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 min-w-0">
              <div data-gsap-detail className="flex flex-wrap items-center gap-2 mb-4">
                <Badge status={property.status} />
                <Badge type={property.type} />
                {property.serial_number && (
                  <span className="font-mono text-xs font-bold text-brand-gold px-2.5 py-1 rounded-lg bg-brand-gold/10 tabular-nums">
                    Ref. {property.serial_number}
                  </span>
                )}
              </div>

              <h1
                data-gsap-detail
                className="text-3xl md:text-4xl font-display font-bold text-brand-navy"
              >
                {property.title}
              </h1>
              <motion.div
                className="h-[2px] bg-brand-gold rounded-full mt-2 mb-6"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />

              <div data-gsap-detail className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    {property.listing_type === 'rent' ? 'Monthly Rent' : 'Verified Sale Price'}
                  </p>
                  <p className="text-4xl font-bold text-brand-gold tabular-nums">
                    {property.listing_type === 'rent'
                      ? `$${property.price.toLocaleString()} / mo`
                      : `$${property.price.toLocaleString()}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ClickToCallButton />
                  <button
                    type="button"
                    onClick={() => setVisitOpen(true)}
                    className="rounded-xl bg-brand-navy px-5 py-3 text-sm font-bold text-white hover:bg-brand-navy-light transition-colors cursor-pointer"
                  >
                    {t('visitDialog.requestVisitBtn')}
                  </button>
                </div>
              </div>

              {/* Spec badges */}
              <div
                data-gsap-detail
                className="flex flex-wrap gap-3 py-6 border-y border-neutral-200 mb-8 tabular-nums"
              >
                {property.beds != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Bed size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.beds}</span> Beds
                  </motion.div>
                )}
                {property.baths != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Bath size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.baths}</span> Baths
                  </motion.div>
                )}
                {property.area != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Maximize2 size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.area}</span> m²
                  </motion.div>
                )}
                {property.floor != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Building size={20} className="text-brand-gold" />
                    Floor <span className="font-bold ml-1">{property.floor}</span>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                >
                  <MapPin size={20} className="text-brand-gold" />
                  <span className="font-bold">{property.location}</span>
                </motion.div>
              </div>

              {/* 21st.dev Interactive Detail Panels with Motion.dev Tab Transitions */}
              <div
                data-gsap-detail
                className="bg-white rounded-2xl border border-brand-navy/8 p-6 md:p-8 mb-8 shadow-brand-md"
              >
                <div className="flex flex-wrap items-center gap-2 pb-5 mb-6 border-b border-neutral-100">
                  {[
                    { id: 'overview' as const, label: 'Property Overview', icon: FileText },
                    {
                      id: 'specs' as const,
                      label: 'Verification & Specs',
                      icon: ShieldCheck,
                    },
                    ...(property.listing_type !== 'rent'
                      ? [
                          {
                            id: 'payment' as const,
                            label: isRtl ? 'پلان‌های پرداخت' : 'Payment Plans',
                            icon: Calculator,
                          },
                        ]
                      : []),
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeDetailTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-brand-navy text-white'
                            : 'bg-brand-ivory text-neutral-600 hover:text-brand-navy'
                        }`}
                      >
                        <Icon size={14} className={active ? 'text-brand-gold' : ''} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {activeDetailTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                    >
                      <h2 className="text-xl font-bold text-brand-navy mb-3">
                        Architectural Description
                      </h2>
                      <p className="text-neutral-600 leading-relaxed text-base md:text-lg">
                        {property.description ||
                          'Verified Kabul residence represented by Attaie Properties with full legal documentation and private viewing availability.'}
                      </p>
                    </motion.div>
                  )}

                  {activeDetailTab === 'specs' && (
                    <motion.div
                      key="specs"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-nums"
                    >
                      {[
                        {
                          label: 'Title & Deed Verification',
                          value: 'Qabala Sharaee / Verified Clear Title',
                        },
                        {
                          label: 'Property Classification',
                          value: `${property.type} (${
                            property.listing_type === 'rent' ? 'For Rent' : 'For Sale'
                          })`,
                        },
                        {
                          label: 'Total Living Area',
                          value: property.area ? `${property.area} m²` : 'Standard Layout',
                        },
                        {
                          label: 'Power & Water Infrastructure',
                          value: '24/7 Solar-Hybrid Backup & Filtered Water',
                        },
                        {
                          label: 'Security & Access',
                          value: 'Guarded Entrance & Dedicated Parking',
                        },
                        {
                          label: 'Listing Reference',
                          value: property.serial_number || `ATP-${property.id}`,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="p-4 rounded-xl bg-brand-cream border border-brand-navy/6"
                        >
                          <p className="text-xs font-semibold text-neutral-500 mb-1">{row.label}</p>
                          <p className="text-sm font-bold text-brand-navy">{row.value}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeDetailTab === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                    >
                      <PaymentPlanComparisonCard
                        projectName={property.title}
                        initialPrice={property.price || 125000}
                        isRtl={isRtl}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Apartment & Property Video Walkthrough Showcase */}
              {property.video_url && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-1 h-5 bg-brand-gold rounded-full" />
                    <h2 className="text-xl font-bold text-brand-navy">
                      Apartment &amp; Interior Video Walkthrough
                    </h2>
                  </div>
                  <Suspense fallback={<div className="w-full aspect-video bg-neutral-900 rounded-2xl animate-pulse" />}>
                    <ApartmentWalkthroughVideo
                      url={property.video_url}
                      title={`${property.title} — Video Tour`}
                      subtitle={`High-definition interior walkthrough & architectural layout for ${property.type || 'residence'} in ${property.location || 'Kabul'}`}
                      posterUrl={property.image_url || property.gallery_images?.[0]}
                      location={property.location}
                      unitNumber={property.serial_number}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* Interactive Google Map & Neighborhood Explorer */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 bg-brand-gold rounded-full" />
                  <h2 className="text-xl font-bold text-brand-navy">
                    Location, Neighborhood &amp; Commute Map
                  </h2>
                </div>
                <Suspense fallback={<MapSkeleton heightClass="h-[460px]" label="Loading Neighborhood Map…" />}>
                  <AttaieGoogleMap
                    mode="single-property"
                    items={[
                      {
                        id: property.id,
                        title: property.title,
                        locationQuery: property.location || 'Kabul, Afghanistan',
                        priceDisplay:
                          property.listing_type === 'rent'
                            ? `$${property.price.toLocaleString()} / mo`
                            : `$${property.price.toLocaleString()}`,
                        type: property.type,
                        status: property.status,
                        beds: property.beds,
                        baths: property.baths,
                        area: property.area,
                        imageUrl: property.image_url,
                      },
                    ]}
                    heightClass="h-[460px]"
                    showNeighborhoodTools={true}
                    showDirections={true}
                  />
                </Suspense>
              </motion.div>
            </div>

            {/* Sticky Verified Advisor Direct Actions Sidebar (Inquiry Form Removed) */}
            <aside className="w-full lg:w-96 shrink-0">
              <div className="sticky top-28 space-y-4">
                <div className="p-4 rounded-2xl bg-brand-navy text-white flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-brand-gold shrink-0" />
                    <span className="text-xs font-semibold">
                      Direct Advisor Response within 2 Hours
                    </span>
                  </div>
                  <span className="text-xs font-mono text-brand-gold font-bold tabular-nums">
                    {property.serial_number || `ATP-${property.id}`}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-brand-navy/10 p-6 shadow-brand-md space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      {property.listing_type === 'rent' ? 'Monthly Rent' : 'Verified Sale Price'}
                    </span>
                    <p className="text-3xl font-extrabold text-brand-gold tabular-nums">
                      {property.listing_type === 'rent'
                        ? `$${property.price.toLocaleString()} / mo`
                        : `$${property.price.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {property.type} · {property.location}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                    <a
                      href={`https://wa.me/93782222279?text=${encodeURIComponent(
                        `Hello Attaie Properties, I am interested in "${property.title}" (Ref: ${
                          property.serial_number || property.id
                        }). Please share more details.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
                    >
                      <MessageCircle size={17} />
                      <span>Chat on WhatsApp</span>
                    </a>

                    <div className="w-full">
                      <ClickToCallButton className="w-full justify-center" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setVisitOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                    >
                      <CalendarCheck size={17} className="text-brand-gold" />
                      <span>{t('visitDialog.requestVisitBtn', 'Schedule Private Viewing')}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-ivory text-xs text-neutral-600 space-y-1.5 border border-neutral-200/60">
                    <div className="flex items-center gap-2 text-brand-navy font-bold">
                      <ShieldCheck size={15} className="text-brand-gold shrink-0" />
                      <span>Official Inquiry & Deals</span>
                    </div>
                    <p className="leading-relaxed">
                      To send an inquiry for this property, simply use the <strong className="text-brand-navy">Enquire</strong> button in the top navigation bar, or connect directly with our Kabul team above.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </motion.div>

      {/* Mobile Floating Action Button: Request Property Visit */}
      {property && (
        <aside
          aria-label={t('visitDialog.requestVisitBtn', 'Request Property Visit')}
          className="fixed bottom-4 inset-x-4 z-40 sm:hidden print:hidden"
        >
          <button
            type="button"
            data-testid="mobile-request-visit-fab"
            onClick={() => setVisitOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-navy/95 text-white font-bold text-sm shadow-2xl backdrop-blur-md border border-white/15 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-brand-navy"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                <CalendarCheck size={19} />
              </span>
              <div className="text-left rtl:text-right min-w-0">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-brand-gold truncate">
                  {t('visitDialog.eyebrow', 'Private Viewing')}
                </span>
                <span className="block text-sm font-bold text-white truncate">
                  {t('visitDialog.requestVisitBtn', 'Request Property Visit')}
                </span>
              </div>
            </div>
            <span className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white font-semibold flex items-center gap-1.5 shrink-0 ml-2 rtl:mr-2 rtl:ml-0">
              <span>{t('visitDialog.bookNow', 'Book Now')}</span>
              <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </span>
          </button>
        </aside>
      )}

      {property && visitOpen && (
        <VisitRequestDialog
          target={{ label: property.title, propertyId: property.id }}
          onClose={() => setVisitOpen(false)}
        />
      )}

      <Footer />
    </main>
  );
}
