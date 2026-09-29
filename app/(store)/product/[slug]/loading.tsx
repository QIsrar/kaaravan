export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Skeleton */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-3xl bg-muted/60" />
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-2xl bg-muted/40" />
            <div className="w-20 h-20 rounded-2xl bg-muted/40" />
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="lg:col-span-6 space-y-6">
          <div className="h-8 w-3/4 rounded-xl bg-muted/70" />
          <div className="h-5 w-1/3 rounded-xl bg-muted/40" />
          <div className="h-16 w-full rounded-2xl bg-muted/50" />
          <div className="h-12 w-full rounded-2xl bg-muted/60" />
          <div className="h-32 w-full rounded-2xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
