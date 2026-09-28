export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 py-5" aria-busy="true" aria-label="Memuat">
      <div className="skeleton h-28" />
      <div className="skeleton h-16" />
      <div className="skeleton h-16" />
      <div className="skeleton h-16" />
      <div className="skeleton h-16" />
    </div>
  )
}
