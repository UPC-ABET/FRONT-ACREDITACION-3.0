'use client'

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components'
import { useI18n } from '@/providers'
import type { UploadLog } from '../types'

// Local interpolation helper: develop's t(key) returns a plain string (no placeholders),
// so we substitute {param} tokens client-side.
const interpolate = (tpl: string, params: Record<string, string | number>): string =>
  Object.entries(params).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tpl)

interface RollbackConfirmDialogProps {
  log: UploadLog | null
  open: boolean
  onClose: () => void
  onConfirm: (log: UploadLog) => Promise<void>
  loading?: boolean
}

// Modal de confirmación (blueprint §4.3.3) — advertencia de impacto irreversible.
export default function RollbackConfirmDialog({ log, open, onClose, onConfirm, loading }: RollbackConfirmDialogProps) {
  const { t } = useI18n()
  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('uploadHistory.rollback.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠️ {interpolate(t('uploadHistory.rollback.warning'), { type: log.upload_type, id: String(log.id) })}
          </div>
          <p className="text-sm text-gray-600">{t('uploadHistory.rollback.confirmation')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {t('uploadHistory.rollback.cancel')}
            </Button>
            <Button variant="primary" onClick={() => onConfirm(log)} disabled={loading}>
              {loading ? t('uploadHistory.rollback.running') : t('uploadHistory.rollback.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
