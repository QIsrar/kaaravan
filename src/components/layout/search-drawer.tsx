'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/stores/ui-store';
import Link from 'next/link';

export function SearchDrawer() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');

  const popularSearches = [
    'Chiffon Hijab',
    'Black Abaya',
    'Sport Hijab',
    'Modest Swimwear',
    'Silk Wrap',
    'Magnetic Pins',
  ];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[70] bg-background shadow-2xl"
          >
            <div className="mx-auto max-w-3xl px-4 py-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="search"
                    placeholder="Search for hijabs, abayas, accessories..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="pl-12 h-14 text-lg rounded-xl border-2 border-border focus:border-primary"
                  />
                </div>
                <button
                  onClick={closeSearch}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {!query && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <Link
                        key={term}
                        href={`/shop?search=${encodeURIComponent(term)}`}
                        onClick={closeSearch}
                        className="px-4 py-2 rounded-full bg-muted text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {query && (
                <div className="py-4">
                  <Link
                    href={`/shop?search=${encodeURIComponent(query)}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Search size={16} className="text-muted-foreground" />
                    <span className="text-sm">
                      Search for &ldquo;<strong>{query}</strong>&rdquo;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
