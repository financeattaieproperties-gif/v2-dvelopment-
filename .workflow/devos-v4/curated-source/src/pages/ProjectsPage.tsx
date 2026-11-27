import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MotionCarousel } from '../components/ui/MotionCarousel';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Home, ArrowRight, Building2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProjectCard } from '../components/ui/ProjectCard';
import { ProjectCardSkeleton, ProjectSpotlightSkeleton } from '../components/ui/ProjectCardSkeleton';
import { Skeleton } from '../components/ui/Skeleton';
import { getProjects, type Project } from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';

const FILTER_STATUSES = ['All', 'Coming Soon', 'In Progress', 'Sold Out'] as const;

export default function ProjectsPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<(typeof FILTER_STATUSES)[number]>('All');

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    getProjects()
      .then((list) => {
        if (!active) return;
        if (Array.isArray(list)) {
          setProjects(list);
        } else {
          setProjects([]);
          setLoadError(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setProjects([]);
        setLoadError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  // Project cards animate via motion/react AnimatePresence & whileInView

  const visible =
    filter === 'All'
      ? projects
      : projects.filter(
          (project) =>
            (project.status === 'Under Construction' ? 'In Progress' : project.status) === filter
        );

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead context={{ filterStatus: filter }} />
      <Navbar />

      <section className="bg-brand-navy pt-36 pb-16 islamic-pattern relative overflow-hidden">
        <div className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[{ label: t('nav.projects', 'Projects') }]}
            className="mb-4"
          />
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[.25em]">
            {t('projectsPage.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold text-white">
            {t('projectsPage.title')}
          </h1>
          <p className="mt-3 max-w-xl text-white/65 leading-relaxed">
            {t('projectsPage.subtitle')}
          </p>
        </div>
      </section>

      {/* Swiper Featured Developments Spotlight */}
      {(loading || projects.length > 0) && (
        <section className="container-custom pt-12">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <span className="eyebrow">{t('projectsPage.featuredEyebrow')}</span>
              <h2 className="text-2xl font-display font-bold text-brand-navy mt-1">
                {t('projectsPage.featuredTitle')}
              </h2>
            </div>
          </div>

          {loading ? (
            <ProjectSpotlightSkeleton />
          ) : (
            <MotionCarousel
              slidesPerView={{ base: 1 }}
              gap={24}
              autoplayDelay={6000}
              className="rounded-2xl overflow-hidden shadow-brand-lg"
            >
              {projects.map((proj) => (
                <div key={`spotlight-${proj.id}`} className="relative min-h-[340px] md:min-h-[380px] bg-brand-navy text-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                  <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-between relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-gold text-white text-xs font-bold mb-4">
                        <Building2 size={13} />
                        <span>{t(`projectCard.status.${proj.status === 'Under Construction' ? 'In Progress' : proj.status}`, proj.status)}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                        {proj.name}
                      </h3>
                      <p className="flex items-center gap-2 text-sm text-white/75 mb-4">
                        <MapPin size={15} className="text-brand-gold shrink-0" />
                        <span>{proj.location}</span>
                      </p>
                      {proj.description && (
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 mb-6">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/15 tabular-nums">
                      <div className="flex items-center gap-5 text-xs">
                        {proj.available_units !== undefined && (
                          <span className="flex items-center gap-1.5 text-white/85 font-semibold">
                            <Home size={14} className="text-brand-gold" />
                            {t('projectsPage.unitsOpen', { count: proj.available_units })}
                          </span>
                        )}
                        {proj.delivery_date && (
                          <span className="flex items-center gap-1.5 text-white/85 font-semibold">
                            <Calendar size={14} className="text-brand-gold" />
                            {t('projectsPage.deliveryLabel', { date: proj.delivery_date })}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/projects/${proj.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-navy hover:bg-brand-gold hover:text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <span>{t('projectsPage.exploreMasterplan')}</span>
                        <ArrowRight size={14} className="rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-6 relative min-h-[240px]">
                    <img
                      src={proj.image_url || defaultExteriorImg}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/30 to-transparent hidden lg:block" />
                  </div>
                </div>
              ))}
            </MotionCarousel>
          )}
        </section>
      )}

      {/* Editorial Project Cards Grid with Motion.dev Layout Transitions & GSAP Scroll Reveals */}
      <section className="container-custom py-14 flex-grow">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTER_STATUSES.map((status) => {
              const active = filter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-white'
                      : 'bg-white text-neutral-600 hover:text-brand-navy border border-brand-navy/10'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="projects-filter-pill"
                      className="absolute inset-0 bg-brand-navy rounded-xl"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{t(`projectsPage.filters.${status}`)}</span>
                </button>
              );
            })}
          </div>
          {loading ? (
            <Skeleton className="h-4 w-44 rounded bg-neutral-200" />
          ) : (
            <span className="text-xs font-bold text-neutral-500 tabular-nums">
              {t('projectsPage.showingCount', { shown: visible.length, total: projects.length })}
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? 'loading' : filter}
            ref={gridRef}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => <ProjectCardSkeleton key={idx} />)
            ) : loadError ? (
              <div role="alert" className="col-span-full rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                <p className="text-brand-navy font-semibold">{t('inventoryState.loadError')}</p>
                <button type="button" onClick={() => setReload(value => value + 1)} className="mt-4 font-semibold text-brand-gold underline">{t('inventoryState.retry')}</button>
              </div>
            ) : visible.length ? (
              visible.map((project) => (
                <div key={project.id} data-project-card>
                  <ProjectCard
                    id={String(project.id)}
                    name={project.name}
                    location={project.location}
                    deliveryDate={project.delivery_date ?? undefined}
                    status={project.status}
                    availableUnits={project.available_units}
                    totalUnits={project.total_units}
                    description={project.description}
                    image={project.image_url || defaultExteriorImg}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-12 text-center">
                <Building2 size={32} className="mx-auto text-brand-gold/60 mb-3" />
                <p className="text-brand-navy font-semibold text-base">
                  {t('projectsPage.empty')}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
      <Footer />
    </main>
  );
}
