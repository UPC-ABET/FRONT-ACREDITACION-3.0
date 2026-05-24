'use client'

import React, { useState } from 'react'
import { Tabs } from '@/shared/components'
import { LCFCReports } from './LCFCReports'
import { LCFCNotificationView } from './notifications/LCFCNotificationView'
import { LCFCConfiguration } from './configuration/LCFCConfiguration'

const TABS = [
  { id: 'reports', label: 'Reportes' },
  { id: 'notifications', label: 'Notificaciones' },
  { id: 'config', label: 'Configuración' },
]

export function LCFCManagementView() {
  const [activeTab, setActiveTab] = useState('reports')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">LCFC — Logro de Fin de Ciclo</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gestión de encuestas de Logro de Fin de Ciclo por comisión y período
        </p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="pt-2">
        {activeTab === 'reports' && <LCFCReports />}
        {activeTab === 'notifications' && <LCFCNotificationView />}
        {activeTab === 'config' && <LCFCConfiguration />}
      </div>
    </div>
  )
}
