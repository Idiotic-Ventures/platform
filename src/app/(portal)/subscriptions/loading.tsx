export default function SubscriptionsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-10 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
