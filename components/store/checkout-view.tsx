"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Truck,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Image } from "@/components/ui/image";
import {
  checkoutSchema,
  type CheckoutInput,
  PAKISTAN_PROVINCES,
  CITIES_BY_PROVINCE,
} from "@/lib/validators/checkout";
import { submitCheckoutAction } from "@/lib/actions/checkout";
import type { CartDetails } from "@/lib/services/cart";
import { formatPaisa } from "@/lib/format/currency";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface CheckoutViewProps {
  cart: CartDetails | null;
}

export function CheckoutView({ cart }: CheckoutViewProps) {
  const tCheckout = useTranslations("checkout");
  const [submitting, setSubmitting] = useState(false);
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        fullName: "",
        phone: "",
        province: "Punjab",
        city: "Lahore",
        area: "",
        street: "",
        postalCode: "",
      },
      billingAddressSameAsShipping: true,
      paymentMethod: "cod",
      orderNotes: "",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedProvince = watch("shippingAddress.province");
  const citiesForProvince = CITIES_BY_PROVINCE[selectedProvince] ?? [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value as CheckoutInput["shippingAddress"]["province"];
    setValue("shippingAddress.city", CITIES_BY_PROVINCE[province][0], { shouldValidate: true });
  };

  const onSubmit = async (data: CheckoutInput) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await submitCheckoutAction(data);
      setIsNoticeDialogOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout submission failed.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.totalItems === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card max-w-md mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">Your caravan cart is currently empty.</p>
        <Link href="/">
          <Button className="rounded-xl bg-primary text-primary-foreground">
            Explore Handcrafted Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Info Banner from Page Load */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-secondary/40 bg-secondary/10 flex items-center gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <p className="font-medium text-foreground leading-relaxed">
          {tCheckout("launchNotice")}
        </p>
      </div>

      {/* On Submit AlertDialog */}
      <AlertDialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <AlertDialogTitle className="text-center font-heading text-lg font-bold text-foreground">
              {tCheckout("launchNoticeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
              {tCheckout("launchNoticeDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full rounded-xl bg-primary text-primary-foreground text-xs font-semibold h-9 px-4">
                {tCheckout("continueShopping")}
              </Button>
            </Link>
            <Link href="/cart" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full rounded-xl text-xs font-semibold h-9 px-4">
                {tCheckout("backToKart")}
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Address, Shipping, Payment */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. SHIPPING ADDRESS */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-base text-foreground">
                1. Delivery Destination in Pakistan
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asad Ullah Khan"
                  {...register("shippingAddress.fullName")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                {errors.shippingAddress?.fullName && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.fullName.message}
                  </p>
                )}
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Mobile Number (for Courier SMS / Call) *
                </label>
                <input
                  type="tel"
                  placeholder="03001234567"
                  {...register("shippingAddress.phone")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                {errors.shippingAddress?.phone && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.phone.message}
                  </p>
                )}
              </div>

              {/* Province */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Province / Territory *
                </label>
                <select
                  {...register("shippingAddress.province", { onChange: handleProvinceChange })}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  {PAKISTAN_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
                {errors.shippingAddress?.province && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.province.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  City *
                </label>
                <select
                  {...register("shippingAddress.city")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  {citiesForProvince.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.shippingAddress?.city && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.city.message}
                  </p>
                )}
              </div>

              {/* Area / Town / Sector */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Town / Sector / Area *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 5, Block C or Gulberg III"
                  {...register("shippingAddress.area")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                {errors.shippingAddress?.area && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.area.message}
                  </p>
                )}
              </div>

              {/* Street Address & House / Apartment */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Street Address &amp; Nearby Landmark *
                </label>
                <input
                  type="text"
                  placeholder="House 14-B, Street 9, Near Main Roundabout"
                  {...register("shippingAddress.street")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                {errors.shippingAddress?.street && (
                  <p className="text-[11px] text-destructive">
                    {errors.shippingAddress.street.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. SHIPPING BREAKDOWN PER SELLER */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-base text-foreground">
                2. Shipping &amp; Logistics Allocation
              </h2>
            </div>

            <div className="space-y-3">
              {cart.sellerGroups.map((group) => (
                <div
                  key={group.sellerId}
                  className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      {group.sellerName}
                    </span>
                    <span className="text-muted-foreground">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"} via Certified Courier Partner
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {formatPaisa(group.estimatedShippingMinor)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. PAYMENT METHOD SELECTOR */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-base text-foreground">
                3. Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  selectedPaymentMethod === "cod"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value="cod"
                  {...register("paymentMethod")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pay cash directly to the courier upon doorstep delivery.
                  </p>
                </div>
              </label>

              {/* JazzCash */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  selectedPaymentMethod === "jazzcash"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value="jazzcash"
                  {...register("paymentMethod")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      JazzCash Mobile Account
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pay via your registered JazzCash mobile wallet.
                  </p>
                </div>
              </label>

              {/* Easypaisa */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  selectedPaymentMethod === "easypaisa"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value="easypaisa"
                  {...register("paymentMethod")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-foreground">
                      Easypaisa
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Direct instant debit from your Easypaisa app.
                  </p>
                </div>
              </label>

              {/* Debit/Credit Card */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  selectedPaymentMethod === "card"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value="card"
                  {...register("paymentMethod")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      Debit / Credit Card
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Visa &amp; Mastercard via 3D Secure verification.
                  </p>
                </div>
              </label>

              {/* Bank Transfer */}
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 sm:col-span-2 ${
                  selectedPaymentMethod === "bank_transfer"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  value="bank_transfer"
                  {...register("paymentMethod")}
                  className="mt-1 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      Direct Bank Transfer (1Link / IBFT)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Transfer directly to the seller&apos;s verified bank account and share the receipt.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-foreground border-b border-border pb-3">
              Checkout Summary
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pe-1">
              {cart.sellerGroups.flatMap((group) => group.items).map((item) => (
                <div key={item.cartItemId} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
                    <Image src={item.image} alt={item.productTitle} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {item.productTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {formatPaisa(item.subtotalMinor)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs border-t border-border pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-mono text-foreground font-semibold">
                  {formatPaisa(cart.subtotalMinor)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping ({cart.sellerGroups.length} workshops)</span>
                <span className="font-mono text-foreground font-semibold">
                  {formatPaisa(cart.shippingMinor)}
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-heading font-bold text-sm text-foreground">
                  Grand Total
                </span>
                <span className="font-heading font-black text-2xl text-primary">
                  {formatPaisa(cart.grandTotalMinor)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base shadow-md transition-all"
            >
              {submitting ? (
                <span>Validating Order...</span>
              ) : (
                <>
                  <span>Join the Kaaravan &amp; Place Order</span>
                  <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
                </>
              )}
            </Button>

            <div className="text-[11px] text-muted-foreground space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Prices are verified securely before every order</span>
              </div>
              <p className="leading-relaxed">
                Totals shown here always match the seller&apos;s current listed prices.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
