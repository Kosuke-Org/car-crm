import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';

import { Providers } from '@/components/providers';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://template.kosuke.ai';
const ogImage = `${baseUrl}/opengraph-image.png`;
const ogImageSquare = `${baseUrl}/opengraph-image-square.png`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | BeyondCars',
    default: 'BeyondCars - CRM for car dealerships',
  },
  description:
    'BeyondCars keeps leads, stock, test drives and part-ex on one list, so no enquiry sits in a shared inbox until Monday. CRM for car retail, from one pitch to twenty rooftops.',
  keywords: [
    'car dealership CRM',
    'automotive CRM',
    'dealer management',
    'vehicle inventory software',
    'car sales software',
    'lead management',
    'test drive scheduling',
    'used car dealer software',
  ],
  authors: [{ name: 'BeyondCars' }],
  creator: 'BeyondCars',
  publisher: 'BeyondCars',
  openGraph: {
    title: 'BeyondCars - CRM for car dealerships',
    description:
      'Every enquiry answered before it goes cold. Leads, stock, test drives and part-ex on one list built for car retail.',
    type: 'website',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'BeyondCars - CRM for car dealerships',
      },
      {
        url: ogImageSquare,
        width: 500,
        height: 500,
        alt: 'BeyondCars - CRM for car dealerships',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeyondCars - CRM for car dealerships',
    description:
      'Every enquiry answered before it goes cold. Leads, stock, test drives and part-ex on one list built for car retail.',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'BeyondCars - CRM for car dealerships',
      },
    ],
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      url: '/favicon-96x96.png',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/favicon.svg',
    },
    {
      rel: 'shortcut icon',
      url: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/apple-touch-icon.png',
    },
  ],
  manifest: '/manifest.webmanifest',
  verification: {
    // Add when you have these set up:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: '#005f63',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {plausibleDomain && plausibleHost && (
          <Script
            defer
            data-domain={plausibleDomain}
            src={`${plausibleHost}/js/script.js`}
            strategy="afterInteractive"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
