import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeyondCars - CRM for car dealerships',
    short_name: 'BeyondCars',
    description:
      'BeyondCars keeps leads, stock, test drives and part-ex on one list, so no enquiry sits in a shared inbox until Monday.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#005f63',
    icons: [
      {
        src: '/favicon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        src: '/favicon-96x96.png',
        type: 'image/png',
        sizes: '96x96',
      },
      {
        src: '/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
  };
}
