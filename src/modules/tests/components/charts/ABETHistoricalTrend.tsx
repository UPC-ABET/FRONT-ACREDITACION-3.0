'use client'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/components/ui'

const data = [
  { ciclo: '2024-I', logro: 65 },
  { ciclo: '2024-II', logro: 68 },
  { ciclo: '2025-I', logro: 74 },
  { ciclo: '2025-II', logro: 72 },
  { ciclo: '2026-I', logro: 80 },
]

const config = {
  logro: { label: 'Promedio de Logro', color: '#dc2626' },
} satisfies ChartConfig

export function ABETHistoricalTrend() {
  return (
    <Card title="Evolucion de Logro Academico" description="Tendencia historica de cumplimiento ABET">
      <ChartContainer config={config} className="h-[300px] w-full mt-4">
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="colorLogro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-logro)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-logro)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis dataKey="ciclo" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="logro"
            stroke="var(--color-logro)"
            fillOpacity={1}
            fill="url(#colorLogro)"
            strokeWidth={3}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
