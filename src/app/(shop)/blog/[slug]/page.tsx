'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const blogContent: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
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
    publishedAt: '2025-06-15',
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

          {/* Cover image placeholder */}
          <div className="aspect-[2/1] rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 mb-8 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Featured Image</span>
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
