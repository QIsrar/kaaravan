import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://veiled-canvas.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Veiled Canvas | Where Modesty Meets Artistry',
    template: '%s | Veiled Canvas',
  },
  description:
    'Veiled Canvas — Haute Couture Modest Fashion. Discover handcrafted abayas, luxury silks, flowing hijabs, and contemporary silhouettes crafted with elegance, ethics, and purpose.',
  keywords: [
    'Veiled Canvas',
    'modest fashion',
    'luxury abayas',
    'haute couture hijab',
    'silk scarves',
    'modest dresses',
    'ethical luxury fashion',
  ],
  authors: [{ name: 'Veiled Canvas' }, { name: 'OneTech & AI', url: 'https://www.onetechandai.com/' }],
  creator: 'OneTech & AI (https://www.onetechandai.com/)',
  publisher: 'Veiled Canvas',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Veiled Canvas',
    title: 'Veiled Canvas | Where Modesty Meets Artistry',
    description:
      'Veiled Canvas — Haute Couture Modest Fashion. Discover handcrafted abayas, luxury silks, flowing hijabs, and contemporary silhouettes crafted with elegance, ethics, and purpose.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Veiled Canvas — Where Modesty Meets Artistry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veiled Canvas | Where Modesty Meets Artistry',
    description:
      'Haute Couture Modest Fashion. Handcrafted abayas, luxury silks, and contemporary silhouettes.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
