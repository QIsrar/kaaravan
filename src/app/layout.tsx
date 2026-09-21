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

export const metadata: Metadata = {
  title: {
    default: 'Veiled Canvas | Where Modesty Meets Artistry',
    template: '%s | Veiled Canvas',
  },
  description:
    'Premium modest fashion for the modern woman. Discover hijabs, abayas, dresses, sportswear, and accessories crafted with elegance and purpose.',
  keywords: [
    'modest fashion',
    'hijab',
    'abaya',
    'modest dresses',
    'modest sportswear',
    'ethical fashion',
  ],
  authors: [{ name: 'Veiled Canvas' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Veiled Canvas',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
