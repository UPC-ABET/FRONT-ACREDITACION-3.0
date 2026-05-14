"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip, Legend } from "recharts"

export type ChartConfig = {
    [key: string]: {
        label?: React.ReactNode
        icon?: React.ComponentType
        color?: string
    }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

// --- Contenedor Principal ---
export function ChartContainer({
                                   config,
                                   children,
                                   className,
                               }: {
    config: ChartConfig
    children: React.ReactElement
    className?: string
}) {
    // Generamos los estilos inyectando las variables de color
    const chartStyles = React.useMemo(() => {
        return Object.entries(config).map(([key, value]) => {
            if (!value.color) return null
            return `--color-${key}: ${value.color};`
        }).join("\n")
    }, [config])

    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    return (
        <ChartContext.Provider value={{ config }}>
            <style dangerouslySetInnerHTML={{ __html: `:root { ${chartStyles} }` }} />
            <div className={`w-full ${className}`}>
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {children}
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full" />
                )}
            </div>
        </ChartContext.Provider>
    )
}

export function ChartTooltipContent({ active, payload, label }: any) {
    if (!active || !payload) return null

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-md">
            <p className="mb-2 text-xs font-bold text-zinc-500 uppercase">{label}</p>
            <div className="space-y-1.5">
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.fill || item.color }}
                        />
                        <span className="text-sm font-medium text-zinc-800">{item.name}:</span>
                        <span className="text-sm font-bold text-zinc-900 ml-auto">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ChartLegendContent({ payload }: any) {
    if (!payload) return null

    return (
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    {/* El circulito de color */}
                    <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    {/* El texto de la configuración */}
                    <span className="text-xs font-medium text-zinc-600">
            {entry.value}
          </span>
                </div>
            ))}
        </div>
    )
}

export const ChartTooltip = Tooltip
export const ChartLegend = Legend

