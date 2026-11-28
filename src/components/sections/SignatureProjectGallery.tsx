import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
import type { Project } from '../../lib/dbService';

/**
 * Desktop-first architectural project gallery.
 * Only published project records from the existing API are displayed:
 * no fabricated listings, names, prices, or images.
 * The image/wordmark comes from the repository's official public/logo.png.
 */
export function SignatureProjectGallery({ projects }: { projects: Project[] }) {
  const reduceMotion = useReducedMotion();
  const featured = projects.filter((project) => Boolean(project.image_url)).slice(0, 3);
  return (
    <section aria-labelledby="attaie-signature-projects" className="relative overflow-hidden bg-[#F6F8FA] py-16 lg:py-24">
      <div className="container-custom">
        <div className="mb-9 flex flex-col items-start justify-between gap-6 lg:mb-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#117838]">
                <span className="h-2 w-2 rounded-full bg-[#19A64F]" aria-hidden="true" />
                Attaie Properties
              </span>
              <h2 id="attaie-signature-projects" className="text-3xl font-extrabold tracking-tight text-[#171A1F] sm:text-4xl lg:text-5xl">
                Architecture worth <span className="text-[#186A9C]">discovering.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#545454] sm:text-base">
                Explore our published developments and discover the spaces shaping tomorrow.
              </p>
            </motion.div>
          </div>
          <Link to="/projects" className="group inline-flex items-center gap-2 rounded-full bg-[#186A9C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14577F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19A64F]">
            View all projects <ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
            {featured.map((project, index) => (
              <motion.div
                key={project.id}
                initial={reduceMotion ? false : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.65, delay: index * 0.1 }}
                className={index === 0 ? 'md:col-span-2 xl:col-span-6' : 'xl:col-span-3'}
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="group relative block h-[340px] overflow-hidden rounded-[24px] bg-[#E4E8EE] shadow-[0_12px_34px_rgba(23,26,31,0.08)] transition-shadow duration-300 hover:shadow-[0_24px_48px_rgba(23,26,31,0.16)] lg:h-[440px]"
                >
                  <img
                    src={project.image_url!}
                    alt={project.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1217]/90 via-[#0E1217]/15 to-transparent" />
                  <div className="absolute end-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur-md transition-colors group-hover:bg-[#186A9C]">
                    <ArrowUpRight size={20} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-7">
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-white/80"><MapPin size={13} />{project.location || 'Afghanistan'}</p>
                    <h3 className="text-xl font-bold leading-tight lg:text-2xl">{project.name}</h3>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9AE6B4]">Explore development <ArrowUpRight size={14} /></span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[210px] flex-col items-center justify-center rounded-[24px] border border-[#E4E8EE] bg-white px-6 text-center">
            <Building2 size={30} className="mb-3 text-[#298FCE]" aria-hidden="true" />
            <p className="font-semibold text-[#171A1F]">Project photography will appear here when published.</p>
            <p className="mt-2 text-sm text-[#545454]">No placeholder projects or invented buildings are shown.</p>
          </div>
        )}
        <div className="mt-8 flex items-center justify-between gap-5 border-t border-[#E4E8EE] pt-6">
          <img src="/logo.png" alt="Attaie Properties — Gateway of Transparent Dealings" className="h-12 w-auto max-w-[190px] object-contain" loading="lazy" />
          <span className="text-end text-xs font-medium tracking-wide text-[#545454]">ONE BRAND · WEB & ANDROID</span>
        </div>
      </div>
    </section>
  );
}
