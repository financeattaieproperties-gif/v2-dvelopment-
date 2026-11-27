import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { AgentsDirectoryContent } from '../components/about/AgentsDirectoryContent';
import { useTranslation } from 'react-i18next';

export default function AgentsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-brand-ivory flex flex-col">
      <SeoHead />
      <Navbar />

      <header className="relative bg-brand-navy pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="container-custom relative z-10"
        >
          <Breadcrumbs
            variant="light"
            items={[
              { label: t('nav.about', 'About Us'), href: '/about' },
              { label: t('nav.agents', 'Our Agents') },
            ]}
            className="mb-4"
          />
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-3">
            Attaie Properties Advisory Team
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            Meet Our Senior Property Advisors
          </h1>
          <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
            Multilingual specialists in Dari, Pashto, and English guiding buyers, diaspora families,
            and institutional investors across Kabul’s prime districts.
          </p>
        </motion.div>
      </header>

      <div className="flex-grow">
        <AgentsDirectoryContent />
      </div>

      <Footer />
    </main>
  );
}
