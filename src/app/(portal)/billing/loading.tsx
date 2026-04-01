export default function BillingLoading() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
      <div className="rounded-lg border p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="h-16 rounded bg-muted animate-pulse" />
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}
