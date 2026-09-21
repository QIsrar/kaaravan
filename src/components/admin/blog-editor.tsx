'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export interface BlogArticleForm {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  category: string;
  read_time: number;
  is_published: boolean;
}

export function BlogEditorModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BlogArticleForm | null;
  onSave: (article: BlogArticleForm) => void;
}) {
  const [formData, setFormData] = useState<BlogArticleForm>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author_name: 'Veiled Canvas Editorial',
    category: 'Styling Guides',
    read_time: 5,
    is_published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author_name: 'Veiled Canvas Editorial',
        category: 'Styling Guides',
        read_time: 5,
        is_published: true,
      });
    }
  }, [initialData, isOpen]);

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: initialData ? prev.slug : slug,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    onSave(formData);
    toast.success(initialData ? 'Article updated' : 'Article published');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            {initialData ? 'Edit Journal Article' : 'Compose New Article'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Draft or publish editorial features for the Veiled Canvas Journal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="article-title">Article Title</Label>
            <Input
              id="article-title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. The Philosophy of Intentional Layering"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="article-slug">URL Slug</Label>
              <Input
                id="article-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="article-read-time">Read Time (minutes)</Label>
              <Input
                id="article-read-time"
                type="number"
                min={1}
                value={formData.read_time}
                onChange={(e) =>
                  setFormData({ ...formData, read_time: parseInt(e.target.value || '1', 10) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="article-author">Author</Label>
              <Input
                id="article-author"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="article-category">Category</Label>
              <Input
                id="article-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Styling Guides, Fabric Care, Culture..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-excerpt">Summary Excerpt</Label>
            <Textarea
              id="article-excerpt"
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="A brief summary for previews and search engine cards..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-content">Content (Markdown Supported)</Label>
            <Textarea
              id="article-content"
              rows={8}
              className="font-mono text-xs"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write article in markdown... # Heading ## Subheading"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="is_published" className="cursor-pointer text-xs font-semibold">
              Publish immediately on live journal
            </Label>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" className="gradient-gold text-espresso font-semibold" size="sm">
              <Save size={14} className="mr-1.5" />
              Save Article
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
