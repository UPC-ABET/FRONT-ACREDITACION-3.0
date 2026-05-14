'use client'

import {useMemo} from 'react'
import {Card, DataTable} from '@/shared/components'
import {PlusIcon} from '@heroicons/react/24/outline'
import {type Alumno, columns} from '@/modules/tests/components'

export default function TablesPage() {
    const handleNew = () => {}

    const allData = [
        { id: 1, nombre: 'Juan Perez', curso: 'Matematica', nota: 15, aprobado: true, fecha: '10/03/2026' },
        { id: 2, nombre: 'Maria Lopez', curso: 'Comunicacion', nota: 11, aprobado: true, fecha: '12/03/2026' },
        { id: 3, nombre: 'Carlos Ramos', curso: 'Historia', nota: 9, aprobado: false, fecha: '15/03/2026' },
        { id: 4, nombre: 'Ana Torres', curso: 'Matematica', nota: 18, aprobado: true, fecha: '18/03/2026' },
        { id: 5, nombre: 'Luis Garcia', curso: 'Comunicacion', nota: 7, aprobado: false, fecha: '20/03/2026' },
    ]

    const data = useMemo(() => allData, [])

    return (
        <div className="space-y-6">
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" />

                <DataTable<Alumno, unknown>
                    columns={columns}
                    data={data as Alumno[]}
                    showSearch={true}
                    showPagination={true}
                    actions={[
                        {
                            label: 'Nuevo',
                            onClick: handleNew,
                            icon: <PlusIcon className="h-4 w-4" /> as React.ReactNode,
                        },
                    ]}

                />
            </Card>
        </div>
    )
}
