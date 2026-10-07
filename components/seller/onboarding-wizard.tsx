"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SellerOnboardingInput, sellerOnboardingSchema } from "@/lib/validators/seller-onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { submitOnboardingAction } from "@/app/(store)/sell/actions";
import { uploadSellerDocumentAction } from "@/lib/actions/seller-documents";
import { Loader2 } from "lucide-react";

const steps = [
  { id: 1, title: "Business Info" },
  { id: 2, title: "KYC & Documents" },
  { id: 3, title: "Bank Details" },
  { id: 4, title: "Pickup Address" },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);

  const { register, handleSubmit, trigger, formState: { errors }, setValue, watch } = useForm<SellerOnboardingInput>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
      businessType: "individual"
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof SellerOnboardingInput)[] = [];
    if (currentStep === 1) fieldsToValidate = ["businessName", "businessType", "description"];
    if (currentStep === 2) fieldsToValidate = ["cnicNumber", "ntn"];
    if (currentStep === 3) fieldsToValidate = ["bankName", "accountTitle", "iban"];
    
    const isStepValid = await trigger(fieldsToValidate);
    
    if (currentStep === 2 && (!cnicFront || !cnicBack)) {
      setError("Please select both CNIC Front and Back images.");
      return;
    }
    setError(null);

    if (isStepValid) {
      setCurrentStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => setCurrentStep(s => s - 1);

  const onSubmit = async (data: SellerOnboardingInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitOnboardingAction(JSON.stringify(data));
      
      if (result?.sellerId) {
        if (cnicFront) {
          const fd = new FormData();
          fd.append("sellerId", result.sellerId);
          fd.append("docType", "cnic_front");
          fd.append("file", cnicFront);
          await uploadSellerDocumentAction(fd);
        }
        if (cnicBack) {
          const fd = new FormData();
          fd.append("sellerId", result.sellerId);
          fd.append("docType", "cnic_back");
          fd.append("file", cnicBack);
          await uploadSellerDocumentAction(fd);
        }
      }

      router.refresh(); // Will reload and show "Pending" status
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {step.id}
            </div>
            <span className="text-xs mt-2 hidden sm:block text-muted-foreground">{step.title}</span>
            {step.id !== steps.length && (
              <div className="hidden sm:block absolute h-0.5 bg-border -z-10 left-1/2 right-0 top-4" />
            )}
          </div>
        ))}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-bold">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Step 1: Business */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">Business Information</h3>
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" {...register("businessName")} placeholder="e.g. Lahore Artisans" />
              {errors.businessName && <span className="text-xs text-destructive">{errors.businessName.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <select id="businessType" {...register("businessType")} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="">Select Type</option>
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="company">Registered Company</option>
              </select>
              {errors.businessType && <span className="text-xs text-destructive">{errors.businessType.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea id="description" {...register("description")} placeholder="What do you sell?" />
            </div>
          </div>
        )}

        {/* Step 2: KYC */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">Identity Verification</h3>
            <div className="grid gap-2">
              <Label htmlFor="cnicNumber">CNIC Number *</Label>
              <Input id="cnicNumber" {...register("cnicNumber")} placeholder="XXXXX-XXXXXXX-X" />
              {errors.cnicNumber && <span className="text-xs text-destructive">{errors.cnicNumber.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ntn">NTN (Optional)</Label>
              <Input id="ntn" {...register("ntn")} placeholder="National Tax Number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-dashed rounded-xl bg-secondary/10 text-center relative hover:bg-secondary/20 transition-colors">
                <p className="text-sm font-medium mb-2">CNIC Front *</p>
                <Button type="button" variant="outline" size="sm" className="w-full relative z-10 pointer-events-none">
                  {cnicFront ? cnicFront.name : "Select File"}
                </Button>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  onChange={(e) => setCnicFront(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
              <div className="p-4 border border-dashed rounded-xl bg-secondary/10 text-center relative hover:bg-secondary/20 transition-colors">
                <p className="text-sm font-medium mb-2">CNIC Back *</p>
                <Button type="button" variant="outline" size="sm" className="w-full relative z-10 pointer-events-none">
                  {cnicBack ? cnicBack.name : "Select File"}
                </Button>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  onChange={(e) => setCnicBack(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Bank */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">Bank Details for Payouts</h3>
            <div className="grid gap-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input id="bankName" {...register("bankName")} placeholder="e.g. Meezan Bank" />
              {errors.bankName && <span className="text-xs text-destructive">{errors.bankName.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountTitle">Account Title *</Label>
              <Input id="accountTitle" {...register("accountTitle")} placeholder="Exact name on account" />
              {errors.accountTitle && <span className="text-xs text-destructive">{errors.accountTitle.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input id="iban" {...register("iban")} placeholder="PKXX MEEZ 0000..." />
              {errors.iban && <span className="text-xs text-destructive">{errors.iban.message}</span>}
            </div>
          </div>
        )}

        {/* Step 4: Address & Submit */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">Pickup Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Contact Name *</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <span className="text-xs text-destructive">{errors.fullName.message}</span>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="province">Province *</Label>
                <Input id="province" {...register("province")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" {...register("city")} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area *</Label>
              <Input id="area" {...register("area")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input id="street" {...register("street")} />
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="agreementAccepted" 
                  checked={!!watch("agreementAccepted")}
                  onCheckedChange={(c) => setValue("agreementAccepted", (c === true) as unknown as true, { shouldValidate: true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreementAccepted"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the <a href="/legal/seller-agreement" target="_blank" className="text-primary underline">Kaaravan Seller Agreement</a>.
                  </label>
                  {errors.agreementAccepted && <span className="text-xs text-destructive">{errors.agreementAccepted.message}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting}>
            Back
          </Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>Next Step</Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
