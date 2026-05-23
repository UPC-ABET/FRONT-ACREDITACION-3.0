'use client'

import React, { useEffect, useState } from 'react'
import { Select, Tabs } from '@/shared/components'
import { AddStudentPanel } from './AddStudentPanel'
import { StudentList } from './StudentList'
import { EditEmailTemplate } from './EditEmailTemplate'
import { FileUploadPanel } from '../../shared/FileUploadPanel'
import { useGRAUpload, useGRACycles } from '../../../hooks'
import { useABET } from '@/providers'

const NOTIFICATION_TABS = [
  { id: 'list', label: 'Estudiantes Notificados' },
  { id: 'add', label: 'Agregar Estudiante' },
  { id: 'upload', label: 'Carga Masiva' },
  { id: 'email', label: 'Plantilla de Correo' },
]

export function GRANotificationView() {
  const { modalityTypeId } = useABET()
  const { cycles, load: loadCycles } = useGRACycles()
  const [activeTab, setActiveTab] = useState('list')
  const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null)
  const { loading, error, success, downloadTemplate, upload, reset } = useGRAUpload()

  useEffect(() => { loadCycles(modalityTypeId) }, [modalityTypeId, loadCycles])

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))
  const academicPeriodId = selectedCycle?.value ?? 0
  const programId = 0

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <Select
          label="Período académico"
          options={cycleOptions}
          value={selectedCycle}
          onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
          placeholder="Selecciona un período"
          isSearchable
        />
      </div>

      {selectedCycle && (
        <>
          <Tabs tabs={NOTIFICATION_TABS} activeTab={activeTab} onChange={setActiveTab} />

          <div className="pt-2">
            {activeTab === 'list' && (
              <StudentList programId={programId} academicPeriodId={academicPeriodId} />
            )}

            {activeTab === 'add' && (
              <AddStudentPanel
                programId={programId}
                academicPeriodId={academicPeriodId}
                onStudentAdded={() => setActiveTab('list')}
              />
            )}

            {activeTab === 'upload' && (
              <div className="max-w-lg">
                <FileUploadPanel
                  title="Carga masiva de estudiantes GRA"
                  description="Sube un archivo Excel con los datos de los estudiantes a notificar."
                  uploading={loading}
                  success={success}
                  error={error}
                  onUpload={upload}
                  onDownloadTemplate={() => downloadTemplate(academicPeriodId)}
                  downloadLabel="Descargar Plantilla GRA"
                />
              </div>
            )}

            {activeTab === 'email' && (
              <div className="max-w-lg">
                <EditEmailTemplate idEncuesta={academicPeriodId} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
