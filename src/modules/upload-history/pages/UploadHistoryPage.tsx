'use client'

import { useState } from 'react'
import { useI18n } from '@/providers'
import { UploadHistoryTable, RollbackConfirmDialog, ErrorsDrawer } from '../components'
import type { UploadLog } from '../types'

interface UploadHistoryPageProps {
  // Dispatch al endpoint de rollback del flow correspondiente. La página no conoce los
  // 12 endpoints — recibe un mapeo desde fuera. En New_ABET:
  //   { SECCION: rollbackSectionsUpload, DOCENTE: rollbackProfessorsUpload, ... }
  rollbackByUploadType: Record<string, (uploadLogId: number) => Promise<{ success: boolean }>>
}

// Vista 4.3 — bandeja interactiva de errores + historial de rollbacks.
export default function UploadHistoryPage({ rollbackByUploadType }: UploadHistoryPageProps) {
  const { t } = useI18n()
  const [confirmLog, setConfirmLog] = useState<UploadLog | null>(null)
  const [errorsLog, setErrorsLog] = useState<UploadLog | null>(null)
  const [rolling, setRolling] = useState(false)

  const handleConfirm = async (log: UploadLog) => {
    const fn = rollbackByUploadType[log.upload_type]
    if (!fn) {
      setConfirmLog(null)
      return
    }
    setRolling(true)
    try {
      await fn(log.id)
      setConfirmLog(null)
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{t('uploadHistory.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('uploadHistory.subtitle')}</p>
      </header>

      <UploadHistoryTable
        onRollback={(log) => setConfirmLog(log)}
        onViewErrors={(log) => setErrorsLog(log)}
      />

      <RollbackConfirmDialog
        log={confirmLog}
        open={confirmLog !== null}
        onClose={() => setConfirmLog(null)}
        onConfirm={handleConfirm}
        loading={rolling}
      />

      {/*
        Drawer de errores: en este module no persistimos el Excel anotado (el back no lo guarda),
        por lo que `excelBase64=null` por defecto. El drawer se vuelve útil cuando se invoca DESDE
        la canvas de carga (vista 4.2) con el `excelWithErrors` recién devuelto por el service.
        Aquí queda renderizado para reusar el componente en ese caso desde fuera del módulo.
      */}
      <ErrorsDrawer open={errorsLog !== null} onClose={() => setErrorsLog(null)} excelBase64={null} />
    </div>
  )
}
