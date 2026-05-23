'use client'

import { useEffect, useState } from 'react'
import { FolderIcon } from '@heroicons/react/20/solid'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  WarningDialog,
} from '@/shared/components/ui'
import { getFilesByDirectory } from '../services/s3Service'
import { PortfolioBreadcrumbs } from './PortfolioBreadcrumbs'
import type { PortfolioFileItem, PortfolioRouteItem } from '../types'

interface DocsMoveMap {
  size: number
  documentos: Record<number, { key: string; name: string }>
}

interface ModalFileProps {
  routerPrev: PortfolioRouteItem[]
  docsMove: DocsMoveMap
  handleCloseModal: () => void
  onHandleEvent: (
    type: 'mover',
    rname: null,
    listToMove: Array<{ key: string; name: string }>,
    dirMove: string,
    directorios: PortfolioFileItem[]
  ) => void
}

/**
 * Modal "Mover a otra ubicacion" — migrado desde ModalFile.jsx.
 * Permite navegar el arbol y seleccionar carpeta destino.
 */
export function ModalFile({
  routerPrev,
  docsMove,
  handleCloseModal,
  onHandleEvent,
}: ModalFileProps) {
  const initRouter = routerPrev[routerPrev.length - 1]
  const [router, setRouter] = useState<PortfolioRouteItem[]>(routerPrev)
  const [documentos, setDocumentos] = useState<PortfolioFileItem[]>([])
  const [hasFolders, setHasFolders] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const route = router[router.length - 1]

    async function load() {
      const directorios = await getFilesByDirectory(route.dir)
      if (cancelled) return
      setHasFolders(directorios.some((d) => d.esDirectorio))

      const docsMoveArray = Array.from(
        { length: docsMove.size },
        (_, i) => docsMove.documentos[i]
      )
      const dirFolders = directorios.filter((doc) => doc.esDirectorio)
      const docsMoveFiles = docsMoveArray.filter(
        (doc) => doc.key[doc.key.length - 1] === '/'
      )

      const notSelect: PortfolioFileItem[] = []
      if (docsMoveFiles.length === 0) {
        notSelect.push(...dirFolders)
      } else {
        dirFolders.forEach((file) => {
          if (!docsMoveFiles.some((d) => d.name === file.name)) {
            notSelect.push(file)
          }
        })
      }
      if (!cancelled) setDocumentos(notSelect)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router, docsMove])

  const handleClickDocumento = (
    documento: Pick<PortfolioFileItem, 'name' | 'esDirectorio'> & { dir: string; directorio: boolean },
    index?: number
  ) => {
    if (!documento.directorio) return

    if (index !== undefined) {
      setRouter(router.slice(0, index + 1))
    } else {
      setRouter([...router, { name: documento.name, dir: documento.dir }])
    }
  }

  function handleMove() {
    const route = router[router.length - 1]
    const docsMoveArray = Array.from({ length: docsMove.size }, (_, i) => docsMove.documentos[i])

    if (initRouter.dir === route.dir) {
      setWarningOpen(true)
      return
    }
    onHandleEvent('mover', null, docsMoveArray, route.dir, documentos)
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Mover :{' '}
              {docsMove.size === 1
                ? docsMove.documentos[0].name
                : `(${docsMove.size}) archivos seleccionados`}
            </DialogTitle>
          </DialogHeader>

          <div>
            <PortfolioBreadcrumbs
              pages={router}
              onHandleClickDocument={handleClickDocumento}
            />
          </div>

          <div>
            {hasFolders ? (
              <div className="col-span-1 text-left text-sm font-semibold text-zinc-900">
                Seleccione carpeta donde desea mover
                {docsMove.size === 1 ? ' el archivo' : ' los archivos'}:
              </div>
            ) : (
              <p className="col-span-1 text-left text-sm font-semibold text-zinc-900">
                No hay carpetas
              </p>
            )}
            <ul className="mt-2 max-h-[40vh] overflow-y-auto">
              {documentos.map((documento, index) => (
                <li
                  key={`${documento.key}-${index}`}
                  className="flex items-center cursor-pointer font-bold py-1 hover:bg-zinc-50 rounded"
                  onClick={() =>
                    handleClickDocumento(
                      {
                        name: documento.name,
                        dir: documento.key,
                        directorio: documento.esDirectorio,
                        esDirectorio: documento.esDirectorio,
                      },
                      undefined
                    )
                  }
                >
                  <FolderIcon className="h-5 w-7 text-gray-400" aria-hidden="true" />
                  {documento.name.toUpperCase()}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-row-reverse gap-3 mt-2">
            <Button onClick={handleMove} variant="primary">
              Mover
            </Button>
            <Button onClick={handleCloseModal} variant="secondary">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WarningDialog
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        title="Movimiento no permitido"
        message="No se puede mover en la misma ruta."
        onConfirm={() => setWarningOpen(false)}
      />
    </>
  )
}

export default ModalFile
