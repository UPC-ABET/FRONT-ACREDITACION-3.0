'use client'

import { Card, Button } from '@/shared/components'
import { useI18n } from '@/providers'
import { useUploadHistory } from '../hooks'
import type { UploadLog, UploadLogFilters } from '../types'

interface UploadHistoryTableProps {
  filters?: UploadLogFilters
  onRollback?: (log: UploadLog) => void
  onViewErrors?: (log: UploadLog) => void
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  ROLLED_BACK: 'bg-gray-100 text-gray-600',
}

// Tabla de historial cronológico (blueprint §4.3.1).
export default function UploadHistoryTable({ filters, onRollback, onViewErrors }: UploadHistoryTableProps) {
  const { t } = useI18n()
  const { data: logs, isLoading, error } = useUploadHistory(filters ?? {})

  return (
    <Card title={t('uploadHistory.table.title')} description={t('uploadHistory.table.description')}>
      {isLoading && <p className="py-4 text-sm text-gray-500">{t('uploadHistory.table.loading')}</p>}
      {error && <p className="py-4 text-sm text-red-600">{error.message}</p>}

      {!isLoading && (logs?.length ?? 0) === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">{t('uploadHistory.table.empty')}</p>
      )}

      {(logs?.length ?? 0) > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">{t('uploadHistory.table.col.id')}</th>
                <th className="py-2">{t('uploadHistory.table.col.type')}</th>
                <th className="py-2">{t('uploadHistory.table.col.status')}</th>
                <th className="py-2">{t('uploadHistory.table.col.file')}</th>
                <th className="py-2 text-right">{t('uploadHistory.table.col.rows')}</th>
                <th className="py-2">{t('uploadHistory.table.col.date')}</th>
                <th className="py-2 text-right">{t('uploadHistory.table.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-2 font-mono text-xs text-gray-500">#{log.id}</td>
                  <td className="py-2 font-medium text-gray-800">{log.upload_type}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 max-w-[200px] truncate text-xs text-gray-600">{log.source_file ?? '—'}</td>
                  <td className="py-2 text-right text-xs">
                    {log.loaded_rows ?? 0} / {log.total_rows ?? 0}
                    {log.error_rows ? <span className="ml-1 text-red-600">({log.error_rows})</span> : null}
                  </td>
                  <td className="py-2 text-xs text-gray-500">{log.created_at?.slice(0, 19).replace('T', ' ')}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {log.error_rows ? (
                        <Button variant="secondary" onClick={() => onViewErrors?.(log)}>
                          {t('uploadHistory.table.viewErrors')}
                        </Button>
                      ) : null}
                      {log.status === 'COMPLETED' && (
                        <Button variant="secondary" onClick={() => onRollback?.(log)}>
                          ↶ {t('uploadHistory.table.rollback')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
