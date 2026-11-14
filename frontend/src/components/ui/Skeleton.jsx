export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-cream-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-cream-200 rounded w-2/3" />
        <div className="h-4 bg-cream-200 rounded w-1/2" />
        <div className="h-10 bg-cream-200 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`bg-cream-200 rounded animate-pulse ${className}`} />;
}
