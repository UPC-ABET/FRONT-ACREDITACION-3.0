'use client'
import { Pie, PieChart, Cell } from 'recharts'
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
  { status: 'Sustentado', count: 45, fill: '#dc2626' },
  { status: 'En Proceso', count: 25, fill: '#ef4444' },
  { status: 'Pendiente', count: 10, fill: '#d4d4d8' },
]

const config = {
  Sustentado: { label: 'Proyectos Sustentados', color: '#dc2626' },
  'En Proceso': { label: 'En Desarrollo', color: '#ef4444' },
  Pendiente: { label: 'Por Iniciar', color: '#d4d4d8' },
} satisfies ChartConfig

export function ABETGraduationPie() {
  return (
    <Card title="Estatus de Capstone Project" description="Distribucion de proyectos presentados">
      <ChartContainer config={config} className="h-[300px] w-full mt-4">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={80} paddingAngle={5}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </Card>
  )
}
