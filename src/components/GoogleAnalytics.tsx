'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Analytics event helper functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Pre-defined events for pharmacy app
export const analyticsEvents = {
  searchCity: (city: string, district: string) => 
    trackEvent('search', 'pharmacy', `${city}/${district}`),
  
  findNearby: () => 
    trackEvent('find_nearby', 'location'),
  
  callPharmacy: (pharmacyName: string) => 
    trackEvent('call', 'pharmacy', pharmacyName),
  
  getDirections: (pharmacyName: string) => 
    trackEvent('directions', 'pharmacy', pharmacyName),
  
  savePharmacy: (pharmacyName: string) => 
    trackEvent('save', 'pharmacy', pharmacyName),
  
  sharePharmacy: (pharmacyName: string) => 
    trackEvent('share', 'pharmacy', pharmacyName),
  
  installPWA: () => 
    trackEvent('install', 'pwa'),
};
