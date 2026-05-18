'use client'

import { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  LoadingDialog,
} from '@/shared/components/ui'
import { listAllKeys } from '../services/s3Service'
import { TreeNode, type TreeNodeData } from './TreeNode'
import { PrintableTreeNode } from './PrintableTreeNode'

interface TreeViewerModalProps {
  isOpen: boolean
  onClose: () => void
}

function buildTreeFromPaths(paths: string[]): TreeNodeData[] {
  const root: TreeNodeData[] = []

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isFile = !path.endsWith('/') && i === parts.length - 1

      let existing = current.find((item) => item.name === name)

      if (!existing) {
        existing = {
          name,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        }
        current.push(existing)
      }

      if (!isFile && existing.children) {
        current = existing.children
      }
    }
  }

  return root
}

/**
 * Modal visor del arbol completo del portafolio.
 * Permite expandir/colapsar por nivel e imprimir la estructura.
 */
export function TreeViewerModal({ isOpen, onClose }: TreeViewerModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [treeData, setTreeData] = useState<TreeNodeData[]>([])
  const [readyToOpen, setReadyToOpen] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [currentLevel, setCurrentLevel] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const keys = await listAllKeys()
        const tree = buildTreeFromPaths(keys)
        setTreeData(tree)
        setReadyToOpen(true)
      } catch (error) {
        console.error('Error TreeViewerModal:', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (isOpen) void fetchData()
  }, [isOpen])

  const expandNextLevel = useCallback(() => {
    const newKeys = new Set(expandedKeys)

    const expandAtLevel = (nodes: TreeNodeData[], level: number, path = '') => {
      for (const node of nodes) {
        const currentPath = path ? `${path}/${node.name}` : node.name
        if (node.type === 'folder') {
          if (level === 0) newKeys.add(currentPath)
          else if (node.children) expandAtLevel(node.children, level - 1, currentPath)
        }
      }
    }

    expandAtLevel(treeData, currentLevel)
    setExpandedKeys([...newKeys])
    setCurrentLevel((prev) => prev + 1)
  }, [expandedKeys, treeData, currentLevel])

  const collapseCurrentLevel = useCallback(() => {
    const newKeys = new Set(expandedKeys)

    const collapseAtLevel = (nodes: TreeNodeData[], level: number, path = '') => {
      for (const node of nodes) {
        const currentPath = path ? `${path}/${node.name}` : node.name
        if (node.type === 'folder') {
          if (level === currentLevel - 1) newKeys.delete(currentPath)
          else if (node.children) collapseAtLevel(node.children, level + 1, currentPath)
        }
      }
    }

    collapseAtLevel(treeData, 0)
    setExpandedKeys([...newKeys])
    setCurrentLevel((prev) => (prev > 0 ? prev - 1 : 0))
  }, [expandedKeys, treeData, currentLevel])

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Vista del Arbol</title>
          <style>
            body { font-family: monospace; white-space: pre; padding: 20px; }
          </style>
        </head>
        <body><div id="print-content"></div></body>
      </html>
    `)
    printWindow.document.close()

    setTimeout(() => {
      const container = printWindow.document.getElementById('print-content')
      if (!container) return
      const root = createRoot(container)
      root.render(
        <>
          <h2>Estructura del Portafolio</h2>
          {treeData.map((node, idx) => (
            <PrintableTreeNode
              key={idx}
              node={node}
              expandedKeys={expandedKeys}
            />
          ))}
        </>
      )
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }, 500)
    }, 300)
  }, [treeData, expandedKeys])

  if (isLoading) return <LoadingDialog isOpen={isLoading} />
  if (!readyToOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-4xl" showCloseButton={false}>
        <div className="border-b border-gray-300 flex justify-between items-center mb-4 pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Estructura del portafolio
          </DialogTitle>
          <button
            type="button"
            className="rounded-md bg-white text-gray-900 hover:text-gray-500 hover:bg-gray-200 p-1"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex space-x-2 mb-2">
          <button
            onClick={expandNextLevel}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
          >
            Abrir siguiente nivel
          </button>
          <button
            onClick={collapseCurrentLevel}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
          >
            Cerrar nivel actual
          </button>
          <button
            onClick={handlePrint}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
          >
            Imprimir estructura
          </button>
        </div>

        <div id="printable-tree" className="max-h-[500px] overflow-y-auto">
          {treeData.map((node, idx) => (
            <TreeNode
              key={idx}
              node={node}
              path=""
              expandedKeys={expandedKeys}
              setExpandedKeys={setExpandedKeys}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TreeViewerModal
