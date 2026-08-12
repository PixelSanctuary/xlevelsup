import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import Script from 'next/script';
import ToastProvider from '@/components/ToastProvider';
import AnimationProvider from '@/components/AnimationProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// Exposed as a CSS variable so marketing components can reference it through
// the --xlu-font-mono token rather than hardcoding a family name.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xlevelsup.com'),
  title: {
    default: 'Digital Marketing, Web Design & AI Automation Agency in India | XLEVELSUP',
    template: '%s | XLEVELSUP',
  },
  description:
    'XLEVELSUP is your end-to-end growth partner in Coimbatore, India. We design logos & brand identities, build marketing and eCommerce websites, manage Meta Ads & social media, run Google Ads campaigns, develop ERP & enterprise apps, and automate workflows with AI — all under one roof.',
  keywords: [
    'Logo Design Company Coimbatore',
    'Brand Identity Design India',
    'Social Media Management Coimbatore',
    'Meta Ads Agency India',
    'Instagram Marketing Agency',
    'Google Ads Agency Coimbatore',
    'PPC Management India',
    'Website Development Company Coimbatore',
    'eCommerce Website Development India',
    'Next.js Development India',
    'ERP Development Company India',
    'Enterprise Software Development Coimbatore',
    'SaaS Development India',
    'AI Workflow Automation India',
    'Custom AI Agent Development',
    'n8n Automation Agency',
    'Digital Marketing Agency Coimbatore',
    'Tech Partner Tamil Nadu',
    'Full-Stack Development India',
    'XLEVELSUP',
    'XLU',
  ],
  authors: [{ name: 'XLEVELSUP' }],
  creator: 'XLEVELSUP',
  publisher: 'XLEVELSUP',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '32x32',
      },
      {
        url: '/xlu_fav_icon.png',
        type: 'image/png',
      },
    ],
    apple: '/xlu_fav_icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'XLEVELSUP',
    title: 'Digital Marketing, Web Design & AI Automation Agency in India | XLEVELSUP',
    description:
      'XLEVELSUP engineers logos, websites, eCommerce stores, Meta & Google Ads, ERP systems, and AI automation — your end-to-end growth partner in India.',
    images: [
      {
        url: '/xlu_fav_icon.png',
        width: 1200,
        height: 630,
        alt: 'XLEVELSUP — Digital Marketing, Web Design & AI Automation Agency India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Marketing, Web Design & AI Automation Agency in India | XLEVELSUP',
    description:
      'XLEVELSUP engineers logos, websites, eCommerce stores, Meta & Google Ads, ERP systems, and AI automation — your end-to-end growth partner in India.',
    images: ['/xlu_fav_icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en-IN'>
      <head>
        <link rel='preconnect' href='https://www.googletagmanager.com' />
        <link rel='dns-prefetch' href='https://www.googletagmanager.com' />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        <AnimationProvider>
          <ToastProvider />
          <ConditionalLayout>{children}</ConditionalLayout>
        </AnimationProvider>
        <Script
          id='gtm-script'
          strategy='lazyOnload'
          src='https://www.googletagmanager.com/gtag/js?id=G-YPEGJ3VNCT'
        />
        {/* Organization Schema */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://www.xlevelsup.com/#organization',
              name: 'XLEVELSUP',
              alternateName: ['XLU', 'XLevelsUp'],
              legalName: 'XLEVELSUP Technologies Private Limited',
              url: 'https://www.xlevelsup.com',
              logo: 'https://www.xlevelsup.com/xlevelsup_logo.svg',
              description:
                'XLEVELSUP is an end-to-end growth partner based in Coimbatore, India. We design logos and brand identities, build marketing and eCommerce websites, manage Meta Ads and social media, run Google Ads campaigns, develop ERP and enterprise apps, and automate workflows with AI.',
              foundingLocation: {
                '@type': 'Place',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: '2nd floor, 178, A, Ramachandra Rd, R.S. Puram',
                  addressLocality: 'Coimbatore',
                  addressRegion: 'Tamil Nadu',
                  postalCode: '641002',
                  addressCountry: 'IN',
                },
              },
              sameAs: [
                'https://www.linkedin.com/company/xlevelsup',
                'https://twitter.com/xlevelsup',
                'https://www.instagram.com/xlevelsup',
                'https://www.facebook.com/profile.php?id=61583746927121',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+91-90470-55888',
                email: 'hello@xlevelsup.com',
                contactType: 'customer support',
                areaServed: 'IN',
                availableLanguage: ['English', 'Tamil'],
              },
            }),
          }}
        />
        {/* LocalBusiness Schema */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'XLEVELSUP',
              '@id': 'https://www.xlevelsup.com/#localbusiness',
              url: 'https://www.xlevelsup.com',
              telephone: '+91-90470-55888',
              email: 'hello@xlevelsup.com',
              priceRange: '₹₹₹',
              description:
                'End-to-end growth partner in Coimbatore. We design logos, build marketing and eCommerce websites, run Meta & Google Ads, manage social media, develop ERP apps, and automate workflows with AI.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '2nd floor, 178, A, Ramachandra Rd, R.S. Puram',
                addressLocality: 'Coimbatore',
                addressRegion: 'Tamil Nadu',
                postalCode: '641002',
                addressCountry: 'IN',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 11.0168,
                longitude: 76.9558,
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                  opens: '10:00',
                  closes: '19:00',
                },
              ],
              areaServed: [
                { '@type': 'City', name: 'Coimbatore' },
                { '@type': 'City', name: 'Chennai' },
                { '@type': 'City', name: 'Bangalore' },
                { '@type': 'Country', name: 'India' },
              ],
              knowsAbout: [
                'Logo & Brand Identity Design',
                'Social Media Management',
                'Meta Ads & Google Ads',
                'eCommerce Website Development',
                'ERP & Enterprise Software Development',
                'Custom Software Development',
                'Next.js Engineering',
                'Enterprise AI Automation',
                'Server-Side Tracking',
                'Full-Stack Development',
              ],
            }),
          }}
        />
        {/* ProfessionalService Schema */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'XLEVELSUP — End-to-End Digital Agency & Tech Partner',
              serviceType: [
                'Logo & Brand Identity Design',
                'Social Media Management',
                'Meta Ads Management',
                'Google Ads Management',
                'Marketing Website Development',
                'eCommerce Website Development',
                'ERP & Enterprise Software Development',
                'Custom Software Development',
                'AI Workflow Automation',
                'Server-Side Tracking Infrastructure',
              ],
              provider: {
                '@type': 'Organization',
                name: 'XLEVELSUP',
                url: 'https://www.xlevelsup.com',
              },
              areaServed: 'India',
              availableChannel: {
                '@type': 'ServiceChannel',
                serviceUrl: 'https://www.xlevelsup.com/contact',
              },
            }),
          }}
        />
        {/* WebSite Schema — enables Sitelinks Searchbox */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'XLEVELSUP',
              url: 'https://www.xlevelsup.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.xlevelsup.com/?s={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Script
          id='gtm-init'
          strategy='lazyOnload'
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-YPEGJ3VNCT', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
