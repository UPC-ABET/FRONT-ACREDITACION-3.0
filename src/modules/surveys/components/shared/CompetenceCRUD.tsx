'use client'

import React, { useEffect, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  DataTable,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  TextArea,
  Toast,
} from '@/shared/components'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { CompetenceConfig, CompetenceFormData } from '../../types'

interface CompetenceCRUDProps {
  cycleId: number
  competences: CompetenceConfig[]
  loading: boolean
  error: string | null
  onLoad: (cycleId: number) => void
  onSave: (data: CompetenceFormData, onSuccess: () => void) => void
  onDelete: (id: number, onSuccess: () => void) => void
  onClone?: (
    params: {
      idCarreraOrigen: number
      idPeriodoOrigen: number
      idCarreraDestino: number
      idPeriodoDestino: number
    },
    onSuccess: () => void
  ) => void
  showCloneOption?: boolean
}

const EMPTY_FORM: Omit<CompetenceFormData, 'idPeriodoAcademico' | 'escuela'> = {
  id: 0,
  competenciaGeneral: '',
  competenciaEspecifica: '',
  descripcion: '',
  nivelAceptacion: 3,
}

export function CompetenceCRUD({
  cycleId,
  competences,
  loading,
  error,
  onLoad,
  onSave,
  onDelete,
}: CompetenceCRUDProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false,
    type: 'success',
    msg: '',
  })

  useEffect(() => {
    if (cycleId) onLoad(cycleId)
  }, [cycleId, onLoad])

  function openAdd() {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(row: CompetenceConfig) {
    setForm({
      id: row.id,
      competenciaGeneral: row.competenciaGeneral,
      competenciaEspecifica: row.competenciaEspecifica,
      descripcion: row.descripcion,
      nivelAceptacion: row.nivelAceptacion,
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.competenciaGeneral.trim() || !form.descripcion.trim()) {
      setToast({ open: true, type: 'error', msg: 'Competencia y descripción son obligatorios.' })
      return
    }
    setSaving(true)
    onSave(
      { ...form, idPeriodoAcademico: cycleId, escuela: '1' },
      () => {
        setSaving(false)
        setModalOpen(false)
        setToast({ open: true, type: 'success', msg: 'Competencia guardada exitosamente.' })
        onLoad(cycleId)
      }
    )
    setSaving(false)
  }

  function handleDelete(id: number) {
    onDelete(id, () => {
      setDeleteId(null)
      setToast({ open: true, type: 'success', msg: 'Competencia eliminada.' })
      onLoad(cycleId)
    })
  }

  const columns: ColumnDef<CompetenceConfig>[] = [
    {
      accessorKey: 'competenciaGeneral',
      header: 'Competencia General',
    },
    {
      accessorKey: 'competenciaEspecifica',
      header: 'Competencia Específica',
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ getValue }) => (
        <span className="max-w-xs block truncate">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'nivelAceptacion',
      header: 'Nivel',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
          {getValue() as number}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="surface"
            onClick={() => openEdit(row.original)}
            aria-label="Editar"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="warning"
            onClick={() => setDeleteId(row.original.id)}
            aria-label="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <DataTable
        columns={columns}
        data={competences}
        title="Competencias"
        actions={[
          {
            label: 'Agregar Competencia',
            onClick: openAdd,
            icon: <PlusIcon className="h-4 w-4" />,
          },
        ]}
      />

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id === 0 ? 'Agregar Competencia' : 'Editar Competencia'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              label="Competencia General"
              value={form.competenciaGeneral}
              onChange={(e) => setForm({ ...form, competenciaGeneral: e.target.value })}
              placeholder="Ej: Pensamiento Crítico"
            />
            <Input
              label="Competencia Específica"
              value={form.competenciaEspecifica}
              onChange={(e) => setForm({ ...form, competenciaEspecifica: e.target.value })}
              placeholder="Ej: Análisis de Problemas"
            />
            <TextArea
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Describe la competencia..."
              rows={3}
            />
            <div>
              <label className="font-medium text-xs mb-2 text-zinc-700 block">
                Nivel de Aceptación (1–5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.nivelAceptacion}
                onChange={(e) =>
                  setForm({ ...form, nivelAceptacion: Math.min(5, Math.max(1, Number(e.target.value))) })
                }
                className="w-24 h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 py-2">
            ¿Estás seguro de que deseas eliminar esta competencia? Esta acción no se puede deshacer.
          </p>
          <DialogFooter showCloseButton>
            <Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}
