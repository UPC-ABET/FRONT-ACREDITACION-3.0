'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { getFilesByDirectory } from '../services/s3Service'
import { apiGet, apiPut } from '../services/portfolioApiClient'
import type { PortfolioFileItem } from '../types'

/**
 * Modal "Accesos / Rutas permitidas" — migrado desde ModalAccessRoutes.jsx
 *
 * Endpoints (migrados del frontend antiguo):
 *   GET /usuarios/obtener-conf-portafolio-usuario?escuela=IAM&codigo=...
 *   PUT /usuarios/actualizar-conf-portafolio-usuario?escuela=IAM&codigo=...&configuracion=...
 *
 * NOTA: el frontend antiguo usaba `${API_URL}/api/usuarios/...` (porque su
 * VITE_*_API_URL no incluia /api). El frontend nuevo SI incluye /api en
 * NEXT_PUBLIC_API_URL, por lo que aqui usamos `/usuarios/...` sin prefijo.
 */

interface TreeApiNode extends PortfolioFileItem {
  children?: TreeApiNode[]
  level?: number
}

interface ConfigResponse {
  RUTAS?: string[] | string
  TESTS?: string[] | string
}

interface UsuarioBasic {
  idUsuario: number | string
  codigoDocente: string
  nombre?: string
}

interface ModalAccessRoutesProps {
  isOpen: boolean
  onClose: () => void
  usuario: UsuarioBasic | null
}

function findParentKey(
  nodes: TreeApiNode[],
  childKey: string,
  parentKey: string | null = null
): string | null {
  for (const node of nodes) {
    if (node.key === childKey) return parentKey
    if (node.children && node.children.length > 0) {
      const found = findParentKey(node.children, childKey, node.key)
      if (found !== null) return found
    }
  }
  return null
}

function findNodeByKey(nodes: TreeApiNode[], key: string): TreeApiNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeByKey(node.children, key)
      if (found) return found
    }
  }
  return null
}

function areAllChildrenChecked(node: TreeApiNode, checkedKeys: string[]): boolean {
  if (!node.children || node.children.length === 0) return checkedKeys.includes(node.key)
  return node.children.every((child) => areAllChildrenChecked(child, checkedKeys))
}

function getAllKeys(node: TreeApiNode): string[] {
  let keys = [node.key]
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      keys = keys.concat(getAllKeys(child))
    })
  }
  return keys
}

function updateNodeChildren(
  nodes: TreeApiNode[],
  key: string,
  children: TreeApiNode[]
): TreeApiNode[] {
  return nodes.map((node) => {
    if (node.key === key) return { ...node, children }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNodeChildren(node.children, key, children) }
    }
    return node
  })
}

interface InnerNodeProps {
  node: TreeApiNode
  expanded: Record<string, boolean>
  toggle: (key: string, node: TreeApiNode) => void | Promise<void>
  checkedKeys: string[]
  handleCheck: (node: TreeApiNode, checked: boolean) => void | Promise<void>
}

const InnerTreeNode = memo(function InnerTreeNode({
  node,
  expanded,
  toggle,
  checkedKeys,
  handleCheck,
}: InnerNodeProps) {
  const hasChildren = node.esDirectorio
  const isChecked = checkedKeys.includes(node.key)

  return (
    <li className="mb-2">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => handleCheck(node, !isChecked)}
          className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        {hasChildren && (
          <span
            className="mr-2 cursor-pointer flex items-center justify-center w-6 h-6 rounded bg-red-600 text-white text-sm"
            onClick={() => toggle(node.key, node)}
            style={{ minWidth: 24, minHeight: 24 }}
          >
            {expanded[node.key] ? 'v' : '>'}
          </span>
        )}
        <span className="text-gray-800">{node.name}</span>
      </div>
      {hasChildren && expanded[node.key] && node.children && (
        <ul className="ml-6 list-none">
          {node.children.map((child) => (
            <InnerTreeNode
              key={child.key}
              node={child}
              expanded={expanded}
              toggle={toggle}
              checkedKeys={checkedKeys}
              handleCheck={handleCheck}
            />
          ))}
        </ul>
      )}
    </li>
  )
})

export function ModalAccessRoutes({
  isOpen,
  onClose,
  usuario,
}: ModalAccessRoutesProps) {
  const [carpetas, setCarpetas] = useState<TreeApiNode[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(
    async (key: string, node: TreeApiNode) => {
      if ((node.level ?? 0) >= 2) return
      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
      const childrenArray = Array.isArray(node.children) ? node.children : []
      if (node.esDirectorio && childrenArray.length === 0 && !expanded[key]) {
        const children = (await getFilesByDirectory(node.key)) as TreeApiNode[]
        const childrenWithChildren = children.map((child) => ({
          ...child,
          children: Array.isArray(child.children) ? child.children : [],
          level: (node.level ?? 0) + 1,
        }))
        setCarpetas((prev) => updateNodeChildren(prev, key, childrenWithChildren))
      }
    },
    [expanded]
  )

  const handleCheck = useCallback(
    async (node: TreeApiNode, checked: boolean) => {
      if (node.esDirectorio && (!node.children || node.children.length === 0)) {
        const children = (await getFilesByDirectory(node.key)) as TreeApiNode[]
        const childrenWithChildren: TreeApiNode[] = await Promise.all(
          children.map(async (child) => {
            if (child.esDirectorio) {
              const grandChildren = (await getFilesByDirectory(child.key)) as TreeApiNode[]
              return {
                ...child,
                children: grandChildren,
                level: (node.level ?? 0) + 1,
              }
            }
            return { ...child, children: [], level: (node.level ?? 0) + 1 }
          })
        )
        setCarpetas((prev) => updateNodeChildren(prev, node.key, childrenWithChildren))
        setTimeout(() => {
          void handleCheck({ ...node, children: childrenWithChildren }, checked)
        }, 0)
        return
      }
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (
            child.esDirectorio &&
            (!child.children || child.children.length === 0)
          ) {
            await handleCheck(child, checked)
          }
        }
      }
      const keys = getAllKeys(node)
      setCheckedKeys((prev) => {
        let newChecked = checked
          ? Array.from(new Set([...prev, ...keys]))
          : prev.filter((k) => !keys.includes(k))

        let parentKey = findParentKey(carpetas, node.key)
        while (parentKey) {
          const parentNode = findNodeByKey(carpetas, parentKey)
          if (parentNode) {
            if (areAllChildrenChecked(parentNode, newChecked)) {
              newChecked = Array.from(new Set([...newChecked, parentKey]))
            } else {
              newChecked = newChecked.filter((k) => k !== parentKey)
            }
            parentKey = findParentKey(carpetas, parentKey)
          } else {
            break
          }
        }
        return newChecked
      })
    },
    [carpetas]
  )

  useEffect(() => {
    if (!isOpen || !usuario) return
    let cancelled = false

    async function fetchCarpetasYConfig() {
      const data = (await getFilesByDirectory('')) as TreeApiNode[]
      let carpetasConHijos: TreeApiNode[] = data.map((n) => ({
        ...n,
        children: [],
        level: 0,
      }))

      try {
        const res = await apiGet<ConfigResponse>(
          `/usuarios/obtener-conf-portafolio-usuario?escuela=IAM&codigo=${usuario!.codigoDocente}`
        )
        const config = res?.RUTAS ?? res?.TESTS

        if (!config || config === '/') {
          if (!cancelled) {
            setCarpetas(carpetasConHijos)
            setCheckedKeys([])
          }
          return
        }

        const rutas = Array.isArray(config) ? config : [config]
        let keys: string[] = []

        for (const ruta of rutas) {
          const parts = ruta.replace(/^\/|\/$/g, '').split('/').filter(Boolean)
          let currentNodes = carpetasConHijos
          let currentNode: TreeApiNode | undefined

          for (const part of parts) {
            currentNode = currentNodes.find((n) => n.name === part)
            if (currentNode && currentNode.esDirectorio) {
              if (!currentNode.children || currentNode.children.length === 0) {
                const children = (await getFilesByDirectory(currentNode.key)) as TreeApiNode[]
                currentNode.children = children.map((child) => ({
                  ...child,
                  children: [],
                  level: (currentNode!.level ?? 0) + 1,
                }))
                carpetasConHijos = updateNodeChildren(
                  carpetasConHijos,
                  currentNode.key,
                  currentNode.children
                )
              }
              currentNodes = currentNode.children
            }
          }
          if (currentNode) keys = keys.concat(getAllKeys(currentNode))
        }
        if (!cancelled) {
          setCarpetas(carpetasConHijos)
          setCheckedKeys(keys)
        }
      } catch {
        if (!cancelled) {
          setCarpetas(carpetasConHijos)
          setCheckedKeys([])
        }
      }
    }

    void fetchCarpetasYConfig()
    return () => {
      cancelled = true
    }
  }, [isOpen, usuario])

  function getConfigFromChecked(
    nodes: TreeApiNode[],
    keys: string[]
  ): { RUTAS: string | string[] } {
    const result: string[] = []
    function traverse(node: TreeApiNode, path: string): boolean {
      const isChecked = keys.includes(node.key)
      if (node.esDirectorio) {
        if (isChecked) {
          result.push(path + node.name)
          return true
        }
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child, path + node.name + '/'))
        }
        return false
      }
      if (isChecked) result.push(path + node.name)
      return isChecked
    }
    nodes.forEach((node) => traverse(node, ''))
    if (result.length === 0) return { RUTAS: '/' }
    if (result.length === 1) return { RUTAS: result[0] }
    return { RUTAS: result }
  }

  async function handleAceptar() {
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      const config = getConfigFromChecked(carpetas, checkedKeys)
      await apiPut(
        `/usuarios/actualizar-conf-portafolio-usuario?escuela=IAM&codigo=${
          usuario.codigoDocente
        }&configuracion=${encodeURIComponent(JSON.stringify(config))}`
      )
      onClose()
    } catch {
      setError('Error al guardar la configuracion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ACCESOS DE {usuario?.nombre}</DialogTitle>
        </DialogHeader>

        <ul className="list-none max-h-[60vh] overflow-y-auto">
          {carpetas.map((node) => (
            <InnerTreeNode
              key={node.key}
              node={node}
              expanded={expanded}
              toggle={toggle}
              checkedKeys={checkedKeys}
              handleCheck={handleCheck}
            />
          ))}
        </ul>

        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleAceptar} variant="primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Aceptar'}
          </Button>
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </DialogContent>
    </Dialog>
  )
}

export default ModalAccessRoutes
