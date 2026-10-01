"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Star,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createReviewAction } from "@/lib/actions/customer_accounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export interface DeliveredOrderItem {
  orderItemId: string;
  subOrderId: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
  deliveredDate: string;
}

export interface UserReview {
  id: string;
  productId: string;
  orderItemId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "published" | "rejected";
  createdAt: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
}

interface ReviewsManagerProps {
  initialUnreviewed: DeliveredOrderItem[];
  initialReviews: UserReview[];
}

export function ReviewsManager({
  initialUnreviewed,
  initialReviews,
}: ReviewsManagerProps) {
  const t = useTranslations("reviews");

  const [activeTab, setActiveTab] = useState<"awaiting" | "published">("awaiting");
  const [unreviewed, setUnreviewed] = useState<DeliveredOrderItem[]>(initialUnreviewed);
  const [reviews, setReviews] = useState<UserReview[]>(initialReviews);

  // Review Form Dialog
  const [selectedItem, setSelectedItem] = useState<DeliveredOrderItem | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openReviewModal = (item: DeliveredOrderItem) => {
    setSelectedItem(item);
    setRating(5);
    setReviewTitle("");
    setReviewBody("");
    setErrorMsg(null);
  };

  const closeReviewModal = () => {
    setSelectedItem(null);
    setReviewTitle("");
    setReviewBody("");
    setErrorMsg(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (rating < 1 || rating > 5) {
      setErrorMsg("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (reviewBody.trim().length < 5) {
      setErrorMsg(t("reviewBodyRequired"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createReviewAction({
        product_id: selectedItem.productId,
        order_item_id: selectedItem.orderItemId,
        rating,
        title: reviewTitle.trim() || null,
        body: reviewBody.trim() || null,
      });

      toast.success(t("reviewCreated"));

      // Add to submitted reviews list
      const newReview: UserReview = {
        id: created.id,
        productId: selectedItem.productId,
        orderItemId: selectedItem.orderItemId,
        rating: created.rating,
        title: created.title,
        body: created.body,
        status: created.status as "pending" | "published" | "rejected",
        createdAt: created.created_at,
        productTitle: selectedItem.productTitle,
        productSlug: selectedItem.productSlug,
        productImage: selectedItem.productImage,
      };

      setReviews((prev) => [newReview, ...prev]);
      setUnreviewed((prev) =>
        prev.filter((i) => i.orderItemId !== selectedItem.orderItemId)
      );

      closeReviewModal();
      setActiveTab("published");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("awaiting")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "awaiting"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>{t("tabAwaiting")}</span>
          <Badge
            variant={activeTab === "awaiting" ? "secondary" : "outline"}
            className="text-[10px] py-0 px-1.5 font-bold"
          >
            {unreviewed.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("published")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "published"
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <span>{t("tabPublished")}</span>
          <Badge
            variant={activeTab === "published" ? "secondary" : "outline"}
            className="text-[10px] py-0 px-1.5 font-bold"
          >
            {reviews.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Items Awaiting Review */}
      {activeTab === "awaiting" && (
        <div className="space-y-4">
          {unreviewed.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {t("emptyAwaitingTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("emptyAwaitingDesc")}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unreviewed.map((item) => (
                <Card
                  key={item.orderItemId}
                  className="rounded-3xl border-border bg-card shadow-2xs hover:border-primary/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                      <Image
                        src={item.productImage || "/placeholder-product.svg"}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="font-heading font-semibold text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        <bdi dir="auto">{item.productTitle}</bdi>
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {t("deliveredOn", {
                          date: new Date(item.deliveredDate).toLocaleDateString("en-PK", {
                            month: "short",
                            day: "numeric",
                          }),
                        })}
                      </p>
                      <Button
                        size="xs"
                        onClick={() => openReviewModal(item)}
                        className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-7 px-3 gap-1 mt-1"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{t("writeReview")}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User's Published Reviews */}
      {activeTab === "published" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {t("emptyPublishedTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("emptyPublishedDesc")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => {
                const statusKey = rev.status as "pending" | "published" | "rejected";
                const isPublished = rev.status === "published";
                const isPending = rev.status === "pending";

                return (
                  <Card
                    key={rev.id}
                    className="rounded-3xl border-border bg-card shadow-2xs overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 mt-0.5">
                          <Image
                            src={rev.productImage || "/placeholder-product.svg"}
                            alt={rev.productTitle}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/product/${rev.productSlug}`}
                              className="font-heading font-bold text-xs text-foreground hover:text-primary transition-colors truncate"
                            >
                              <bdi dir="auto">{rev.productTitle}</bdi>
                            </Link>
                            <Badge
                              variant={
                                isPublished
                                  ? "default"
                                  : isPending
                                  ? "accent"
                                  : "destructive"
                              }
                              className="text-[10px] uppercase font-bold py-0"
                            >
                              {t(`status.${statusKey}` as Parameters<typeof t>[0]) || rev.status}
                            </Badge>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? "fill-current" : "text-muted/60"
                                }`}
                              />
                            ))}
                            <span className="text-[11px] font-semibold text-foreground ms-1">
                              {rev.rating}.0
                            </span>
                          </div>

                          {rev.title && (
                            <h4 className="font-heading font-semibold text-xs text-foreground pt-0.5">
                              <bdi dir="auto">{rev.title}</bdi>
                            </h4>
                          )}

                          {rev.body && (
                            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5" dir="auto">
                              {rev.body}
                            </p>
                          )}

                          <span className="text-[10px] text-muted-foreground block pt-1">
                            {new Date(rev.createdAt).toLocaleDateString("en-PK", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <AlertDialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) closeReviewModal();
        }}
      >
        <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {selectedItem && t("reviewDialogTitle", { product: selectedItem.productTitle })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {t("verifiedReviewNotice")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 my-2 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                {t("ratingLabel")} *
              </label>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starVal = i + 1;
                  const activeStar = (hoverRating ?? rating) >= starVal;

                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                      aria-label={`${starVal} stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          activeStar
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ms-2 font-heading font-bold text-sm text-foreground">
                  {hoverRating ?? rating} / 5
                </span>
              </div>
            </div>

            {/* Title / Headline */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                {t("reviewTitleLabel")}
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder={t("reviewTitlePlaceholder")}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Review Body */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                {t("reviewBodyLabel")} *
              </label>
              <textarea
                rows={4}
                required
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder={t("reviewBodyPlaceholder")}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                disabled={isSubmitting}
              />
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-2 pt-2">
              <AlertDialogCancel
                type="button"
                disabled={isSubmitting}
                onClick={closeReviewModal}
                className="rounded-xl text-xs h-9 px-4"
              >
                {t("cancel")}
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4 gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("submittingReview")}</span>
                  </>
                ) : (
                  <span>{t("submitReview")}</span>
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
