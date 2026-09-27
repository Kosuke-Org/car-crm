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
    name: 'DealerFlow',
    description:
      'DealerFlow is the CRM for car dealerships: one pipeline for leads, inventory, test drives and contracts.',
    url: baseUrl,
  };

  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DealerFlow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description:
      'CRM for car dealerships and independent sellers, covering lead follow-up, vehicle inventory, test drive scheduling, deal desk and sales reporting.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '14-day free trial',
    },
    author: {
      '@type': 'Organization',
      name: 'DealerFlow',
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
