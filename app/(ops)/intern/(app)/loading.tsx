export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-3 px-4 py-6 md:px-8" aria-busy="true" aria-label="Wird geladen">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
