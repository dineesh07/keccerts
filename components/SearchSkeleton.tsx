// Skeleton loader shown while search is in progress

export function SearchSkeleton() {
  return (
    <div className="skeleton-section" aria-busy="true" aria-label="Loading results…">
      {/* Banner skeleton */}
      <div className="skeleton-banner">
        <div className="skeleton skeleton--circle" />
        <div className="skeleton-banner__lines">
          <div className="skeleton skeleton--line skeleton--line-lg" />
          <div className="skeleton skeleton--line skeleton--line-sm" />
        </div>
        <div className="skeleton skeleton--pill" />
      </div>

      {/* Card skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="skeleton-card__left">
            <div className="skeleton skeleton--line skeleton--line-xl" />
            <div className="skeleton skeleton--line skeleton--line-md" />
          </div>
          <div className="skeleton skeleton--btn" />
        </div>
      ))}
    </div>
  );
}
