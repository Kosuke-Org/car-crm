import Script from 'next/script';

import { Home } from '@/components/home';

export default function RootPage() {
  return (
    <>
      <HomepageStructuredData />
      <Home />
    </>
  );
}

const HomepageStructuredData = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://template.kosuke.ai';

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AutoYard',
    description:
      'AutoYard keeps leads, stock, test drives and part-ex on one list, so no enquiry sits in a shared inbox until Monday.',
    url: baseUrl,
  };

  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AutoYard',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description:
      'CRM for car retail, covering enquiry follow-up, vehicle stock, test drive booking, part-ex and order paperwork, and per-rooftop reporting.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '14-day free trial',
    },
    author: {
      '@type': 'Organization',
      name: 'AutoYard',
      logo: `${baseUrl}/logos/autoyard-logo.svg`,
    },
  };

  return (
    <>
      <Script
        id="website-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      <Script
        id="software-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareData),
        }}
      />
    </>
  );
};
