import { Compass } from "lucide-react";

export default function StoreLoading() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-spin">
          <Compass className="w-8 h-8 stroke-[2]" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-secondary border-dashed animate-pulse pointer-events-none" />
      </div>

      <div className="text-center space-y-1">
        <h3 className="font-heading font-bold text-base text-foreground">
          Gathering the Kaaravan
        </h3>
        <p className="text-xs text-muted-foreground">
          Loading regional artisan crafts and workshops across Pakistan...
        </p>
      </div>
    </div>
  );
}
