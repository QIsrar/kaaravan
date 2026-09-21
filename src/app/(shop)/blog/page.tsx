'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Tag, Search, ArrowRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const blogPosts = [
  {
    slug: '5-ways-to-style-hijab-summer',
    title: '5 Ways to Style Your Hijab for Summer',
    excerpt: 'Beat the heat without compromising your style. Discover our top hijab styling tips for the warmer months.',
    authorName: 'Amira Hassan',
    category: 'Style Guide',
    tags: ['hijab', 'summer', 'styling'],
    readTime: 6,
    publishedAt: '2025-06-15',
  },
  {
    slug: 'ethics-behind-our-supply-chain',
    title: 'The Ethics Behind Our Supply Chain',
    excerpt: 'Transparency matters. Learn how Veiled Canvas ensures fair wages, sustainable materials, and ethical manufacturing.',
    authorName: 'Fatima Al-Rashid',
    category: 'Behind the Brand',
    tags: ['ethics', 'sustainability'],
    readTime: 8,
    publishedAt: '2025-05-20',
  },
  {
    slug: 'modest-fashion-workplace-guide',
    title: 'Modest Fashion at the Workplace: A Complete Guide',
    excerpt: 'Navigating professional dress codes while staying true to your modest fashion values.',
    authorName: 'Nour Khatib',
    category: 'Style Guide',
    tags: ['workwear', 'professional'],
    readTime: 10,
    publishedAt: '2025-04-10',
  },
  {
    slug: 'caring-for-premium-fabrics',
    title: 'Caring for Your Premium Fabrics',
    excerpt: 'Extend the life of your hijabs and abayas with proper fabric care. Expert tips for washing, drying, and storing.',
    authorName: 'Layla Mahmoud',
    category: 'Care & Tips',
    tags: ['fabric care', 'maintenance'],
    readTime: 5,
    publishedAt: '2025-03-05',
  },
  {
    slug: 'spring-2025-collection-preview',
    title: 'Spring 2025 Collection Preview',
    excerpt: 'Get an exclusive first look at our upcoming Spring collection. Fresh colors, new silhouettes, and exciting collaborations.',
    authorName: 'Veiled Canvas Team',
    category: 'Collections',
    tags: ['spring', 'new collection', '2025'],
    readTime: 7,
    publishedAt: '2025-02-28',
  },
];

const allCategories = [...new Set(blogPosts.map(p => p.category))];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = blogPosts.filter(post => {
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featured = blogPosts[0];

  return (
    <div className="pt-20 lg:pt-24">
      {/* Header */}
      <section className="bg-gradient-to-br from-cream via-background to-cream-dark py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl lg:text-5xl font-bold mb-4"
          >
            The Veiled Canvas Journal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Style tips, behind-the-scenes stories, and inspiration for the modern
            modest woman.
          </motion.p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            {/* Featured post */}
            {!selectedCategory && !searchQuery && (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-12">
                <Link href={`/blog/${featured.slug}`}>
                  <Card className="overflow-hidden hover-lift border-0 group">
                    <div className="aspect-[2/1] bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center">
                      <div className="text-center">
                        <Badge className="mb-3">{featured.category}</Badge>
                        <h2 className="font-heading text-2xl lg:text-3xl font-bold group-hover:text-primary transition-colors px-8">
                          {featured.title}
                        </h2>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground mb-4">{featured.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{featured.authorName}</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {featured.readTime} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* Post grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {filtered.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="h-full hover-lift border-0 group overflow-hidden">
                      <div className="aspect-[3/2] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <Badge variant="secondary">{post.category}</Badge>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{post.authorName}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {post.readTime} min
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Categories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedCategory ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  All Articles
                </button>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Popular tags */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['hijab', 'sustainability', 'styling', 'workwear', 'fabric care', 'summer'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Tag size={10} className="inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
