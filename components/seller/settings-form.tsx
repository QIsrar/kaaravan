"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhoneInput, ProvinceCitySelect, IbanInput } from "@/components/ui/pk-inputs";
import { type PakistanProvince } from "@/lib/validators/pk";
import {
  updateSellerSettingsAction,
  uploadSellerLogoAction,
  requestBankChangeAction,
  getSellerBankChangeStatusAction,
} from "@/lib/actions/seller-settings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/format/image-url";
import { useTranslations } from "next-intl";
import { Loader2, Landmark, CheckCircle2, AlertCircle } from "lucide-react";

export interface SellerSettingsData {
  description: string | null;
  business_name: string;
  logo: string | null;
  status: string;
  seller_pickup_addresses: Array<{
    full_name: string;
    phone: string;
    province: string;
    city: string;
    area: string;
    street: string;
    postal_code: string | null;
  }>;
  seller_bank_accounts: Array<{
    bank_name: string;
    iban: string | null;
  }>;
}

export function SettingsForm({ initialData }: { initialData: SellerSettingsData }) {
  const t = useTranslations("seller.settings_form");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const defaultAddress = initialData.seller_pickup_addresses?.[0] || {};
  const defaultBank = initialData.seller_bank_accounts?.[0] || {};

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      description: initialData.description || "",
      fullName: defaultAddress.full_name || "",
      phone: defaultAddress.phone || "",
      province: defaultAddress.province || "Punjab",
      city: defaultAddress.city || "Lahore",
      area: defaultAddress.area || "",
      street: defaultAddress.street || "",
      postalCode: defaultAddress.postal_code || "",
    }
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo ? getPublicImageUrl(initialData.logo) : null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Bank change request state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [iban, setIban] = useState("");
  const [bankReason, setBankReason] = useState("");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [pendingBankRequest, setPendingBankRequest] = useState<{
    bank_name: string;
    ibanMasked: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    getSellerBankChangeStatusAction()
      .then((status) => {
        if (status && status.status === "pending") {
          setPendingBankRequest(status);
        }
      })
      .catch(() => {});
  }, []);

  const handleBankChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountTitle.trim() || !iban.trim()) {
      setBankError("Please fill all required bank fields");
      return;
    }

    try {
      setBankSubmitting(true);
      setBankError(null);
      await requestBankChangeAction({
        bankName,
        accountTitle,
        iban,
        reason: bankReason,
      });
      setBankSuccess(t("bankChangeSuccess"));
      setShowBankForm(false);
      setPendingBankRequest({
        bank_name: bankName,
        ibanMasked: "****" + iban.slice(-4),
        status: "pending",
      });
    } catch (err) {
      setBankError(err instanceof Error ? err.message : "Failed to submit bank change request");
    } finally {
      setBankSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > 800) {
          height = Math.round((height * 800) / width);
          width = 800;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], "logo.webp", { type: "image/webp" });
            setLogoFile(webpFile);
            setLogoPreview(URL.createObjectURL(webpFile));
          }
        }, "image/webp", 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let logoPath = initialData.logo || undefined;
      
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadData = await uploadSellerLogoAction(formData);
        logoPath = uploadData.logoPath;
      }

      await updateSellerSettingsAction({
        description: data.description,
        logo: logoPath,
        pickupAddress: {
          full_name: data.fullName,
          phone: data.phone,
          province: data.province,
          city: data.city,
          area: data.area,
          street: data.street,
          postal_code: data.postalCode
        }
      });

      setSuccess(true);
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("updateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mask bank account
  const maskIban = (iban: string) => {
    if (!iban || iban.length < 4) return iban;
    return `**** **** **** **** ${iban.slice(-4)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-bold">{error}</div>}
        {success && <div className="p-4 bg-green-100 text-green-800 rounded-xl text-sm font-bold">{t("settingsUpdated")}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-heading">{t("shopProfile")}</h2>
            
            <div className="grid gap-2">
              <Label>{t("shopLogo")}</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden border flex items-center justify-center">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo" width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-muted-foreground font-bold text-xl uppercase">
                      {initialData.business_name ? initialData.business_name.substring(0, 2) : "NA"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Button variant="outline" type="button">
                    {t("uploadLogo")}
                  </Button>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleLogoChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("logoHelp")}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("shopDesc")}</Label>
              <Textarea 
                id="description" 
                {...register("description")} 
                placeholder={t("descPlaceholder")}
                rows={4}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-heading">{t("pickupAddress")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("contactName")}</Label>
                <Input id="fullName" {...register("fullName")} />
              </div>
              <div className="grid gap-2">
                <PhoneInput
                  id="phone"
                  label={t("phone")}
                  {...register("phone")}
                  error={errors.phone?.message as string | undefined}
                />
              </div>
            </div>

            <ProvinceCitySelect
              provinceValue={watch("province") || "Punjab"}
              cityValue={watch("city") || "Lahore"}
              onProvinceChange={(p: PakistanProvince) =>
                setValue("province", p, { shouldValidate: true })
              }
              onCityChange={(c: string) => setValue("city", c, { shouldValidate: true })}
              provinceLabel={t("province")}
              cityLabel={t("city")}
              provinceError={errors.province?.message as string | undefined}
              cityError={errors.city?.message as string | undefined}
            />

            <div className="grid gap-2">
              <Label htmlFor="area">{t("area")}</Label>
              <Input id="area" {...register("area")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">{t("street")}</Label>
              <Input id="street" {...register("street")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">{t("postalCode")}</Label>
              <Input id="postalCode" {...register("postalCode")} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-secondary/20 border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">{t("businessDetails")}</h2>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("businessName")}</p>
            <p className="font-bold">{initialData.business_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("businessStatus")}</p>
            <p className="capitalize font-bold">{initialData.status}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t("changeBusinessHelp")}</p>
        </div>

        <div className="bg-secondary/20 border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading">{t("payoutBank")}</h2>
            <Landmark className="w-5 h-5 text-accent" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("bankName")}</p>
            <p className="font-bold">{defaultBank.bank_name || "NA"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("iban")}</p>
            <p className="font-mono bg-card px-2 py-1 rounded border text-sm inline-block">
              {maskIban(defaultBank.iban || "")}
            </p>
          </div>

          {pendingBankRequest && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t("bankChangePending")}</span>
              </div>
              <p>
                <strong>{pendingBankRequest.bank_name}</strong> ({pendingBankRequest.ibanMasked})
              </p>
            </div>
          )}

          {bankSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bankSuccess}</span>
            </div>
          )}

          {!showBankForm && !pendingBankRequest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBankForm(true)}
              className="w-full text-xs"
            >
              {t("requestBankChange")}
            </Button>
          )}

          {showBankForm && (
            <form onSubmit={handleBankChangeSubmit} className="pt-2 border-t border-border/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("requestBankChange")}
              </h3>

              {bankError && (
                <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                  {bankError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="bankName" className="text-xs">{t("bankName")}</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Meezan Bank, HBL"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="accountTitle" className="text-xs">{t("accountTitle")}</Label>
                <Input
                  id="accountTitle"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="e.g. Asad Ullah Khan"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <IbanInput
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bankReason" className="text-xs">{t("changeReason")}</Label>
                <Input
                  id="bankReason"
                  value={bankReason}
                  onChange={(e) => setBankReason(e.target.value)}
                  placeholder="Reason for change"
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={bankSubmitting}
                  className="text-xs"
                >
                  {bankSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
                      {t("submittingBankChange")}
                    </>
                  ) : (
                    t("submitBankChange")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBankForm(false)}
                  className="text-xs"
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          )}

          <p className="text-xs text-muted-foreground text-amber-700 bg-amber-50 p-2 rounded">
            {t("changeBankHelp")}
          </p>
        </div>

        <div className="bg-secondary/20 border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">{t("accountSecurity")}</h2>
          <p className="text-sm text-muted-foreground">{t("manageCredentials")}</p>
          <Button variant="outline" onClick={() => router.push("/account/settings")}>
            {t("accountSettings")}
          </Button>
        </div>
      </div>
    </div>
  );
}
