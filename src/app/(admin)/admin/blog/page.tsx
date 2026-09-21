'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BlogEditorModal, type BlogArticleForm } from '@/components/admin/blog-editor';
import { Plus, Search, Edit3, ExternalLink, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  category: string;
  read_time: number;
  is_published: boolean;
  published_at: string;
  excerpt: string;
  content: string;
}

const initialPosts: AdminBlogPost[] = [
  {
    id: 'post_1',
    title: 'The Art of Layering: Sophistication in Contemporary Modesty',
    slug: 'the-art-of-layering-sophistication-in-contemporary-modesty',
    author_name: 'Layla Al-Khatib',
    category: 'Styling Guides',
    read_time: 5,
    is_published: true,
    published_at: '2026-09-15',
    excerpt: 'Explore the subtle interplay of proportions, textures, and draped silhouettes that create effortless grace across seasons.',
    content: 'Modest fashion is inherently architectural. When we think of layering, we think of balancing weight, contrast, and fluidity...',
  },
  {
    id: 'post_2',
    title: 'Fabric Longevity: Caring for Pure Mulberry Silk & Modal',
    slug: 'fabric-longevity-caring-for-pure-mulberry-silk-and-modal',
    author_name: 'Amina Zahra',
    category: 'Textiles & Care',
    read_time: 4,
    is_published: true,
    published_at: '2026-09-10',
    excerpt: 'Essential techniques for maintaining the hand-feel, luster, and structural drape of your natural fiber hijabs.',
    content: 'Natural fibers breathe, move, and hold an unmistakable luminous drape. To protect their longevity...',
  },
  {
    id: 'post_3',
    title: 'Modern Architecture as Inspiration for Modest Silhouettes',
    slug: 'modern-architecture-as-inspiration-for-modest-silhouettes',
    author_name: 'Veiled Canvas Design Team',
    category: 'Design Journal',
    read_time: 6,
    is_published: false, // Draft
    published_at: '2026-09-18',
    excerpt: 'How minimalist brutalism and organic arches shaped the tailoring of our Autumn/Winter drape collection.',
    content: 'When our design team began sketching the silhouette of our Linen Everyday Abaya, we looked toward clean geometry...',
  },
];

export default function AdminBlogPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogArticleForm | null>(null);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePublish = (id: string, current: boolean) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_published: !current } : p))
    );
    toast.success(current ? 'Article moved to Drafts' : 'Article published live');
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: AdminBlogPost) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      category: post.category,
      read_time: post.read_time,
      is_published: post.is_published,
    });
    setIsEditorOpen(true);
  };

  const handleSavePost = (form: BlogArticleForm) => {
    if (form.id) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === form.id
            ? {
                ...p,
                title: form.title,
                slug: form.slug,
                excerpt: form.excerpt,
                content: form.content,
                author_name: form.author_name,
                category: form.category,
                read_time: form.read_time,
                is_published: form.is_published,
              }
            : p
        )
      );
    } else {
      const newPost: AdminBlogPost = {
        id: `post_${Date.now()}`,
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        author_name: form.author_name,
        category: form.category,
        read_time: form.read_time,
        is_published: form.is_published,
        published_at: new Date().toISOString().split('T')[0],
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Journal & Editorial Content"
        subtitle="Manage brand storytelling, styling guides, and textile educational articles"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Button
            onClick={handleOpenCreate}
            className="gradient-gold text-espresso font-semibold h-10 shrink-0 gap-1.5"
          >
            <Plus size={16} />
            Compose New Article
          </Button>
        </div>

        <Card className="border-border/80 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Read Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                      No journal articles found.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-medium text-foreground text-xs sm:text-sm font-heading">
                          {post.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          /blog/{post.slug}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {post.category}
                      </td>
                      <td className="py-4 px-4 text-xs text-foreground">
                        {post.author_name}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {post.read_time} min read
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] capitalize px-2 py-0.5 border ${
                            post.is_published
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {post.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleTogglePublish(post.id, post.is_published)}
                        >
                          {post.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                          {post.is_published ? 'Unpublish' : 'Publish'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleOpenEdit(post)}
                        >
                          <Edit3 size={13} />
                          Edit
                        </Button>

                        {post.is_published && (
                          <Button asChild size="sm" variant="ghost" className="h-8 text-xs px-2">
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <ExternalLink size={13} />
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialData={editingPost}
        onSave={handleSavePost}
      />
    </div>
  );
}
