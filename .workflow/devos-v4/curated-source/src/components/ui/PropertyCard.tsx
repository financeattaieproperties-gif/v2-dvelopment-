import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { MotionCarousel } from './MotionCarousel';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Heart,
  Building2,
  Images,
} from 'lucide-react';
import { Badge } from './Badge';

const MotionLink = motion.create(Link);

export interface PropertyCardProps {
  id: string;
  serialNumber?: string;
  title: string;
  price: number;
  location: string;
  beds?: number;
  baths?: number;
  area?: number;
  floor?: number;
  status: 'available' | 'pending' | 'sold' | 'rented';
  type: string;
  image?: string | null;
  galleryImages?: string[];
  listingType?: 'sale' | 'rent';
  tag?: string;
}

export const PropertyCard = ({
  id,
  serialNumber,
  title,
  price,
  location,
  beds,
  baths,
  area,
  floor,
  status,
  type,
  image,
  galleryImages,
  listingType,
  tag,
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const priceDisplay =
    listingType === 'rent'
      ? `$${price.toLocaleString()}${t('propertyCard.perMonth')}`
      : `$${price.toLocaleString()}`;

  // Consolidate primary image + galleryImages into a unique array for the Swiper photo slider
  const photoList = React.useMemo(() => {
    const raw = [
      ...(image ? [image] : []),
      ...(Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : []),
    ];
    return Array.from(new Set(raw));
  }, [image, galleryImages]);

  const hasMultiplePhotos = photoList.length > 1;

  return (
    <>
      <MotionLink
        to={`/properties/${id}`}
        layout
        className="group flex flex-col h-full bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden transition-colors duration-300 border border-brand-navy/8 hover:border-brand-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{
          boxShadow: isHovered
            ? '0 20px 60px -12px rgba(2,14,58,0.20), 0 8px 24px -8px rgba(2,14,58,0.10)'
            : '0 1px 4px 0 rgba(2,14,58,0.07), 0 2px 8px -2px rgba(2,14,58,0.06)',
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Image / MotionCarousel Photo Slider */}
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden bg-brand-navy"
          whileHover="hovered"
        >
          {hasMultiplePhotos ? (
            <div
              className="w-full h-full"
              onClick={(e) => {
                // Allow clicking pagination/arrows without navigating away
                const target = e.target as HTMLElement;
                if (target.closest('button')) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <MotionCarousel
                gap={0}
                slidesPerView={{ base: 1 }}
                autoplayDelay={0}
                showNavigation
                showPagination
                className="w-full h-full [&>div:last-child]:absolute [&>div:last-child]:bottom-2.5 [&>div:last-child]:left-1/2 [&>div:last-child]:-translate-x-1/2 [&>div:last-child]:mt-0 [&>div:last-child]:z-20"
              >
                {photoList.map((src, idx) => (
                  <div key={`${id}-photo-${idx}`} className="w-full h-full aspect-[4/3]">
                    <img
                      src={src}
                      alt={`${title} — photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ))}
              </MotionCarousel>
              <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-sm border border-white/20 text-[11px] font-bold text-white pointer-events-none tabular-nums shadow-sm">
                <Images size={13} strokeWidth={2.2} />
                {photoList.length}
              </span>
            </div>
          ) : photoList.length === 1 ? (
            <motion.img
              src={photoList[0]}
              alt={`${title} — ${type} for ${listingType === 'rent' ? 'rent' : 'sale'} in ${location}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              variants={{
                hovered: {
                  scale: 1.07,
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              initial={false}
              style={{
                filter: imgLoaded ? 'none' : 'blur(8px)',
                transition: 'filter 0.4s ease',
              }}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center islamic-pattern text-white/30 gap-2">
              <Building2 size={32} />
            </div>
          )}

          {/* Measured bottom contrast scrim */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none z-10" />

          {/* Tag override / For Sale / For Rent badge */}
          {(tag || listingType) && (
            <div className="absolute top-3 start-3 z-20">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap ${
                  tag
                    ? 'bg-red-500 text-white'
                    : listingType === 'rent'
                    ? 'bg-brand-navy text-white'
                    : 'bg-brand-gold text-white'
                }`}
              >
                {tag ?? (listingType === 'rent' ? t('propertyCard.forRent') : t('propertyCard.forSale'))}
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 end-12 z-20">
            <Badge status={status} className="bg-white/90 backdrop-blur-sm shadow-md">
              {t(`propertyCard.status.${status}`, status)}
            </Badge>
          </div>

          {/* Save button */}
          <motion.button
            type="button"
            aria-label={saved ? t('propertyCard.removeSaved') : t('propertyCard.save')}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved((s) => !s);
              setHeartAnim(true);
              setTimeout(() => setHeartAnim(false), 400);
            }}
            animate={heartAnim ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute top-3 end-3 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-black/5 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              size={16}
              strokeWidth={2.2}
              className={saved ? 'text-red-500 fill-red-500' : 'text-neutral-500'}
            />
          </motion.button>

          {/* Price overlay at bottom of image */}
          <div className="absolute bottom-3 start-3 z-20 pointer-events-none">
            <span className="text-white font-bold text-xl drop-shadow-lg tabular-nums">
              {priceDisplay}
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-neutral-500">
              <span className="font-semibold text-brand-navy">
                {t(`propertyTypes.${type}`, type)}
              </span>
              {serialNumber && (
                <span className="font-mono text-xs font-semibold tracking-wide text-brand-gold tabular-nums">
                  {t('propertyCard.ref')} {serialNumber}
                </span>
              )}
            </div>
            <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-1.5 line-clamp-1 group-hover:text-brand-gold transition-colors duration-200">
              {title}
            </h3>
            <div className="flex items-center text-neutral-600 mb-4 text-sm font-medium">
              <MapPin size={15} strokeWidth={2.2} className="me-1.5 text-brand-gold shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Visual property feature icons */}
            <div
              aria-label="Property features"
              className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2.5 pt-4 border-t border-neutral-100 text-neutral-700 text-xs tabular-nums"
            >
              {beds !== undefined && (
                <div className="flex items-center gap-2" title={`${beds} ${t('propertyCard.beds')}`}>
                  <span className="w-8 h-8 rounded-xl bg-brand-gold/12 border border-brand-gold/25 text-brand-gold flex items-center justify-center shrink-0 shadow-2xs">
                    <Bed size={16} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{beds}</span>{' '}
                    <span className="text-neutral-500 font-medium">{t('propertyCard.beds')}</span>
                  </div>
                </div>
              )}
              {baths !== undefined && (
                <div className="flex items-center gap-2" title={`${baths} ${t('propertyCard.baths')}`}>
                  <span className="w-8 h-8 rounded-xl bg-brand-gold/12 border border-brand-gold/25 text-brand-gold flex items-center justify-center shrink-0 shadow-2xs">
                    <Bath size={16} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{baths}</span>{' '}
                    <span className="text-neutral-500 font-medium">{t('propertyCard.baths')}</span>
                  </div>
                </div>
              )}
              {area !== undefined && (
                <div className="flex items-center gap-2" title={`${area} ${t('propertyCard.sqm')}`}>
                  <span className="w-8 h-8 rounded-xl bg-brand-gold/12 border border-brand-gold/25 text-brand-gold flex items-center justify-center shrink-0 shadow-2xs">
                    <Maximize2 size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{area}</span>{' '}
                    <span className="text-neutral-500 font-medium">{t('propertyCard.sqm')}</span>
                  </div>
                </div>
              )}
              {floor !== undefined && (
                <div className="flex items-center gap-2" title={`${t('propertyCard.floor')} ${floor}`}>
                  <span className="w-8 h-8 rounded-xl bg-brand-gold/12 border border-brand-gold/25 text-brand-gold flex items-center justify-center shrink-0 shadow-2xs">
                    <Layers size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="text-neutral-500 font-medium">{t('propertyCard.floor')}</span>{' '}
                    <span className="font-bold text-brand-navy">{floor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* View Details action bar */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-500 group-hover:text-brand-gold transition-colors whitespace-nowrap">
                {t('propertyCard.viewDetails')} <span className="inline-block rtl:rotate-180">→</span>
              </span>
            </div>
          </div>
        </div>
      </MotionLink>
    </>
  );
};
