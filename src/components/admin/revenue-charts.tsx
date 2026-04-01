'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatCurrency, formatDateShort } from '@/lib/utils'

type RangeKey = '30' | '90' | '365'

const RANGES: { label: string; value: RangeKey }[] = [
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: '12mo', value: '365' },
]

export function RevenueCharts() {
  const [range, setRange] = useState<RangeKey>('30')
  const [data, setData] = useState<Array<{ date: string; newRevenue: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/revenue-trend?days=${range}`)
      .then(r => r.json())
      .then(d => {
        setData(d.trend || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">Revenue Trend</CardTitle>
        <div className="flex gap-1 rounded-md border p-0.5">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                range === r.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateShort(v)}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'New Revenue']}
                labelFormatter={(label) => formatDateShort(label)}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="newRevenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenue-gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
