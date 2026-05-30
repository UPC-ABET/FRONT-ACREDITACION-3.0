'use client'

import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/shared/components'
import { useI18n } from '@/providers'

interface BannerScrapingDialogProps {
  open: boolean
  onClose: () => void
  flowDisplayKey: string
  // En New_ABET, este callback dispara el flow real de scraping una vez integrado.
  // Por ahora es stub: muestra animación de progreso + logs y cierra.
  onTrigger: (credentials: { username: string; password: string }) => Promise<void>
}

// Botón "Jalar de Banner/UPlanner" (blueprint §4.2.2):
// modal de credenciales + animación de progreso + logs en tiempo real.
export default function BannerScrapingDialog({ open, onClose, flowDisplayKey, onTrigger }: BannerScrapingDialogProps) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const handleStart = async () => {
    if (!username || !password) return
    setRunning(true)
    setLogs([t('cargasCanvas.banner.log.connecting')])
    try {
      // Hooks de progreso (en New_ABET: WebSocket o SSE del back de scraping).
      setLogs((prev) => [...prev, t('cargasCanvas.banner.log.authenticated')])
      await onTrigger({ username, password })
      setLogs((prev) => [...prev, t('cargasCanvas.banner.log.done')])
      setTimeout(() => {
        setRunning(false)
        onClose()
      }, 800)
    } catch (err) {
      setLogs((prev) => [...prev, `❌ ${err instanceof Error ? err.message : 'error'}`])
      setRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !running) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('cargasCanvas.banner.title')}</DialogTitle>
        </DialogHeader>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {t('cargasCanvas.banner.description')} <span className="font-medium">{t(flowDisplayKey)}</span>.
        </p>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('cargasCanvas.banner.username')} disabled={running} />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('cargasCanvas.banner.password')} disabled={running} />

        {running && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm font-medium text-blue-700">{t('cargasCanvas.banner.running')}</span>
            </div>
            <ul className="space-y-1 text-xs text-blue-800">
              {logs.map((log, i) => (
                <li key={i}>• {log}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={running}>
            {t('cargasCanvas.banner.cancel')}
          </Button>
          <Button variant="primary" onClick={handleStart} disabled={running || !username || !password}>
            {running ? t('cargasCanvas.banner.starting') : t('cargasCanvas.banner.start')}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
