import type { LucideIcon } from "lucide-react";

interface SellerComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function SellerComingSoon({ icon: Icon, title, description }: SellerComingSoonProps) {
  return (
    <div className="p-10 sm:p-16 text-center rounded-3xl border border-dashed border-border bg-card max-w-xl mx-auto space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Icon className="w-8 h-8" />
      </div>
      <h1 className="font-heading text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
