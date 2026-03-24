export function SkeletonCard({ count = 3 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, hasTitle = false }) {
  return (
    <div>
      {hasTitle && <div className="skeleton skeleton-title" />}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-text ${i === lines - 1 ? 'skeleton-text--short' : ''}`}
        />
      ))}
    </div>
  );
}
