import React from 'react';
import { motion } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ContactSectionContent } from '../components/about/ContactSectionContent';
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead />
      <Navbar />

      <section className="relative pt-36 pb-20 bg-brand-navy overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
        <div className="container-custom relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <Breadcrumbs
              variant="light"
              items={[
                { label: t('nav.about', 'About Us'), href: '/about' },
                { label: t('nav.contact', 'Contact') },
              ]}
              className="w-auto"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-3"
          >
            <span className="inline-block w-8 h-[1px] bg-brand-gold/50" />
            {t('contactPage.eyebrow')}
            <span className="inline-block w-8 h-[1px] bg-brand-gold/50" />
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            {t('contactPage.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-white/60 text-lg max-w-xl mx-auto"
          >
            {t('contactPage.subtitle')}
          </motion.p>
        </div>
      </section>

      <div className="flex-grow">
        <ContactSectionContent />
      </div>

      <Footer />
    </main>
  );
}
