'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';

const blogContent: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
  image: string;
}> = {
  '5-ways-to-style-hijab-summer': {
    title: '5 Ways to Style Your Hijab for Summer',
    excerpt: 'Beat the heat without compromising your style.',
    content: `Summer doesn't mean you have to sacrifice style or comfort. Here are our top picks for staying cool and looking fabulous.

## 1. The Loose Turban Wrap

Perfect for casual outings, the loose turban wrap keeps fabric away from your neck while looking effortlessly chic. Opt for lightweight chiffon or modal fabrics.

## 2. The Side Drape

A classic style that allows airflow. Simply wrap your hijab loosely and drape one end over your shoulder. Pair with statement earrings visible from the front.

## 3. The Cap & Scarf Combo

Wear a breathable underscarf cap with a lighter, shorter scarf on top. This reduces layers while maintaining full coverage.

## 4. The Half-Up Style

Gather the top portion and let the rest flow freely. Great with maxi dresses and adds a touch of elegance to any outfit.

## 5. The Sport Wrap

Not just for the gym! A moisture-wicking sport hijab paired with a casual outfit is the ultimate summer hack.

---

*What's your favorite summer hijab style? Share with us on social media!*`,
    authorName: 'Amira Hassan',
    category: 'Style Guide',
    tags: ['hijab', 'summer', 'styling', 'fashion tips'],
    readTime: 6,
    publishedAt: '2026-06-15',
    image: '/images/blog_1.jpg',
  },
  'ethics-behind-our-supply-chain': {
    title: 'The Ethics Behind Our Supply Chain',
    excerpt: 'Transparency matters.',
    content: `Transparency matters. Learn how Veiled Canvas ensures fair wages, sustainable materials, and ethical manufacturing across our entire partner artisan workshops.`,
    authorName: 'Fatima Al-Rashid',
    category: 'Behind the Brand',
    tags: ['ethics', 'sustainability'],
    readTime: 8,
    publishedAt: '2026-05-20',
    image: '/images/blog_2.jpg',
  },
  'modest-fashion-workplace-guide': {
    title: 'Modest Fashion at the Workplace: A Complete Guide',
    excerpt: 'Navigating professional dress codes while staying true to your modest fashion values.',
    content: `From boardrooms to creative studios, styling high-end modest workwear that commands respect without compromising faith or individuality.`,
    authorName: 'Nour Khatib',
    category: 'Style Guide',
    tags: ['workwear', 'professional'],
    readTime: 10,
    publishedAt: '2026-04-10',
    image: '/images/blog_3.jpg',
  },
  'caring-for-premium-fabrics': {
    title: 'Caring for Your Premium Fabrics',
    excerpt: 'Extend the life of your hijabs and abayas with proper fabric care.',
    content: `Detailed instructions on hand-washing chiffon, preserving bamboo modal, and steaming crepe abayas to retain drape and color vibrancy for years.`,
    authorName: 'Layla Mahmoud',
    category: 'Care & Tips',
    tags: ['fabric care', 'maintenance'],
    readTime: 5,
    publishedAt: '2026-03-05',
    image: '/images/blog_4.jpg',
  },
  'spring-2026-collection-preview': {
    title: 'Spring 2026 Collection Preview',
    excerpt: 'Get an exclusive first look at our upcoming Spring collection.',
    content: `Pastels, breathable desert linens, and handcrafted metallic pins inspired by architectural arches and timeless modesty.`,
    authorName: 'Veiled Canvas Team',
    category: 'Collections',
    tags: ['spring', 'new collection', '2026'],
    readTime: 7,
    publishedAt: '2026-02-28',
    image: '/images/blog_5.jpg',
  },
};

function getPost(slug: string) {
  return blogContent[slug] || blogContent['5-ways-to-style-hijab-summer'];
}

export default function BlogPostPage() {
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';
  const post = getPost(slug);

  return (
    <div className="pt-20 lg:pt-24">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4">{post.category}</Badge>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="font-medium text-foreground">{post.authorName}</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readTime} min read
            </span>
          </div>

          {/* Cover image on tailor dummy/atelier */}
          <div className="relative aspect-[2/1] rounded-2xl overflow-hidden shadow-lg border border-border/40 mb-8 bg-muted">
            <Image
              src={post.image || '/images/blog_1.jpg'}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <Separator className="mb-8" />

          {/* Article content */}
          <div className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground
            prose-li:text-muted-foreground
          ">
            {post.content.split('\n\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} className="font-heading text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('---')) {
                return <Separator key={i} className="my-8" />;
              }
              if (paragraph.startsWith('*')) {
                return <p key={i} className="italic text-muted-foreground">{paragraph.replace(/\*/g, '')}</p>;
              }
              return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>;
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
                <Tag size={10} className="inline mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  );
}
