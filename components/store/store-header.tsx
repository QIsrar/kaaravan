"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, Compass, Search, Sparkles, X, Menu, ArrowRight, User, LogOut, Store, LayoutDashboard, Package, Heart, MapPin, Star, Settings, LogIn, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { BRAND_CONFIG } from "@/config/brand";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { useCartTotalItems } from "@/lib/hooks/use-cart";
import { useSearchSuggestions } from "@/lib/hooks/use-search-suggestions";
import { capSearchQuery, MIN_SEARCH_QUERY_LENGTH } from "@/lib/validators/search-constants";
import { formatPaisa } from "@/lib/format/currency";
import { signOutAction } from "@/lib/actions/auth";
import type { SellerPortalStatus } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const POPULAR_SEARCH_TERMS = [
  "Blue Pottery Vase",
  "Peshawari Chappal",
  "Pashmina Shawl",
  "Hunza Honey",
  "Sheesham Wood Tray",
  "Ajrak Silk Dupatta",
  "Brass Chai Degchi",
  "Pink Salt Slab",
];

interface StoreHeaderProps {
  sellerPortalHref: "/seller" | "/sell";
  user: SellerPortalStatus | null;
}

export function StoreHeader({ sellerPortalHref, user }: StoreHeaderProps) {
  const tNav = useTranslations("nav");
  const tStore = useTranslations("store");
  const tAuth = useTranslations("auth");
  const tAccount = useTranslations("account");
  const router = useRouter();
  const pathname = usePathname();

  const isCategoriesActive = pathname.startsWith("/category");
  const isSellActive = pathname.startsWith("/sell") || pathname.startsWith("/seller");
  const isAccountActive =
    pathname.startsWith("/account") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");
  const isCartActive = pathname.startsWith("/cart");

  const totalItems = useCartTotalItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = capSearchQuery(searchQuery);
  const showLiveSuggestions = trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH;
  const { data: suggestions, isFetching: isSuggestionsLoading } = useSearchSuggestions(
    showLiveSuggestions ? trimmedQuery : ""
  );

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = capSearchQuery(searchQuery);
    if (query.length > 0) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectTerm = (term: string) => {
    setSearchQuery(term);
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-2xs">
      {/* Top micro-bar */}
      <div className="bg-primary text-primary-foreground text-[11px] py-1 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
        <span>{tStore("promoBar")}</span>
      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Image
              src={BRAND_CONFIG.symbolPath}
              alt={BRAND_CONFIG.name}
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-tight text-primary">
              {BRAND_CONFIG.name}
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:inline">
              {BRAND_CONFIG.tagline}
            </span>
          </div>
        </Link>

        {/* Search bar with Autocomplete */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={tStore("searchPlaceholder")}
              className="w-full h-10 ps-10 pe-32 rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs placeholder:text-muted-foreground/80"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={tStore("clearSearch")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <Button
                type="submit"
                size="sm"
                className="h-8 rounded-full px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shrink-0"
              >
                {tStore("search")}
              </Button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full start-0 end-0 mt-1.5 p-3 rounded-2xl border border-border bg-card shadow-lg z-50 animate-in fade-in-50 duration-150 max-h-96 overflow-y-auto">
              {showLiveSuggestions ? (
                <>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 block mb-2">
                    {isSuggestionsLoading
                      ? tStore("searching")
                      : suggestions && suggestions.length > 0
                        ? tStore("suggestedCrafts")
                        : tStore("noSuggestions")}
                  </span>
                  <div className="flex flex-col gap-1">
                    {suggestions?.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors"
                      >
                        <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                          <Image src={item.image} alt={item.title} fill sizes="40px" className="object-cover" />
                        </div>
                        <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
                          <bdi dir="auto">{item.title}</bdi>
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground shrink-0">
                          {formatPaisa(item.priceMinor)}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {suggestions && suggestions.length > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline px-2 py-1.5"
                    >
                      <span>{tStore("viewAllResults")}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 block mb-2">
                    {tStore("popularSearches")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCH_TERMS.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectTerm(term)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary text-foreground transition-colors flex items-center gap-1.5"
                      >
                        <span><bdi dir="auto">{term}</bdi></span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground rtl:rotate-180" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation links & actions */}
        <div className="flex items-center gap-3">
          <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
            <Link
              href="/category/apparel-textiles"
              className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold ${
                isCategoriesActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-primary hover:bg-muted/60"
              }`}
            >
              {tNav("categories")}
            </Link>
            <Link
              href={sellerPortalHref}
              className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold ${
                isSellActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-primary hover:bg-muted/60"
              }`}
            >
              {tNav("sell")}
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold flex items-center gap-1.5 ${
                    isAccountActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-primary hover:bg-muted/60"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user.fullName || tNav("account")}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.fullName || tNav("account")}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem render={<Link href="/account" />}>
                    <User className="w-3.5 h-3.5" />
                    <span>{tAccount("overview")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/account/orders" />}>
                    <Package className="w-3.5 h-3.5" />
                    <span>{tAccount("orders")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/account/wishlist" />}>
                    <Heart className="w-3.5 h-3.5" />
                    <span>{tAccount("wishlist")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/account/addresses" />}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{tAccount("addresses")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/account/reviews" />}>
                    <Star className="w-3.5 h-3.5" />
                    <span>{tAccount("reviews")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/account/settings" />}>
                    <Settings className="w-3.5 h-3.5" />
                    <span>{tAccount("settings")}</span>
                  </DropdownMenuLinkItem>
                  {user.isApprovedSeller && (
                    <DropdownMenuLinkItem render={<Link href="/seller" />}>
                      <Store className="w-3.5 h-3.5" />
                      <span>{tNav("sellerPortal")}</span>
                    </DropdownMenuLinkItem>
                  )}
                  {user.role === "superadmin" && (
                    <DropdownMenuLinkItem render={<Link href="/admin" />}>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>{tNav("adminPanel")}</span>
                    </DropdownMenuLinkItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOutAction()}>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{tAuth("signOut")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold flex items-center gap-1.5 ${
                    isAccountActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-primary hover:bg-muted/60"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{tNav("signIn")}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5">
                  <DropdownMenuLinkItem render={<Link href="/login" />}>
                    <LogIn className="w-4 h-4" />
                    <span>{tNav("signIn")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuLinkItem render={<Link href="/register" />}>
                    <UserPlus className="w-4 h-4" />
                    <span>{tNav("createAccount")}</span>
                  </DropdownMenuLinkItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem render={<Link href="/track-order" />}>
                    <Compass className="w-4 h-4" />
                    <span>{tNav("trackOrder")}</span>
                  </DropdownMenuLinkItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Desktop Language Switcher */}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {/* Cart trigger button */}
          <Link
            href="/cart"
            className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center group ${
              isCartActive
                ? "border-primary bg-primary/10 ring-2 ring-primary/30 text-primary"
                : "border-border/80 hover:bg-muted text-foreground"
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-primary transition-transform group-hover:scale-105" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 bg-accent text-accent-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-border md:hidden text-foreground hover:bg-muted"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tStore("searchPlaceholder")}
            className="w-full h-9 ps-9 pe-16 rounded-full border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/80"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Button
            type="submit"
            size="xs"
            className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full px-2.5 bg-primary text-primary-foreground text-[10px]"
          >
            {tStore("search")}
          </Button>
        </form>
      </div>

      {/* Mobile drawer links */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <Link
            href="/category/apparel-textiles"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
              isCategoriesActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {tNav("categories")}
          </Link>
          <Link
            href={sellerPortalHref}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
              isSellActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {tNav("sell")}
          </Link>
          {user ? (
            <div className="pt-1 pb-1 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3 block">
                {tNav("account")}
              </span>
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname === "/account" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("overview")}
              </Link>
              <Link
                href="/account/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/account/orders") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("orders")}
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/account/wishlist") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("wishlist")}
              </Link>
              <Link
                href="/account/addresses"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/account/addresses") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("addresses")}
              </Link>
              <Link
                href="/account/reviews"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/account/reviews") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("reviews")}
              </Link>
              <Link
                href="/account/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/account/settings") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {tAccount("settings")}
              </Link>
            </div>
          ) : (
            <div className="pt-1 pb-1 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3 block">
                {tNav("account")}
              </span>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/login")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{tNav("signIn")}</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/register")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{tNav("createAccount")}</span>
              </Link>
              <Link
                href="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
                  pathname.startsWith("/track-order")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{tNav("trackOrder")}</span>
              </Link>
            </div>
          )}
          {user && (
            <Link
              href="/track-order"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
                pathname.startsWith("/track-order")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {tAccount("trackOrder")}
            </Link>
          )}
          {user?.isApprovedSeller && (
            <Link
              href="/seller"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-xs font-semibold py-2 px-3 rounded-xl transition-colors text-foreground hover:bg-muted"
            >
              {tNav("sellerPortal")}
            </Link>
          )}
          {user?.role === "superadmin" && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-xs font-semibold py-2 px-3 rounded-xl transition-colors text-foreground hover:bg-muted"
            >
              {tNav("adminPanel")}
            </Link>
          )}
          <Link
            href="/cart"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
              isCartActive
                ? "bg-primary text-primary-foreground"
                : "text-accent hover:bg-muted"
            }`}
          >
            {tNav("cart")} ({totalItems})
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOutAction();
              }}
              className="w-full text-start text-xs font-semibold py-2 px-3 rounded-xl transition-colors text-destructive hover:bg-destructive/10"
            >
              {tAuth("signOut")}
            </button>
          )}
          <div className="pt-3 border-t border-border flex items-center justify-between px-3">
            <span className="text-xs text-muted-foreground font-medium">{tNav("language")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
