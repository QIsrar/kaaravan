'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Tag, Search, ArrowRight, Calendar, BookOpen, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const blogPosts = [
  {
    slug: '5-ways-to-style-hijab-summer',
    title: '5 Ways to Style Your Hijab for Summer',
    excerpt: 'Beat the heat without compromising your style. Discover our top breathable hijab styling tips and lightweight drapes for the warmer months.',
    authorName: 'Amira Hassan',
    category: 'Style Guide',
    tags: ['hijab', 'summer', 'styling'],
    readTime: 6,
    publishedAt: '2025-06-15',
    image: '/images/blog_1.jpg',
  },
  {
    slug: 'ethics-behind-our-supply-chain',
    title: 'The Ethics Behind Our Supply Chain & Sustainable Sourcing',
    excerpt: 'Transparency matters. Learn how Veiled Canvas ensures fair artisan wages, sustainable low-impact dyes, and ethical European manufacturing.',
    authorName: 'Fatima Al-Rashid',
    category: 'Behind the Brand',
    tags: ['ethics', 'sustainability', 'fabric care'],
    readTime: 8,
    publishedAt: '2025-05-20',
    image: '/images/blog_2.jpg',
  },
  {
    slug: 'modest-fashion-workplace-guide',
    title: 'Modest Fashion at the Workplace: A Complete Workwear Guide',
    excerpt: 'Navigating executive dress codes with bespoke tailoring, structured abayas, and understated palettes.',
    authorName: 'Nour Khatib',
    category: 'Style Guide',
    tags: ['workwear', 'styling', 'professional'],
    readTime: 10,
    publishedAt: '2025-04-10',
    image: '/images/blog_3.jpg',
  },
  {
    slug: 'caring-for-premium-fabrics',
    title: 'Caring for Your Premium Fabrics: Silk, Chiffon & Linen',
    excerpt: 'Extend the lifespan of your modal hijabs and textured abayas with our atelier guide to gentle fabric care, steaming, and storage.',
    authorName: 'Layla Mahmoud',
    category: 'Care & Tips',
    tags: ['fabric care', 'maintenance', 'sustainability'],
    readTime: 5,
    publishedAt: '2025-03-05',
    image: '/images/blog_4.jpg',
  },
  {
    slug: 'spring-2025-collection-preview',
    title: 'Spring 2025 Collection Preview: Modern Silhouettes & Earth Tones',
    excerpt: 'Get an exclusive atelier preview of our upcoming spring drops, featuring mineral washed linens and handcrafted kimono abayas.',
    authorName: 'Veiled Canvas Atelier',
    category: 'Collections',
    tags: ['spring', 'new collection', 'summer', 'styling'],
    readTime: 7,
    publishedAt: '2025-02-28',
    image: '/images/blog_5.jpg',
  },
  {
    slug: 'sustainable-modest-wardrobe-capsule',
    title: 'Building a Minimalist & Sustainable Modest Capsule Wardrobe',
    excerpt: 'How investing in timeless, high-density modal and neutral tone abayas eliminates fast fashion waste and simplifies your daily styling.',
    authorName: 'Zara Siddiqui',
    category: 'Behind the Brand',
    tags: ['sustainability', 'workwear', 'styling'],
    readTime: 6,
    publishedAt: '2025-01-18',
    image: '/images/blog_2.jpg',
  },
];

const allCategories = [...new Set(blogPosts.map(p => p.category))];
const popularTags = ['hijab', 'sustainability', 'styling', 'workwear', 'fabric care', 'summer'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = blogPosts.filter(post => {
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = post.title.toLowerCase().includes(q);
      const excerptMatch = post.excerpt.toLowerCase().includes(q);
      const categoryMatch = post.category.toLowerCase().includes(q);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase()));
      if (!titleMatch && !excerptMatch && !categoryMatch && !tagMatch) return false;
    }
    return true;
  });

  const featured = blogPosts[0];

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  return (
    <div className="pt-20 lg:pt-24">
      {/* Header with bold border */}
      <section className="bg-gradient-to-br from-cream via-background to-cream-dark py-14 lg:py-18 border-b-2 border-border/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl lg:text-5xl font-bold mb-3"
          >
            The Veiled Canvas Journal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
          >
            Style guides, fabric care mastery, and editorial stories from our modest fashion atelier.
          </motion.p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex gap-8 flex-col lg:flex-row items-start">
          {/* Main content */}
          <div className="flex-1 w-full min-w-0">
            {/* Featured post */}
            {!selectedCategory && !searchQuery && (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-10">
                <Link href={`/blog/${featured.slug}`}>
                  <Card className="overflow-hidden hover-lift border-2 border-border/80 hover:border-primary/60 group rounded-2xl shadow-xs transition-all duration-300">
                    <div className="relative aspect-[2/1] bg-muted overflow-hidden">
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-6 sm:p-8">
                        <div>
                          <Badge className="mb-2 bg-primary text-espresso font-semibold border-0">{featured.category}</Badge>
                          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white group-hover:text-gold transition-colors">
                            {featured.title}
                          </h2>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground text-sm sm:text-base mb-4 leading-relaxed">{featured.excerpt}</p>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{featured.authorName}</span>
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

            {/* Empty State when no posts match */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border-2 border-dashed border-border/80 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">No Articles Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  {searchQuery
                    ? `No journal articles match your query "${searchQuery}".`
                    : 'No articles found in this category.'}
                  {' '}Try searching another topic or click below to clear active filters.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-2 border-border/80 hover:bg-muted font-medium"
                >
                  <X size={14} className="mr-1.5" /> Clear Filters
                </Button>
              </div>
            ) : (
              /* Post grid */
              <div className="grid sm:grid-cols-2 gap-6">
                {filtered.map((post, i) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <Card className="h-full hover-lift border-2 border-border/80 hover:border-primary/60 group overflow-hidden bg-card shadow-xs rounded-2xl transition-all duration-300">
                        <div className="relative aspect-[3/2] bg-muted overflow-hidden">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-xs border-0 text-xs">
                              {post.category}
                            </Badge>
                          </div>
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
                            {post.tags.map(tag => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSearchQuery(tag);
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                                  searchQuery.toLowerCase() === tag.toLowerCase()
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground'
                                }`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with bold border */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6 bg-card p-5 sm:p-6 rounded-2xl border-2 border-border/80 shadow-xs sticky top-24">
            {/* Search */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Search Journal</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-2 border-border/80"
                />
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Categories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === null ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  All Categories ({blogPosts.length})
                </button>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer border ${
                      searchQuery.toLowerCase() === tag.toLowerCase()
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-muted/70 border-border/80 text-muted-foreground hover:bg-primary/20 hover:text-foreground'
                    }`}
                  >
                    <Tag size={10} className="inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {(selectedCategory || searchQuery) && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full border-2 border-border/80 text-xs"
                >
                  <X size={12} className="mr-1.5" /> Reset All Filters
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
