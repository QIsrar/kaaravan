'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Star,
  Heart,
  Shield,
  Leaf,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

/* ============================================================================
   Animation Variants
   ============================================================================ */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ============================================================================
   Hero Section
   ============================================================================ */
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-cream-dark" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles size={14} />
              New Spring Collection 2025
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6"
            >
              Where Modesty
              <br />
              Meets{' '}
              <span className="gradient-text">Artistry</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-lg mb-8"
            >
              Premium modest fashion crafted with elegance and purpose.
              Discover hijabs, abayas, and accessories that celebrate your
              individuality.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="gradient-gold text-espresso font-semibold h-13 px-8 text-base"
              >
                <Link href="/shop">
                  Shop Collection
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-13 px-8 text-base"
              >
                <Link href="/about">Our Story</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="flex gap-8 mt-12 pt-8 border-t border-border"
            >
              {[
                { value: '15K+', label: 'Happy Customers' },
                { value: '40+', label: 'Countries' },
                { value: '4.9', label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-gold/10 to-accent/20 rounded-3xl" />
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-cream-dark to-cream flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full gradient-gold opacity-20" />
                  <p className="font-heading text-xl text-espresso/40">
                    Premium Collection
                  </p>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 px-6 py-3 rounded-2xl bg-card shadow-lg border border-border"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['bg-primary', 'bg-gold', 'bg-accent'].map((bg, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${bg} border-2 border-card`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold">Trending Now</p>
                  <p className="text-[10px] text-muted-foreground">
                    500+ sold this week
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   Featured Collections
   ============================================================================ */
const collections = [
  {
    title: 'Hijabs & Scarves',
    description: 'Premium fabrics for everyday elegance',
    slug: 'hijabs-scarves',
    gradient: 'from-rose-100 to-pink-50',
    accent: '#D4A0A0',
  },
  {
    title: 'Abayas & Dresses',
    description: 'Flowing silhouettes, timeless style',
    slug: 'abayas-dresses',
    gradient: 'from-amber-50 to-orange-50',
    accent: '#C19A6B',
  },
  {
    title: 'Modest Sportswear',
    description: 'Performance meets modesty',
    slug: 'modest-sportswear',
    gradient: 'from-teal-50 to-cyan-50',
    accent: '#008080',
  },
  {
    title: 'Accessories',
    description: 'The finishing touches',
    slug: 'accessories',
    gradient: 'from-violet-50 to-purple-50',
    accent: '#B76E79',
  },
];

function FeaturedCollections() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold mb-4"
          >
            Explore Our Collections
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Each piece in our collection is thoughtfully designed to blend
            modesty with modern sophistication.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {collections.map((collection) => (
            <motion.div key={collection.slug} variants={fadeInUp}>
              <Link href={`/shop?category=${collection.slug}`}>
                <Card className="group hover-lift border-0 overflow-hidden cursor-pointer h-full">
                  <div
                    className={`aspect-[4/5] bg-gradient-to-br ${collection.gradient} flex items-center justify-center relative`}
                  >
                    <div
                      className="w-24 h-24 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundColor: collection.accent }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {collection.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   Value Proposition
   ============================================================================ */
const values = [
  {
    icon: Heart,
    title: 'Ethically Made',
    description:
      'Fair wages, sustainable materials, and transparent supply chains in every piece we create.',
  },
  {
    icon: Shield,
    title: 'Premium Quality',
    description:
      'Hand-selected fabrics and meticulous craftsmanship that stands the test of time.',
  },
  {
    icon: Leaf,
    title: 'Sustainable',
    description:
      '70% of our materials are certified sustainable. Working toward 100% by 2027.',
  },
  {
    icon: Users,
    title: 'Community First',
    description:
      'Built by and for the modest fashion community, with your voice at the heart of every design.',
  },
];

function ValueProposition() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold mb-4"
          >
            The Veiled Canvas Difference
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            More than a fashion brand — we&apos;re a movement. Here&apos;s what sets us
            apart.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value) => (
            <motion.div key={value.title} variants={fadeInUp}>
              <Card className="text-center p-6 hover-lift border border-border/50 h-full">
                <CardContent className="p-0">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl gradient-gold flex items-center justify-center">
                    <value.icon size={24} className="text-espresso" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   Customer Reviews
   ============================================================================ */
const reviews = [
  {
    name: 'Sarah M.',
    location: 'Toronto, Canada',
    rating: 5,
    text: 'The chiffon quality is incredible — lightweight yet opaque. The dusty rose color is exactly as pictured. My new everyday hijab!',
  },
  {
    name: 'Maryam K.',
    location: 'London, UK',
    rating: 5,
    text: 'This abaya changed my wardrobe. The tailoring is impeccable and the fabric drapes beautifully. Worth every penny.',
  },
  {
    name: 'Hana R.',
    location: 'Sydney, Australia',
    rating: 5,
    text: 'Finally a sport hijab that actually stays in place during intense workouts. The ventilation is a game-changer.',
  },
  {
    name: 'Zahra A.',
    location: 'Dubai, UAE',
    rating: 5,
    text: 'Veiled Canvas understands modest fashion like no other brand. The quality, the designs, the customer service — everything is top-notch.',
  },
  {
    name: 'Yasmin D.',
    location: 'Paris, France',
    rating: 5,
    text: 'The silk blend wrap is luxurious. I wore it to a formal dinner and received endless compliments. Beautiful details.',
  },
];

function CustomerReviews() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % reviews.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + reviews.length) % reviews.length);

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-3xl lg:text-4xl font-bold mb-4"
          >
            Loved by Thousands
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Hear from our community of confident, stylish women across the
            globe.
          </motion.p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <Quote
              size={40}
              className="mx-auto mb-6 text-primary/20"
            />
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: reviews[current].rating }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className="fill-gold text-gold"
                />
              ))}
            </div>
            <p className="text-lg lg:text-xl text-foreground/90 leading-relaxed mb-6 font-medium italic">
              &ldquo;{reviews[current].text}&rdquo;
            </p>
            <p className="font-heading font-semibold text-foreground">
              {reviews[current].name}
            </p>
            <p className="text-sm text-muted-foreground">
              {reviews[current].location}
            </p>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current
                      ? 'bg-primary w-6'
                      : 'bg-border hover:bg-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   Homepage
   ============================================================================ */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCollections />
      <ValueProposition />
      <CustomerReviews />
    </>
  );
}
