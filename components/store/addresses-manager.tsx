"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import {
  PAKISTAN_PROVINCES,
  CITIES_BY_PROVINCE,
  type PakistanProvince,
} from "@/lib/validators/checkout";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from "@/lib/actions/customer_accounts";
import type { AddressRow } from "@/lib/services/customer_accounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface AddressesManagerProps {
  initialAddresses: AddressRow[];
}

export function AddressesManager({ initialAddresses }: AddressesManagerProps) {
  const t = useTranslations("addresses");
  const [addresses, setAddresses] = useState<AddressRow[]>(initialAddresses);

  // Modal & Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Async state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState<PakistanProvince>("Punjab");
  const [city, setCity] = useState(CITIES_BY_PROVINCE["Punjab"][0]);
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setProvince("Punjab");
    setCity(CITIES_BY_PROVINCE["Punjab"][0]);
    setArea("");
    setStreet("");
    setPostalCode("");
    setIsDefault(false);
    setEditingAddress(null);
    setErrorMsg(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressRow) => {
    setEditingAddress(addr);
    setFullName(addr.full_name);
    setPhone(addr.phone);
    const prov = (PAKISTAN_PROVINCES.includes(addr.province as PakistanProvince)
      ? addr.province
      : "Punjab") as PakistanProvince;
    setProvince(prov);
    setCity(addr.city);
    setArea(addr.area);
    setStreet(addr.street);
    setPostalCode(addr.postal_code || "");
    setIsDefault(addr.is_default);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleProvinceChange = (newProv: PakistanProvince) => {
    setProvince(newProv);
    const availableCities = CITIES_BY_PROVINCE[newProv];
    if (availableCities && availableCities.length > 0) {
      setCity(availableCities[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (fullName.trim().length < 2) {
      setErrorMsg(t("nameRequired"));
      return;
    }
    const phoneClean = phone.trim();
    if (!/^(03\d{9}|\+923\d{9})$/.test(phoneClean)) {
      setErrorMsg(t("invalidPhone"));
      return;
    }
    if (street.trim().length < 5) {
      setErrorMsg(t("streetRequired"));
      return;
    }
    if (area.trim().length < 2) {
      setErrorMsg(t("areaRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phoneClean,
        province,
        city,
        area: area.trim(),
        street: street.trim(),
        postal_code: postalCode.trim() || null,
        is_default: isDefault,
      };

      if (editingAddress) {
        const updated = await updateAddressAction(editingAddress.id, payload);
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddress.id) return updated;
            if (isDefault) return { ...a, is_default: false };
            return a;
          })
        );
        toast.success(t("addressUpdated"));
      } else {
        const created = await createAddressAction(payload);
        setAddresses((prev) => {
          if (isDefault) {
            return [created, ...prev.map((a) => ({ ...a, is_default: false }))];
          }
          return [created, ...prev];
        });
        toast.success(t("addressCreated"));
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      await deleteAddressAction(deleteTargetId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTargetId));
      toast.success(t("addressDeleted"));
      setDeleteTargetId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (addrId: string) => {
    setSettingDefaultId(addrId);

    try {
      await updateAddressAction(addrId, { is_default: true });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === addrId,
        }))
      );
      toast.success(t("defaultUpdated"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("defaultUpdateError"));
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 h-9 px-4 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("addAddress")}</span>
        </Button>
      </div>

      {/* Address Cards Grid */}
      {addresses.length === 0 ? (
        <div className="p-10 sm:p-16 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-heading font-bold text-base text-foreground">
              {t("emptyTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("emptyDesc")}
            </p>
          </div>
          <Button
            onClick={openAddModal}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
          >
            {t("addAddress")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`rounded-3xl border transition-all ${
                addr.is_default
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-card shadow-2xs hover:border-border/80"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    <span>{addr.full_name}</span>
                  </CardTitle>
                  {addr.is_default && (
                    <Badge variant="default" className="text-[10px] uppercase font-bold py-0.5">
                      <Star className="w-2.5 h-2.5 me-1 fill-current" />
                      {t("defaultBadge")}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <div className="text-muted-foreground space-y-1 leading-relaxed">
                  <p className="font-medium text-foreground">{addr.phone}</p>
                  <p className="pt-1">{addr.street}</p>
                  <p>
                    {addr.area}, {addr.city}
                  </p>
                  <p>
                    {addr.province}{" "}
                    {addr.postal_code && `(${addr.postal_code})`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <div>
                    {!addr.is_default && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={settingDefaultId === addr.id}
                        className="text-xs text-primary hover:bg-primary/10 rounded-lg h-7 px-2"
                      >
                        {settingDefaultId === addr.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>{t("setDefault")}</span>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ms-auto">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openEditModal(addr)}
                      className="rounded-lg border-border text-xs h-7 px-2.5 gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{t("editAddress")}</span>
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setDeleteTargetId(addr.id)}
                      className="rounded-lg text-xs h-7 px-2 text-destructive hover:bg-destructive/10 gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t("deleteAddress")}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Address Dialog */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {editingAddress ? t("editAddress") : t("addAddress")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Verified delivery across all provinces and territories of Pakistan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("fullName")} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Asad Ullah Khan"
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("phone")} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("province")} *
                </label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value as PakistanProvince)}
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                >
                  {PAKISTAN_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("city")} *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                >
                  {(CITIES_BY_PROVINCE[province] || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                {t("area")} *
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Gulberg III / DHA Phase 5 / Saddar"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                {t("street")} *
              </label>
              <textarea
                rows={2}
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House / Flat No., Street, Landmark"
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("postalCode")}
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 54660"
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4 sm:pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs text-foreground font-medium">
                    {t("isDefault")}
                  </span>
                </label>
              </div>
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-2 pt-2">
              <AlertDialogCancel
                type="button"
                disabled={isSubmitting}
                onClick={resetForm}
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
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <span>{editingAddress ? t("updateAddress") : t("saveAddress")}</span>
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {t("deleteDialogDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeleteTargetId(null)}
              className="rounded-xl text-xs h-9 px-4"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="rounded-xl text-xs font-semibold h-9 px-4 gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("deleting")}</span>
                </>
              ) : (
                <span>{t("confirmDelete")}</span>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
