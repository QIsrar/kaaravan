export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 rounded-3xl bg-muted/60" />

      {/* Grid Layout Skeleton */}
      <div className="flex gap-8 items-start">
        <div className="hidden lg:block w-64 h-96 rounded-2xl bg-muted/40 shrink-0" />
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
