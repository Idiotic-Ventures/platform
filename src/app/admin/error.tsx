'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <h2 className="text-lg font-semibold">Admin error</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="text-sm px-4 py-2 rounded-md border hover:bg-accent"
      >
        Try again
      </button>
    </div>
  )
}
