'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Heart,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useCartStore } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CartDrawer } from './cart-drawer';
import { SearchDrawer } from './search-drawer';

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Products', href: '/shop' },
      { label: 'Hijabs & Scarves', href: '/shop?category=hijabs-scarves' },
      { label: 'Abayas & Dresses', href: '/shop?category=abayas-dresses' },
      { label: 'Modest Sportswear', href: '/shop?category=modest-sportswear' },
      { label: 'Accessories', href: '/shop?category=accessories' },
      { label: 'New Arrivals', href: '/shop?category=new-arrivals' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, openSearch, openCart } =
    useUIStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.getTotalItems());
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to view your wishlist', { icon: '🔒' });
      router.push('/login?redirect=/wishlist');
    } else {
      router.push('/wishlist');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <div onClick={closeMobileMenu}>
              <Logo href="/" size="md" priority />
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() =>
                    link.children && setActiveDropdown(link.label)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                  >
                    {link.label}
                    {link.children && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          activeDropdown === link.label ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-card border border-border shadow-lg overflow-hidden"
                      >
                        <div className="py-2">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={openSearch}
                className="text-foreground/80 hover:text-primary"
                aria-label="Search"
              >
                <Search size={20} />
              </Button>

              {/* Wishlist Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleWishlistClick}
                className="relative text-foreground/80 hover:text-rose-500"
                aria-label="Wishlist"
              >
                <Heart size={20} className={wishlistCount > 0 ? 'text-rose-500' : ''} />
                {mounted && wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </Button>

              {/* User Account / Dropdown Button */}
              <div className="relative">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-muted text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5"
                      aria-label="Account Menu"
                    >
                      <div className="w-7 h-7 rounded-full gradient-gold flex items-center justify-center text-espresso text-xs font-bold uppercase shadow-sm">
                        {user?.name?.[0] || 'U'}
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-border/60">
                          <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                          >
                            <Heart size={14} className="text-rose-500" /> My Saved Pieces ({wishlistCount})
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted text-primary transition-colors"
                            >
                              <ShieldCheck size={14} /> Admin Operations
                            </Link>
                          )}
                        </div>
                        <div className="pt-1 border-t border-border/60">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-foreground/80 hover:text-primary"
                  >
                    <Link href="/login" aria-label="Account">
                      <User size={20} />
                    </Link>
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="relative text-foreground/80 hover:text-primary"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {mounted && totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-border bg-background/98 backdrop-blur-md overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="block px-3 py-2.5 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                    {link.children && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeMobileMenu}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-3 mt-3 border-t border-border/60 space-y-1">
                  <Link
                    href="/wishlist"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Heart size={18} className="text-rose-500" /> My Saved Pieces
                    </span>
                    {wishlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-primary rounded-lg hover:bg-muted"
                        >
                          <ShieldCheck size={18} /> Admin Operations
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-base font-medium text-destructive rounded-lg hover:bg-destructive/10 text-left"
                      >
                        <LogOut size={18} /> Sign Out ({user?.name || 'Account'})
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                    >
                      <User size={18} /> Client Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
      <SearchDrawer />
    </>
  );
}
