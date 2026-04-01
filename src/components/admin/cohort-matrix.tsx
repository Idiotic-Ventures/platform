'use client'

interface CohortRow {
  cohort: string
  size: number
  retention: number[]
}

interface CohortMatrixProps {
  cohorts: CohortRow[]
}

function retentionColor(pct: number): string {
  if (pct >= 90) return 'bg-green-100 text-green-800'
  if (pct >= 75) return 'bg-green-50 text-green-700'
  if (pct >= 50) return 'bg-yellow-50 text-yellow-700'
  if (pct >= 25) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-700'
}

export function CohortMatrix({ cohorts }: CohortMatrixProps) {
  if (cohorts.length === 0) {
    return <p className="text-sm text-muted-foreground">No cohort data available</p>
  }

  const maxMonths = Math.max(...cohorts.map(c => c.retention.length))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cohort</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Size</th>
            {Array.from({ length: maxMonths }).map((_, i) => (
              <th key={i} className="text-center px-2 py-2 font-medium text-muted-foreground min-w-[52px]">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(row => (
            <tr key={row.cohort} className="border-t">
              <td className="px-3 py-2 font-mono">{row.cohort}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">{row.size}</td>
              {Array.from({ length: maxMonths }).map((_, i) => {
                const val = row.retention[i]
                if (val === undefined) {
                  return <td key={i} className="px-2 py-2 text-center text-muted-foreground/30">—</td>
                }
                return (
                  <td key={i} className={`px-2 py-2 text-center rounded font-medium ${retentionColor(val)}`}>
                    {val.toFixed(0)}%
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
