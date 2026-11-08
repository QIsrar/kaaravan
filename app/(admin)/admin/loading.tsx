export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-xl" />
        <div className="h-4 w-96 bg-muted/60 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 border border-border/60 p-4 space-y-3">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-7 w-32 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="h-96 rounded-2xl bg-muted/40 border border-border/60 p-6 space-y-4">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-64 w-full bg-muted/30 rounded-xl" />
      </div>
    </div>
  );
}

