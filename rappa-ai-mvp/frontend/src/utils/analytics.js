// Google Analytics Setup
// Replace 'G-XXXXXXXXXX' with your actual Google Analytics Measurement ID

export const initGA = (measurementId) => {
  if (typeof window === 'undefined') return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
};

// Usage:
// 1. Replace 'G-XXXXXXXXXX' with your actual GA Measurement ID
// 2. Call initGA('G-XXXXXXXXXX') in your main App component
// 3. Use trackPageView() on route changes
// 4. Use trackEvent() to track custom events like button clicks
