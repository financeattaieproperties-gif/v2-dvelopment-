import { useEffect, useState, type MouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bed,
  Bath,
  Maximize2,
  Building2,
  Layers,
  X,
  CheckCircle2,
  CreditCard,
  Compass,
  Sparkles,
  Eye,
  Camera,
  Video,
  Play,
  ChevronLeft,
  ChevronRight,
  Film,
} from 'lucide-react';
import { getProjectUnits, type ProjectUnit } from '@/lib/dbService';
import { Badge } from '@/components/ui/Badge';
import { PaymentPlanComparisonCard } from '@/components/project/PaymentPlanComparisonCard';
import { ProjectUnitsOccupancyChart } from '@/components/project/ProjectUnitsOccupancyChart';
import { VideoPlayer } from '@/components/property/VideoPlayer';
import { resolveUnitPlans } from '@/lib/projectExplorerUtils';

interface ProjectUnitsSectionProps {
  projectId: string | number;
  projectName: string;
}

const statusBadgeMap: Record<
  ProjectUnit['status'],
  'available' | 'pending' | 'sold' | 'rented'
> = {
  available: 'available',
  reserved: 'pending',
  sold: 'sold',
  rented: 'rented',
};

export function ApartmentFullInfoModal({
  unit,
  projectName,
  onClose,
}: {
  unit: ProjectUnit;
  projectName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const allPhotos: string[] = [
    ...(unit.image_url ? [unit.image_url] : []),
    ...(Array.isArray(unit.gallery_images)
      ? unit.gallery_images.filter((img): img is string => Boolean(img) && img !== unit.image_url)
      : []),
  ];

  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const activePhoto = allPhotos[currentPhotoIdx] || unit.image_url || null;

  const displayTitle = unit.title || `${projectName} — Unit ${unit.unit_number}`;
  const currency = unit.currency || 'USD';
  const { technicalPlan, furnishedPlan, legendImg } = resolveUnitPlans(unit, null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header & Main Photo Stage */}
        <div className="relative h-64 sm:h-80 md:h-96 bg-brand-navy shrink-0 overflow-hidden select-none">
          {activePhoto ? (
            <img
              key={activePhoto}
              src={activePhoto}
              alt={`${displayTitle} - Photo ${currentPhotoIdx + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy-deep">
              <Building2 className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close apartment details"
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media Badges Top-Left */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
            {allPhotos.length > 1 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/65 text-white backdrop-blur-xs flex items-center gap-1.5 shadow-xs border border-white/10">
                <Camera className="w-3.5 h-3.5 text-brand-gold" />
                <span>Photo {currentPhotoIdx + 1} of {allPhotos.length}</span>
              </span>
            )}
            {unit.video_url && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 text-white backdrop-blur-xs flex items-center gap-1.5 shadow-xs border border-emerald-400/20">
                <Film className="w-3.5 h-3.5 text-white" />
                <span>Interior Video Tour</span>
              </span>
            )}
          </div>

          {/* Gallery Navigation Arrows (if multiple photos) */}
          {allPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Unit Info overlay at bottom of header */}
          <div className="absolute bottom-4 left-6 right-6 z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-brand-gold text-white shadow-xs">
                  Unit {unit.unit_number}
                </span>
                <Badge status={statusBadgeMap[unit.status]} />
                <span className="text-xs text-white/90 font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  {unit.floor !== null ? `Floor ${unit.floor}` : 'Typical Floor'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                {displayTitle}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-white/70 block">
                Official Valuation
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {unit.price !== null
                  ? `${currency} ${Number(unit.price).toLocaleString()}`
                  : 'Inquire for Price'}
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery Strip (if multiple photos) */}
        {allPhotos.length > 1 && (
          <div className="bg-brand-navy-deep/95 border-b border-brand-navy/60 px-4 py-2.5 flex items-center gap-2.5 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Camera className="w-3.5 h-3.5 text-brand-gold" />
              Gallery:
            </span>
            {allPhotos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPhotoIdx(idx)}
                className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  currentPhotoIdx === idx
                    ? 'border-brand-gold ring-2 ring-brand-gold/60 opacity-100 scale-105'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/40'
                }`}
                title={`Photo ${idx + 1}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
                <Bed className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  Bedrooms
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.beds !== null ? `${unit.beds} Beds` : '3 Beds'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
                <Bath className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  Bathrooms
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.baths !== null ? `${unit.baths} Baths` : '2 Baths'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  Floor Level
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.floor !== null ? `Floor ${unit.floor}` : 'Typical'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  Total Area
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.area !== null ? `${unit.area} m²` : '165 m²'}
                </p>
              </div>
            </div>
          </div>

          {/* Interior Video Walkthrough Section (if video provided) */}
          {unit.video_url && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-brand-gold" />
                  Interior Video Walkthrough & Tour
                </h4>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-emerald-700" />
                  HD Apartment Video Tour
                </span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-xs">
                <VideoPlayer
                  url={unit.video_url}
                  title={`${displayTitle} — Interior Walkthrough`}
                  subtitle="Detailed apartment walkthrough highlighting finishes, window glazing, and layout"
                  posterUrl={unit.image_url || (Array.isArray(unit.gallery_images) ? unit.gallery_images[0] : null)}
                  unitNumber={unit.unit_number}
                  location={projectName}
                  compact
                />
              </div>
            </div>
          )}

          {/* Interactive Architectural Floor Plan */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-gold" />
                Architectural Layout Plan
              </h4>
              <span className="text-[11px] font-semibold text-gray-500">
                Aligned Scale Blueprint
              </span>
            </div>

            <div className={`grid grid-cols-1 ${legendImg ? 'md:grid-cols-12' : 'md:grid-cols-2'} gap-4 items-center`}>
              <div className={`${legendImg ? 'md:col-span-8' : ''} bg-white border border-gray-200 rounded-lg p-2 overflow-hidden flex items-center justify-center min-h-[220px]`}>
                <img
                  src={furnishedPlan}
                  alt={`${unit.unit_number} Furnished Plan`}
                  className="max-h-56 w-auto object-contain mx-auto"
                  loading="lazy"
                />
              </div>

              {legendImg ? (
                <div className="md:col-span-4 bg-white border border-gray-200 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Masterplan Location Legend
                  </p>
                  <img
                    src={legendImg}
                    alt="Apartment Location in Masterplan"
                    className="max-h-40 w-auto object-contain rounded border border-gray-100 bg-gray-50 p-1"
                    loading="lazy"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Highlighted zone shows unit position on the floor plate
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                  <img
                    src={technicalPlan}
                    alt={`${unit.unit_number} Technical Plan`}
                    className="max-h-56 w-auto object-contain mx-auto"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Full Description & Architectural Highlights */}
          <div className="bg-brand-cream/60 rounded-xl p-4 border border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              Residence Overview & Highlights
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {unit.description ||
                `Unit ${unit.unit_number} in ${projectName} is engineered to contemporary structural standards with abundant natural daylight, high-insulation acoustic glazing, independent heating infrastructure, and premium interior finishes.`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/70 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reinforced seismic-grade concrete structure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>24/7 high-speed elevator & backup power</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dedicated underground parking & storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Status: {unit.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Pre-Sale Payment Plan Comparison */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-brand-gold" />
              <h4 className="text-sm font-bold text-brand-navy">
                Available Pre-Sale Payment Plans for Unit {unit.unit_number}
              </h4>
            </div>

            <PaymentPlanComparisonCard
              projectName={`${projectName} — Unit ${unit.unit_number}`}
              initialPrice={unit.price !== null ? Number(unit.price) : 125000}
              compact
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProjectUnitsSection({ projectId, projectName }: ProjectUnitsSectionProps) {
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const numericId = Number(projectId) || 1;

    getProjectUnits(numericId)
      .then((res) => {
        if (!mounted) return;
        setUnits(res.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setUnits([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="mt-10 pt-10 border-t border-gray-200">
        <div className="bg-brand-cream/60 rounded-2xl border border-gray-200/80 p-8 sm:p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-brand-navy mb-1">
            Floor Plans & Units In Preparation
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Apartment configurations, technical blueprints, and off-plan pricing for {projectName} are currently being finalized. Please contact our advisory team for private previews and reservations.
          </p>
        </div>
      </div>
    );
  }

  const filteredUnits = filter === 'all' ? units : units.filter((u) => u.status === filter);
  const availableCount = units.filter((u) => u.status === 'available').length;

  return (
    <div className="mt-10 pt-10 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-gold" />
            Available Apartments & Units
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {availableCount} of {units.length} units currently available in {projectName} — click any apartment card to open full specifications & payment plans
          </p>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
          {(['all', 'available', 'reserved', 'sold'] as const).map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setFilter(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === statusKey
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-navy'
              }`}
            >
              {statusKey === 'all' ? `All (${units.length})` : statusKey}
            </button>
          ))}
        </div>
      </div>

      <ProjectUnitsOccupancyChart units={units} projectName={projectName} />

      {filteredUnits.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm">
          No units match the selected status filter.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredUnits.map((unit) => {
              const displayTitle = unit.title || `${projectName} — Unit ${unit.unit_number}`;
              const cardCover =
                unit.image_url ||
                (Array.isArray(unit.gallery_images) && unit.gallery_images.length > 0
                  ? unit.gallery_images[0]
                  : null);
              return (
                <motion.div
                  layout
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedUnit(unit)}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedUnit(unit);
                    }
                  }}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-brand-gold/60 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <div>
                    {cardCover && (
                      <div className="relative mb-3 -mx-5 -mt-5 h-44 overflow-hidden rounded-t-xl bg-gray-100 border-b border-gray-100">
                        <img
                          src={cardCover}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        {/* Media Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                          {Array.isArray(unit.gallery_images) && unit.gallery_images.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/90 text-white backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold shadow-xs border border-white/10">
                              <Camera className="w-3 h-3 text-brand-gold" />
                              {unit.gallery_images.length +
                                (unit.image_url && !unit.gallery_images.includes(unit.image_url)
                                  ? 1
                                  : 0)}{' '}
                              Photos
                            </span>
                          )}
                          {unit.video_url && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold shadow-xs border border-white/10">
                              <Play className="w-2.5 h-2.5 fill-white text-white" />
                              Video Tour
                            </span>
                          )}
                        </div>

                        <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-xs">
                          <Eye className="w-3.5 h-3.5 text-brand-gold" />
                          View Full Details
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block mb-1">
                          Unit {unit.unit_number}
                        </span>
                        <h3 className="font-bold text-base text-brand-navy group-hover:text-brand-gold transition-colors">
                          {displayTitle}
                        </h3>
                      </div>
                      <Badge status={statusBadgeMap[unit.status]} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 my-3 py-2 border-y border-gray-100">
                      {unit.beds !== null && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-gray-400" />
                          {unit.beds} Beds
                        </span>
                      )}
                      {unit.baths !== null && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5 text-gray-400" />
                          {unit.baths} Baths
                        </span>
                      )}
                      {unit.area !== null && (
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                          {unit.area} m²
                        </span>
                      )}
                      {unit.floor !== null && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          Floor {unit.floor}
                        </span>
                      )}
                    </div>

                    {unit.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {unit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 block">
                        Price
                      </span>
                      <span className="text-lg font-extrabold text-brand-navy">
                        {unit.price !== null
                          ? `${unit.currency || 'USD'} ${Number(unit.price).toLocaleString()}`
                          : 'Price on Request'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold group-hover:translate-x-0.5 transition-transform">
                      Open Full Apartment Info →
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Full Apartment Information Modal */}
      <AnimatePresence>
        {selectedUnit && (
          <ApartmentFullInfoModal
            unit={selectedUnit}
            projectName={projectName}
            onClose={() => setSelectedUnit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
