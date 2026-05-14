'use client'
import * as React from "react"
import { useI18n } from '@/providers'

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    ariaLabel?: string;
}

function Tabs({ tabs, activeTab, onChange, ariaLabel }: TabsProps) {
    const { t } = useI18n()
    const resolvedLabel = ariaLabel ?? t('tabs.label')

    return (
        <div className="border-b border-zinc-200">
            <nav className="-mb-px flex space-x-8" aria-label={resolvedLabel}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all
              ${activeTab === tab.id
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    )
}

export {Tabs}
