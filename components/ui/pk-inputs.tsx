"use client";

import React, { useState, forwardRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAKISTAN_PROVINCES,
  CITIES_BY_PROVINCE,
  type PakistanProvince,
} from "@/lib/validators/pk";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "maxLength"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error: externalError, helpText, className, onChange, onBlur, value, defaultValue, ...props }, ref) => {
    const t = useTranslations("pk_inputs");
    const [internalError, setInternalError] = useState<string | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control keys (backspace, delete, tab, arrows, copy/paste)
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }
      // Block non-digits
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Keep only digits, max 11
      const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
      e.target.value = digitsOnly;

      if (digitsOnly.length >= 2 && !digitsOnly.startsWith("03")) {
        setInternalError(t("phoneError"));
      } else if (digitsOnly.length === 11 && !digitsOnly.startsWith("03")) {
        setInternalError(t("phoneError"));
      } else {
        setInternalError(null);
      }

      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "");
      if (val.length > 0 && (val.length !== 11 || !val.startsWith("03"))) {
        setInternalError(t("phoneError"));
      } else {
        setInternalError(null);
      }
      onBlur?.(e);
    };

    const activeError = externalError || internalError;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <Label htmlFor={props.id} className="text-xs font-semibold text-foreground">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder={props.placeholder || t("phonePlaceholder")}
          className={cn(
            "text-start font-mono tracking-wide",
            activeError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {activeError ? (
          <p className="text-xs text-destructive font-medium">{activeError}</p>
        ) : helpText ? (
          <p className="text-[11px] text-muted-foreground">{helpText}</p>
        ) : null}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export interface CnicInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "maxLength"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const CnicInput = forwardRef<HTMLInputElement, CnicInputProps>(
  ({ label, error: externalError, helpText, className, onChange, onBlur, value, defaultValue, ...props }, ref) => {
    const t = useTranslations("pk_inputs");
    const [internalError, setInternalError] = useState<string | null>(null);

    const formatCnic = (rawDigits: string): string => {
      const digits = rawDigits.replace(/\D/g, "").slice(0, 13);
      if (digits.length <= 5) return digits;
      if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCnic(e.target.value);
      e.target.value = formatted;

      const raw = formatted.replace(/\D/g, "");
      if (raw.length === 13) {
        setInternalError(null);
      }
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (raw.length > 0 && raw.length !== 13) {
        setInternalError(t("cnicError"));
      } else {
        setInternalError(null);
      }
      onBlur?.(e);
    };

    const activeError = externalError || internalError;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <Label htmlFor={props.id} className="text-xs font-semibold text-foreground">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          dir="ltr"
          placeholder={props.placeholder || t("cnicPlaceholder")}
          className={cn(
            "text-start font-mono tracking-wider",
            activeError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {activeError ? (
          <p className="text-xs text-destructive font-medium">{activeError}</p>
        ) : helpText ? (
          <p className="text-[11px] text-muted-foreground">{helpText}</p>
        ) : null}
      </div>
    );
  }
);
CnicInput.displayName = "CnicInput";

export interface IbanInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "maxLength"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const IbanInput = forwardRef<HTMLInputElement, IbanInputProps>(
  ({ label, error: externalError, helpText, className, onChange, onBlur, value, defaultValue, ...props }, ref) => {
    const t = useTranslations("pk_inputs");
    const [internalError, setInternalError] = useState<string | null>(null);

    const cleanIban = (val: string): string => {
      return val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = cleanIban(e.target.value);
      e.target.value = cleaned;

      if (cleaned.length === 24) {
        if (/^PK\d{2}[A-Z]{4}\d{16}$/.test(cleaned)) {
          setInternalError(null);
        } else {
          setInternalError(t("ibanError"));
        }
      }
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const cleaned = cleanIban(e.target.value);
      if (cleaned.length > 0 && !/^PK\d{2}[A-Z]{4}\d{16}$/.test(cleaned)) {
        setInternalError(t("ibanError"));
      } else {
        setInternalError(null);
      }
      onBlur?.(e);
    };

    const activeError = externalError || internalError;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <Label htmlFor={props.id} className="text-xs font-semibold text-foreground">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          type="text"
          dir="ltr"
          placeholder={props.placeholder || t("ibanPlaceholder")}
          className={cn(
            "text-start font-mono uppercase tracking-wide",
            activeError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {activeError ? (
          <p className="text-xs text-destructive font-medium">{activeError}</p>
        ) : helpText ? (
          <p className="text-[11px] text-muted-foreground">{helpText}</p>
        ) : null}
      </div>
    );
  }
);
IbanInput.displayName = "IbanInput";

export interface ProvinceCitySelectProps {
  provinceValue: string;
  cityValue: string;
  onProvinceChange: (province: PakistanProvince) => void;
  onCityChange: (city: string) => void;
  provinceLabel?: string;
  cityLabel?: string;
  provinceError?: string;
  cityError?: string;
  disabled?: boolean;
  className?: string;
  provinceId?: string;
  cityId?: string;
}

export function ProvinceCitySelect({
  provinceValue,
  cityValue,
  onProvinceChange,
  onCityChange,
  provinceLabel,
  cityLabel,
  provinceError,
  cityError,
  disabled = false,
  className,
  provinceId = "province-select",
  cityId = "city-select",
}: ProvinceCitySelectProps) {
  const t = useTranslations("pk_inputs");

  const validProvince = PAKISTAN_PROVINCES.includes(provinceValue as PakistanProvince)
    ? (provinceValue as PakistanProvince)
    : PAKISTAN_PROVINCES[0];

  const availableCities = CITIES_BY_PROVINCE[validProvince] || [];

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProv = e.target.value as PakistanProvince;
    onProvinceChange(newProv);
    const cities = CITIES_BY_PROVINCE[newProv];
    if (cities && cities.length > 0) {
      onCityChange(cities[0]);
    }
    // Ensures dropdown blur / close immediately on selection
    e.target.blur();
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCityChange(e.target.value);
    e.target.blur();
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 w-full", className)}>
      <div className="space-y-1.5 w-full">
        <Label htmlFor={provinceId} className="text-xs font-semibold text-foreground">
          {provinceLabel || t("provinceLabel")}
        </Label>
        <select
          id={provinceId}
          value={provinceValue}
          onChange={handleProvinceSelect}
          disabled={disabled}
          className={cn(
            "w-full text-xs rounded-xl border border-border bg-background p-2.5 sm:p-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring outline-none transition-colors",
            provinceError && "border-destructive"
          )}
        >
          {PAKISTAN_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
        {provinceError && (
          <p className="text-xs text-destructive font-medium">{provinceError}</p>
        )}
      </div>

      <div className="space-y-1.5 w-full">
        <Label htmlFor={cityId} className="text-xs font-semibold text-foreground">
          {cityLabel || t("cityLabel")}
        </Label>
        <select
          id={cityId}
          value={cityValue}
          onChange={handleCitySelect}
          disabled={disabled}
          className={cn(
            "w-full text-xs rounded-xl border border-border bg-background p-2.5 sm:p-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring outline-none transition-colors",
            cityError && "border-destructive"
          )}
        >
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {cityError && (
          <p className="text-xs text-destructive font-medium">{cityError}</p>
        )}
      </div>
    </div>
  );
}

