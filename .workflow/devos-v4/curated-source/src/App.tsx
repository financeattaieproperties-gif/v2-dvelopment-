import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SeoSettingsProvider } from './components/seo/SeoHead';
const CustomerChatWidget = lazy(() =>
  import('./components/chat/CustomerChatWidget').then((m) => ({ default: m.CustomerChatWidget }))
);
import HomePage from './pages/HomePage';
import { startInquiryDelivery } from './lib/inquiryOutbox';
import { FirebaseErrorBoundary } from './components/auth/FirebaseErrorBoundary';
import { FirebaseProvider } from './components/auth/FirebaseProvider';

const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const AgentDetailPage = lazy(() => import('./pages/AgentDetailPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const CareerDetailPage = lazy(() => import('./pages/CareerDetailPage'));
const GoogleWorkspacePage = lazy(() => import('./pages/GoogleWorkspacePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import {
  PropertiesPageSkeleton,
  ProjectsPageSkeleton,
  DetailPageSkeleton,
  GenericPageSkeleton,
} from './components/ui/PageGridSkeletons';

const withSuspense = (
  node: React.ReactNode,
  fallback: React.ReactNode = <GenericPageSkeleton />
) => <Suspense fallback={fallback}>{node}</Suspense>;

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/properties', element: withSuspense(<PropertiesPage />, <PropertiesPageSkeleton />) },
  { path: '/properties/:id', element: withSuspense(<PropertyDetailPage />, <DetailPageSkeleton />) },
  { path: '/projects', element: withSuspense(<ProjectsPage />, <ProjectsPageSkeleton />) },
  { path: '/projects/:id', element: withSuspense(<ProjectDetailPage />, <DetailPageSkeleton />) },
  { path: '/contact', element: withSuspense(<ContactPage />) },
  { path: '/about', element: withSuspense(<AboutPage />) },
  { path: '/agents', element: withSuspense(<AgentsPage />) },
  { path: '/agents/:id', element: withSuspense(<AgentDetailPage />, <DetailPageSkeleton />) },
  { path: '/careers', element: withSuspense(<CareersPage />) },
  { path: '/careers/:id', element: withSuspense(<CareerDetailPage />, <DetailPageSkeleton />) },
  { path: '/workspace', element: withSuspense(<GoogleWorkspacePage />) },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

export default function App() {
  useEffect(() => startInquiryDelivery(), []);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <FirebaseErrorBoundary>
      <FirebaseProvider>
        <HelmetProvider>
          <SeoSettingsProvider>
            {gmpQuotaExceeded && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
                <span>
                  Google Maps Platform quota reached. If you are the app owner, visit{' '}
                  <a
                    href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-amber-950 hover:text-amber-800"
                  >
                    maps developer site
                  </a>{' '}
                  for instructions to update your account.
                </span>
              </div>
            )}
            <RouterProvider router={router} />
            <Suspense fallback={null}>
              <CustomerChatWidget />
            </Suspense>
          </SeoSettingsProvider>
        </HelmetProvider>
      </FirebaseProvider>
    </FirebaseErrorBoundary>
    </MotionConfig>
  );
}

