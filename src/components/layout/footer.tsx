'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ExternalLink, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import toast from 'react-hot-toast';

const footerLinks = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Hijabs & Scarves', href: '/shop?category=hijabs-scarves' },
    { label: 'Abayas & Dresses', href: '/shop?category=abayas-dresses' },
    { label: 'Modest Sportswear', href: '/shop?category=modest-sportswear' },
    { label: 'Accessories', href: '/shop?category=accessories' },
  ],
  company: [
    { label: 'Our Story & Atelier', href: '/about' },
    { label: 'The Journal', href: '/blog' },
    { label: 'Contact Us', href: '/contact' },
  ],
  support: [
    { label: 'Shipping & Delivery', href: '/contact#faq' },
    { label: 'Returns & Exchanges', href: '/contact#faq' },
    { label: 'FAQs', href: '/contact#faq' },
    { label: 'Terms & Privacy', href: '/terms' },
    { label: 'Client Sign In', href: '/login' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast.success('Welcome to the Veiled Canvas community!');
        setEmail('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
      }
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-espresso text-cream">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading text-2xl lg:text-3xl font-bold mb-2">
                Stay in the Loop
              </h3>
              <p className="text-cream/70 max-w-md">
                Subscribe for exclusive early access, styling tips, and special
                offers delivered to your inbox.
              </p>
            </div>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex gap-3 max-w-md lg:ml-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-cream placeholder:text-cream/50 focus:border-gold focus:ring-gold"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gradient-gold text-espresso font-semibold hover:opacity-90 transition-opacity px-6 shrink-0"
              >
                <Send size={16} className="mr-2" />
                {isSubmitting ? 'Joining...' : 'Join'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo href="/" size="md" theme="dark" showSubtitle />
            </div>
            <p className="text-cream/60 text-sm leading-relaxed mb-6">
              Where modesty meets artistry. Premium fashion crafted with
              elegance, ethics, and purpose.
            </p>
            <div className="flex items-center gap-3">
              <motion.a
                href="#"
                aria-label="Instagram"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream/70 hover:bg-gold hover:text-espresso transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </motion.a>
              <motion.a
                href="#"
                aria-label="Facebook"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream/70 hover:bg-gold hover:text-espresso transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.57 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                </svg>
              </motion.a>
              <motion.a
                href="#"
                aria-label="Twitter"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream/70 hover:bg-gold hover:text-espresso transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.a>
              <motion.a
                href="#"
                aria-label="YouTube"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream/70 hover:bg-gold hover:text-espresso transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Shop
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Prominent Developed & Maintained Attribution */}
      <div className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-white/[0.05] via-gold/[0.12] to-white/[0.05] border border-gold/30 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-espresso font-black shrink-0 shadow-md">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-gold font-bold">
                    Official Technology Partner
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold/70" />
                  <span className="text-[11px] text-cream/70 font-medium">
                    Architecture & Operations
                  </span>
                </div>
                <p className="text-sm sm:text-base text-cream/90 font-medium mt-0.5">
                  Proudly <span className="text-gold font-bold">Developed & Maintained</span> by{' '}
                  <a
                    href="https://www.onetechandai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-bold underline decoration-gold underline-offset-4 hover:text-gold transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>OneTech & AI</span>
                    <ExternalLink size={14} className="inline opacity-80" />
                  </a>
                </p>
              </div>
            </div>

            <a
              href="https://www.onetechandai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl gradient-gold text-espresso font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg group shrink-0"
            >
              <span>Visit onetechandai.com</span>
              <ExternalLink size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright & Legal */}
      <div className="border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left text-xs text-cream/60">
            © {new Date().getFullYear()} Veiled Canvas. All rights reserved. Platform developed & maintained by{' '}
            <a
              href="https://www.onetechandai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold font-semibold hover:underline"
            >
              OneTech & AI
            </a>.
          </p>
          <div className="flex items-center gap-6 text-xs text-cream/50">
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact#faq" className="hover:text-gold transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
