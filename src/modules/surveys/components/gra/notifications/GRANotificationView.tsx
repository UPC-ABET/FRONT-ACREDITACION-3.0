'use client'

import React, { useState } from 'react'
import { Tabs } from '@/shared/components'
import { AddStudentPanel } from './AddStudentPanel'
import { StudentList } from './StudentList'
import { EditEmailTemplate } from './EditEmailTemplate'
import { FileUploadPanel } from '../../shared/FileUploadPanel'
import { useGRAUpload } from '../../../hooks'

const NOTIFICATION_TABS = [
  { id: 'list', label: 'Estudiantes Notificados' },
  { id: 'add', label: 'Agregar Estudiante' },
  { id: 'upload', label: 'Carga Masiva' },
  { id: 'email', label: 'Plantilla de Correo' },
]

interface GRANotificationViewProps {
  idEncuesta?: number
}

export function GRANotificationView({ idEncuesta = 0 }: GRANotificationViewProps) {
  const [activeTab, setActiveTab] = useState('list')
  const { loading, error, success, downloadTemplate, upload, reset } = useGRAUpload()

  return (
    <div className="space-y-6">
      <Tabs tabs={NOTIFICATION_TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="pt-2">
        {activeTab === 'list' && <StudentList idEncuesta={idEncuesta} />}

        {activeTab === 'add' && (
          <AddStudentPanel
            idEncuesta={idEncuesta}
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
              onDownloadTemplate={() => downloadTemplate(0)}
              downloadLabel="Descargar Plantilla GRA"
            />
          </div>
        )}

        {activeTab === 'email' && (
          <div className="max-w-lg">
            <EditEmailTemplate idEncuesta={idEncuesta} />
          </div>
        )}
      </div>
    </div>
  )
}
