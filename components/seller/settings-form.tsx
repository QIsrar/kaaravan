"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhoneInput, ProvinceCitySelect } from "@/components/ui/pk-inputs";
import { type PakistanProvince } from "@/lib/validators/pk";
import { updateSellerSettingsAction, uploadSellerLogoAction } from "@/lib/actions/seller-settings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/format/image-url";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

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
          <h2 className="text-lg font-bold font-heading">{t("payoutBank")}</h2>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("bankName")}</p>
            <p className="font-bold">{defaultBank.bank_name || "NA"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{t("iban")}</p>
            <p className="font-mono bg-card px-2 py-1 rounded border text-sm inline-block">{maskIban(defaultBank.iban || "")}</p>
          </div>
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
