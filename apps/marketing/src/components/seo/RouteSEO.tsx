import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllManagedRoutes, routeCategories } from '@/config/routes.config';
import { monitoring } from '@/utils/monitoring';

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogType: 'website' | 'article';
  ogImage?: string;
  structuredData?: object;
}

const getRouteBasedSEO = (pathname: string): SEOData => {
  const allRoutes = getAllManagedRoutes();
  const currentRoute = allRoutes.find(route => route.path === pathname);
  const category = currentRoute?.category;
  const categoryInfo = category ? routeCategories[category] : null;

  // Base SEO data
  const baseTitle = 'aicomply.io - AI Compliance Platform';
  const baseDescription = 'Automate compliance, accelerate approvals, and stay in control with AI governance solutions that work as fast as you do.';
  const baseKeywords = ['AI compliance', 'AI governance', 'regulatory compliance', 'AI automation'];

  // Route-specific SEO configurations
  const routeSEOConfig: Record<string, Partial<SEOData>> = {
    '/': {
      title: `${baseTitle}`,
      description: baseDescription,
      keywords: [...baseKeywords, 'AI platform', 'enterprise AI'],
      ogType: 'website',
      ogImage: '/og-image.png'
    },
    '/platform': {
      title: 'AI Governance Platform - aicomply.io',
      description: 'Comprehensive AI governance platform with automated compliance, policy management, and real-time monitoring.',
      keywords: [...baseKeywords, 'platform', 'governance dashboard'],
      ogType: 'website'
    },
    '/industries/pharmaceutical': {
      title: 'Pharmaceutical AI Compliance - FDA Regulatory Solutions',
      description: 'FDA-compliant AI governance for pharmaceutical companies. Streamline drug development with automated regulatory compliance.',
      keywords: [...baseKeywords, 'pharmaceutical', 'FDA compliance', 'drug development', '21 CFR Part 11'],
      ogType: 'website',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Pharmaceutical AI Compliance Platform",
        "description": "FDA-compliant AI governance solution for pharmaceutical industry",
        "provider": {
          "@type": "Organization",
          "name": "aicomply.io"
        }
      }
    },
    '/industries/marketing-services': {
      title: 'Marketing Agency AI Governance - Client Compliance Solutions',
      description: 'AI governance platform for marketing agencies. Manage client compliance, automate policy enforcement, and ensure regulatory adherence.',
      keywords: [...baseKeywords, 'marketing agency', 'client management', 'multi-client governance'],
      ogType: 'website'
    },
    '/proof-center': {
      title: 'Live Compliance Proof - Real-time AI Governance Demonstrations',
      description: 'See our AI compliance platform in action with live demos, real compliance data, and interactive proof of concept.',
      keywords: [...baseKeywords, 'proof of concept', 'live demo', 'compliance demonstration'],
      ogType: 'website'
    },
    '/pricing': {
      title: 'AI Compliance Platform Pricing - Enterprise & Agency Plans',
      description: 'Transparent pricing for AI governance solutions. Choose from enterprise, agency, or custom plans for your compliance needs.',
      keywords: [...baseKeywords, 'pricing', 'enterprise plans', 'agency plans'],
      ogType: 'website'
    },
    '/dashboard': {
      title: 'Enterprise Dashboard - AI Compliance Management',
      description: 'Comprehensive enterprise dashboard for AI compliance management, policy oversight, and governance analytics.',
      keywords: [...baseKeywords, 'enterprise dashboard', 'compliance management'],
      ogType: 'website'
    },
    '/agency/dashboard': {
      title: 'Agency Dashboard - Multi-Client AI Compliance',
      description: 'Agency dashboard for managing multiple client AI compliance requirements and governance workflows.',
      keywords: [...baseKeywords, 'agency dashboard', 'multi-client management'],
      ogType: 'website'
    }
  };

  // Get route-specific config or default
  const routeConfig = routeSEOConfig[pathname] || {};
  
  // Build final SEO data
  return {
    title: routeConfig.title || `${currentRoute?.title || 'Page'} - ${baseTitle}`,
    description: routeConfig.description || categoryInfo?.description || baseDescription,
    keywords: routeConfig.keywords || baseKeywords,
    canonicalUrl: `https://aicomply.io${pathname}`,
    ogType: routeConfig.ogType || 'website',
    ogImage: routeConfig.ogImage || '/og-image.png',
    structuredData: routeConfig.structuredData
  };
};

export const RouteSEO: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const seoData = getRouteBasedSEO(location.pathname);

    // Update document title
    document.title = seoData.title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update meta description
    updateMetaTag('description', seoData.description);
    
    // Update keywords
    updateMetaTag('keywords', seoData.keywords.join(', '));
    
    // Update Open Graph tags
    updateMetaTag('og:title', seoData.title, 'property');
    updateMetaTag('og:description', seoData.description, 'property');
    updateMetaTag('og:type', seoData.ogType, 'property');
    updateMetaTag('og:url', seoData.canonicalUrl, 'property');
    updateMetaTag('og:image', seoData.ogImage || '/og-image.png', 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '1200', 'property');
    updateMetaTag('og:image:alt', 'AI Tool Governance - AICOMPLYR.IO', 'property');
    
    // Update Twitter tags
    updateMetaTag('twitter:title', seoData.title, 'property');
    updateMetaTag('twitter:description', seoData.description, 'property');
    updateMetaTag('twitter:image', seoData.ogImage || '/og-image.png');
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seoData.canonicalUrl);

    // Add structured data if provided
    if (seoData.structuredData) {
      let structuredDataScript = document.querySelector('#structured-data') as HTMLScriptElement;
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        structuredDataScript.setAttribute('id', 'structured-data');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(seoData.structuredData);
    }

    // Performance monitoring for SEO
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        const metrics = {
          pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
          domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
        };

        // Log performance metrics for monitoring (development only)
        if (import.meta.env.DEV) {
          monitoring.debug('SEO Performance Metrics', {
            route: location.pathname,
            title: seoData.title,
            ...metrics
          });
        }
      }
    }

  }, [location.pathname]);

  return null; // This component only manages SEO, doesn't render
};

export default RouteSEO;