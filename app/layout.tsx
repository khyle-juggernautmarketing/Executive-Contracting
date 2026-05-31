import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const siteUrl = 'https://executivecontracting.toprooferusa.com'
const siteName = 'Executive Construction'
const defaultDescription =
  'Premium commercial interior construction, tenant improvements, and build-outs across South Florida. Free precision budgets. FL License #CGC1511207. Serving Miami, Fort Lauderdale & Palm Beach since 2007.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1A2332',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Executive Construction | Commercial Interior Build-Outs — Deerfield Beach, FL',
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'commercial interior construction',
    'tenant improvement',
    'office build-out',
    'Deerfield Beach contractor',
    'South Florida commercial construction',
    'Fort Lauderdale build-out',
    'Miami tenant improvement',
    'Palm Beach commercial renovation',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  formatDetection: { telephone: true, email: true, address: true },
  alternates: { canonical: siteUrl },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'Executive Construction | Commercial Interior Build-Outs',
    description: defaultDescription,
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    images: [{ url: '/logo.jpg', width: 1254, height: 1254, alt: 'Executive Construction logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Construction | Commercial Interior Build-Outs',
    description: defaultDescription,
    images: ['/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/logo.jpg`,
  image: `${siteUrl}/logo.jpg`,
  telephone: '+19545711894',
  email: 'contact@exconfl.com',
  description: defaultDescription,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1230 Newport Center Dr',
    addressLocality: 'Deerfield Beach',
    addressRegion: 'FL',
    postalCode: '33442',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 26.3108,
    longitude: -80.1131,
  },
  areaServed: [
    { '@type': 'City', name: 'Deerfield Beach' },
    { '@type': 'City', name: 'Fort Lauderdale' },
    { '@type': 'City', name: 'Miami' },
    { '@type': 'City', name: 'West Palm Beach' },
    { '@type': 'AdministrativeArea', name: 'South Florida' },
  ],
  foundingDate: '2007',
  priceRange: '$$',
  sameAs: [siteUrl],
}

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Executive Construction — Commercial Interior Build-Outs',
  description: defaultDescription,
  url: siteUrl,
  inLanguage: 'en-US',
  isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-executive-surface font-sans text-executive-dark antialiased">
        {children}
      </body>
    </html>
  )
}
