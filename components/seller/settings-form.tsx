/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSellerSettingsAction, getSellerDocumentUploadUrlAction } from "@/lib/actions/seller-settings";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function SettingsForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const defaultAddress = initialData.seller_pickup_addresses?.[0] || {};
  const defaultBank = initialData.seller_bank_accounts?.[0] || {};

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      description: initialData.description || "",
      fullName: defaultAddress.full_name || "",
      phone: defaultAddress.phone || "",
      province: defaultAddress.province || "",
      city: defaultAddress.city || "",
      area: defaultAddress.area || "",
      street: defaultAddress.street || "",
      postalCode: defaultAddress.postal_code || "",
    }
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${initialData.logo}` : null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let logoPath = initialData.logo;
      
      if (logoFile) {
        // We will assume a simplified direct upload for the demo using the action that gets a signed URL
        const ext = logoFile.name.split('.').pop() || 'png';
        const uploadData = await getSellerDocumentUploadUrlAction("logo", ext);
        
        // This is a browser fetch to supabase storage using the signed URL
        const uploadRes = await fetch(uploadData.signedUrl, {
          method: 'PUT',
          body: logoFile,
          headers: {
            'Content-Type': logoFile.type
          }
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload logo image");
        }
        
        logoPath = uploadData.fullPath;
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
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
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
        {success && <div className="p-4 bg-green-100 text-green-800 rounded-xl text-sm font-bold">Settings updated successfully!</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-heading">Shop Profile</h2>
            
            <div className="grid gap-2">
              <Label>Shop Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden border flex items-center justify-center">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo" width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-muted-foreground text-xs">No Logo</span>
                  )}
                </div>
                <Input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleLogoChange} className="max-w-xs" />
              </div>
              <p className="text-xs text-muted-foreground">Recommended size: 400x400. JPG, PNG, or WebP.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Shop Description</Label>
              <Textarea 
                id="description" 
                {...register("description")} 
                placeholder="Describe your shop, products, and story..."
                rows={4}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-heading">Default Pickup Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Contact Name</Label>
                <Input id="fullName" {...register("fullName")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="province">Province</Label>
                <Input id="province" {...register("province")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area</Label>
              <Input id="area" {...register("area")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" {...register("street")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Postal Code (Optional)</Label>
              <Input id="postalCode" {...register("postalCode")} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-secondary/20 border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">Business Details (Read-only)</h2>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Business Name</p>
            <p className="font-bold">{initialData.business_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="capitalize font-bold">{initialData.status}</p>
          </div>
          <p className="text-xs text-muted-foreground">To change your legal business name, please contact support.</p>
        </div>

        <div className="bg-secondary/20 border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold font-heading">Payout Bank Account</h2>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
            <p className="font-bold">{defaultBank.bank_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">IBAN</p>
            <p className="font-mono bg-card px-2 py-1 rounded border text-sm inline-block">{maskIban(defaultBank.iban)}</p>
          </div>
          <p className="text-xs text-muted-foreground text-amber-700 bg-amber-50 p-2 rounded">
            To change bank details, contact support. Changes are verified before payouts.
          </p>
        </div>
      </div>
    </div>
  );
}
