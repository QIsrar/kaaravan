"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SellerOnboardingInput, sellerOnboardingSchema } from "@/lib/validators/seller-onboarding";
import { type PakistanProvince } from "@/lib/validators/pk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput, CnicInput, IbanInput, ProvinceCitySelect } from "@/components/ui/pk-inputs";
import { useRouter } from "next/navigation";
import { submitOnboardingAction } from "@/app/(store)/sell/actions";
import { uploadSellerDocumentAction } from "@/lib/actions/seller-documents";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function OnboardingWizard() {
  const t = useTranslations("seller.onboarding_wizard");
  const tPk = useTranslations("pk_inputs");

  const steps = [
    { id: 1, title: t("stepBusiness") },
    { id: 2, title: t("stepKyc") },
    { id: 3, title: t("stepBank") },
    { id: 4, title: t("stepAddress") },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SellerOnboardingInput>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
      businessType: "individual",
      province: "Punjab",
      city: "Lahore",
      agreementAccepted: false,
    },
  });

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    let fieldsToValidate: (keyof SellerOnboardingInput)[] = [];
    if (stepNumber === 1) fieldsToValidate = ["businessName", "businessType", "description"];
    if (stepNumber === 2) {
      fieldsToValidate = ["cnicNumber", "ntn"];
      if (!cnicFront || !cnicBack) {
        setError(t("errorBothImages"));
        return false;
      }
    }
    if (stepNumber === 3) fieldsToValidate = ["bankName", "accountTitle", "iban"];
    if (stepNumber === 4) {
      fieldsToValidate = [
        "fullName",
        "phone",
        "province",
        "city",
        "area",
        "street",
        "postalCode",
        "agreementAccepted",
      ];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (!isStepValid) {
      return false;
    }
    setError(null);
    return true;
  };

  const goToStep = async (targetStep: number) => {
    if (targetStep < currentStep) {
      setError(null);
      setCurrentStep(targetStep);
      window.scrollTo(0, 0);
      return;
    }

    if (targetStep > currentStep) {
      for (let s = 1; s < targetStep; s++) {
        const stepOk = await validateStep(s);
        if (!stepOk) {
          setCurrentStep(s);
          window.scrollTo(0, 0);
          return;
        }
      }
      setError(null);
      setCurrentStep(targetStep);
      window.scrollTo(0, 0);
    }
  };

  const nextStep = async () => {
    await goToStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setError(null);
      setCurrentStep((s) => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: SellerOnboardingInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitOnboardingAction(JSON.stringify(data));

      if (result?.sellerId) {
        if (cnicFront) {
          const fd = new FormData();
          fd.append("docType", "cnic_front");
          fd.append("file", cnicFront);
          await uploadSellerDocumentAction(fd);
        }
        if (cnicBack) {
          const fd = new FormData();
          fd.append("docType", "cnic_back");
          fd.append("file", cnicBack);
          await uploadSellerDocumentAction(fd);
        }
      }

      router.refresh(); // Will reload and show "Pending" status
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8 relative">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center flex-1 z-10">
            <button
              type="button"
              onClick={() => goToStep(step.id)}
              disabled={isSubmitting}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-2xs ${
                currentStep >= step.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              aria-label={step.title}
            >
              {step.id}
            </button>
            <span className="text-xs mt-2 hidden sm:block text-muted-foreground font-medium">
              {step.title}
            </span>
          </div>
        ))}
        <div className="hidden sm:block absolute h-0.5 bg-border -z-0 left-12 right-12 top-4" />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Business */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">{t("businessHeading")}</h3>
            <div className="grid gap-2">
              <Label htmlFor="businessName">{t("businessName")}</Label>
              <Input
                id="businessName"
                {...register("businessName")}
                placeholder={t("businessNamePlaceholder")}
              />
              {errors.businessName && (
                <span className="text-xs text-destructive">{errors.businessName.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessType">{t("businessType")}</Label>
              <select
                id="businessType"
                {...register("businessType")}
                onChange={(e) => {
                  register("businessType").onChange(e);
                  e.target.blur();
                }}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">{t("selectType")}</option>
                <option value="individual">{t("typeIndividual")}</option>
                <option value="company">{t("typeCompany")}</option>
              </select>
              {errors.businessType && (
                <span className="text-xs text-destructive">{errors.businessType.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("shortDesc")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("shortDescPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Step 2: KYC */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">{t("kycHeading")}</h3>
            <div className="grid gap-2">
              <CnicInput
                id="cnicNumber"
                label={t("cnicNumber")}
                {...register("cnicNumber")}
                error={errors.cnicNumber?.message ? tPk("cnicError") : undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ntn">{t("ntn")}</Label>
              <Input id="ntn" {...register("ntn")} placeholder={t("ntnPlaceholder")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-dashed rounded-xl bg-secondary/10 text-center relative hover:bg-secondary/20 transition-colors">
                <p className="text-sm font-medium mb-2">{t("cnicFront")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full relative z-10 pointer-events-none"
                >
                  {cnicFront ? cnicFront.name : t("selectFile")}
                </Button>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  onChange={(e) => setCnicFront(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
              <div className="p-4 border border-dashed rounded-xl bg-secondary/10 text-center relative hover:bg-secondary/20 transition-colors">
                <p className="text-sm font-medium mb-2">{t("cnicBack")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full relative z-10 pointer-events-none"
                >
                  {cnicBack ? cnicBack.name : t("selectFile")}
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
            <h3 className="text-xl font-bold font-heading">{t("bankHeading")}</h3>
            <div className="grid gap-2">
              <Label htmlFor="bankName">{t("bankName")}</Label>
              <Input
                id="bankName"
                {...register("bankName")}
                placeholder={t("bankNamePlaceholder")}
              />
              {errors.bankName && (
                <span className="text-xs text-destructive">{errors.bankName.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountTitle">{t("accountTitle")}</Label>
              <Input
                id="accountTitle"
                {...register("accountTitle")}
                placeholder={t("accountTitlePlaceholder")}
              />
              {errors.accountTitle && (
                <span className="text-xs text-destructive">{errors.accountTitle.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <IbanInput
                id="iban"
                label={t("iban")}
                {...register("iban")}
                error={errors.iban?.message ? tPk("ibanError") : undefined}
              />
            </div>
          </div>
        )}

        {/* Step 4: Address & Submit */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold font-heading">{t("addressHeading")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t("contactName")}</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <span className="text-xs text-destructive">{errors.fullName.message}</span>
                )}
              </div>
              <div className="grid gap-2">
                <PhoneInput
                  id="phone"
                  label={t("phone")}
                  {...register("phone")}
                  error={errors.phone?.message ? tPk("phoneError") : undefined}
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
              provinceError={errors.province?.message}
              cityError={errors.city?.message}
            />

            <div className="grid gap-2">
              <Label htmlFor="area">{t("area")}</Label>
              <Input id="area" {...register("area")} />
              {errors.area && (
                <span className="text-xs text-destructive">{errors.area.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street">{t("street")}</Label>
              <Input id="street" {...register("street")} />
              {errors.street && (
                <span className="text-xs text-destructive">{errors.street.message}</span>
              )}
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreementAccepted"
                  checked={!!watch("agreementAccepted")}
                  onCheckedChange={(c) =>
                    setValue("agreementAccepted", c === true, { shouldValidate: true })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreementAccepted"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("agreeText")}{" "}
                    <a
                      href="/legal/seller-agreement"
                      target="_blank"
                      className="text-primary underline"
                    >
                      {t("agreementLink")}
                    </a>
                    .
                  </label>
                  {errors.agreementAccepted && (
                    <span className="text-xs text-destructive font-medium">
                      {t("agreementError")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            {t("back")}
          </Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep} disabled={isSubmitting}>
              {t("nextStep")}
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submitApp")
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
