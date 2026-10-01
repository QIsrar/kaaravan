"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  updateProfileAction,
  requestAccountDeletionAction,
} from "@/lib/actions/customer_accounts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface SettingsManagerProps {
  initialProfile: {
    id: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    role: string;
  };
  initialDeletionRequest: {
    id: string;
    reason: string | null;
    status: string;
    created_at: string;
  } | null;
  sellerBusinessName?: string | null;
}

export function SettingsManager({
  initialProfile,
  initialDeletionRequest,
  sellerBusinessName,
}: SettingsManagerProps) {
  const t = useTranslations("settings");
  const tAccount = useTranslations("account");

  // Profile Form State
  const [fullName, setFullName] = useState(initialProfile.fullName || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Deletion Request State
  const [deletionRequest, setDeletionRequest] = useState(initialDeletionRequest);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isRequestingDelete, setIsRequestingDelete] = useState(false);

  // 1. Update Profile (Name & Phone)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setProfileError(t("nameMinLength"));
      return;
    }
    if (trimmedName.length > 100) {
      setProfileError(t("nameMaxLength"));
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^(03\d{9}|\+923\d{9})$/.test(trimmedPhone)) {
      setProfileError(t("invalidPakistaniPhone"));
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateProfileAction({
        full_name: trimmedName,
        phone: trimmedPhone === "" ? null : trimmedPhone,
      });
      toast.success(t("profileSuccess"));
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : t("profileUpdateError"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Change Password (Supabase Auth)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(t("currentPasswordRequired"));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t("passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    if (!initialProfile.email) {
      setPasswordError(t("passwordUpdateError"));
      return;
    }

    setIsSavingPassword(true);

    try {
      const supabase = createClient();

      // Verify current password first
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: initialProfile.email,
        password: currentPassword,
      });

      if (verifyErr) {
        setPasswordError(t("currentPasswordIncorrect"));
        setIsSavingPassword(false);
        return;
      }

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      // On success, revoke other active sessions
      await supabase.auth.signOut({ scope: "others" });

      toast.success(t("passwordSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : t("passwordUpdateError")
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  // 3. Request Account Deletion
  const handleDeleteRequest = async () => {
    setIsRequestingDelete(true);

    try {
      await requestAccountDeletionAction(deleteReason.trim() || undefined);
      toast.info(t("deleteRequestSubmitted"));
      setDeletionRequest({
        id: crypto.randomUUID(),
        reason: deleteReason.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      setIsDeleteDialogOpen(false);
      setDeleteReason("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("deleteRequestFailed")
      );
    } finally {
      setIsRequestingDelete(false);
    }
  };

  const isSeller = initialProfile.role === "seller";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Section 1: Profile Information */}
      <Card className="rounded-3xl border-border bg-card shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>{t("personalInfo")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t("personalInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg text-xs">
            {profileError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="full-name" className="font-semibold text-foreground block">
                {t("fullName")} *
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSavingProfile}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="font-semibold text-foreground block">
                {t("phone")}
              </label>
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none text-start"
                disabled={isSavingProfile}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground block">
                  {t("email")}
                </label>
                <input
                  type="email"
                  disabled
                  value={initialProfile.email || ""}
                  className="w-full text-xs rounded-xl border border-border bg-muted/40 p-2.5 text-muted-foreground cursor-not-allowed outline-none"
                />
              </div>

              {!isSeller && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground block">
                    {t("role")}
                  </label>
                  <div className="h-[38px] px-3 rounded-xl border border-border bg-muted/40 flex items-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                      <ShieldCheck className="w-3 h-3 me-1 text-primary" />
                      {initialProfile.role}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Banner replacing SELLER badge */}
            {isSeller && (
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl border border-secondary/40 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {tAccount("sellerBanner", {
                          name: sellerBusinessName || "Artisan Workshop",
                        })}
                      </p>
                    </div>
                  </div>
                  <Link href="/seller">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold h-8 px-3 shrink-0"
                    >
                      {tAccount("goToSellerPortal")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4 gap-1.5"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <span>{t("saveProfile")}</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Security & Password */}
      <Card className="rounded-3xl border-border bg-card shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>{t("security")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t("securityDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg text-xs">
            {passwordError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="current-password" className="font-semibold text-foreground block">
                {t("currentPassword")} *
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSavingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-password" className="font-semibold text-foreground block">
                {t("newPassword")} *
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSavingPassword}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="font-semibold text-foreground block">
                {t("confirmPassword")} *
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSavingPassword}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSavingPassword}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4 gap-1.5"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("updatingPassword")}</span>
                  </>
                ) : (
                  <span>{t("changePassword")}</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 3: Danger Zone */}
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5 shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>{t("dangerZone")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t("dangerZoneDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deletionRequest ? (
            <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {t("deletionPending", {
                    date: new Date(deletionRequest.created_at).toLocaleDateString(
                      "en-PK",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    ),
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("deletionPendingDesc")}
              </p>
              {deletionRequest.reason && (
                <p className="text-xs text-muted-foreground italic border-s-2 border-border ps-2 mt-1">
                  {t("reasonLabel")} &ldquo;{deletionRequest.reason}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      className="rounded-xl text-xs font-semibold h-9 px-4 gap-1.5"
                    />
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("deleteAccount")}</span>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold text-foreground">
                      {t("deleteDialogTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground">
                      {t("deleteDialogDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-1.5 my-2">
                    <label
                      htmlFor="delete-reason"
                      className="text-xs font-semibold text-foreground block"
                    >
                      {t("deleteReasonLabel")}
                    </label>
                    <textarea
                      id="delete-reason"
                      rows={3}
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder={t("deleteReasonPlaceholder")}
                      disabled={isRequestingDelete}
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-destructive resize-none"
                    />
                  </div>

                  <AlertDialogFooter className="gap-2 sm:gap-2">
                    <AlertDialogCancel
                      disabled={isRequestingDelete}
                      className="rounded-xl text-xs h-9 px-4"
                    >
                      {t("cancel")}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      onClick={handleDeleteRequest}
                      disabled={isRequestingDelete}
                      variant="destructive"
                      className="rounded-xl text-xs font-semibold h-9 px-4 gap-1.5"
                    >
                      {isRequestingDelete ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t("requestingDeletion")}</span>
                        </>
                      ) : (
                        <span>{t("confirmDeletion")}</span>
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
