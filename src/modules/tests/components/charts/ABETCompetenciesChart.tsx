'use client'
import { Bar, BarChart, XAxis, CartesianGrid, YAxis } from 'recharts'
import {
  Card,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/shared/components/ui'

const data = [
  { outcome: 'SO 1', alcanzado: 85, meta: 75 },
  { outcome: 'SO 2', alcanzado: 72, meta: 75 },
  { outcome: 'SO 3', alcanzado: 90, meta: 75 },
  { outcome: 'SO 4', alcanzado: 78, meta: 75 },
  { outcome: 'SO 5', alcanzado: 88, meta: 75 },
]

const config = {
  alcanzado: { label: '% Alumnos con Logro', color: '#dc2626' },
  meta: { label: 'Meta ABET', color: '#71717a' },
} satisfies ChartConfig

export function ABETCompetenciesChart() {
  return (
    <Card title="Logro de Student Outcomes" description="Porcentaje de alumnos que superan el umbral">
      <ChartContainer config={config} className="h-[300px] w-full mt-4">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis dataKey="outcome" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
          <Bar dataKey="alcanzado" fill="var(--color-alcanzado)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="meta" fill="var(--color-meta)" radius={[4, 4, 0, 0]} fillOpacity={0.3} />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}
