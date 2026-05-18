'use client'

import { Dispatch, SetStateAction } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

export interface TreeNodeData {
  name: string
  type: 'folder' | 'file'
  children?: TreeNodeData[]
}

interface TreeNodeProps {
  node: TreeNodeData
  path?: string
  expandedKeys: string[]
  setExpandedKeys: Dispatch<SetStateAction<string[]>>
}

export function TreeNode({
  node,
  path = '',
  expandedKeys,
  setExpandedKeys,
}: TreeNodeProps) {
  const currentPath = path ? `${path}/${node.name}` : node.name
  const isOpen = expandedKeys.includes(currentPath)
  const hasChildren = !!node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const isEmptyFolder = isFolder && !hasChildren
  const Icon = isFolder ? FolderIcon : DocumentIcon

  const folderCount = hasChildren
    ? node.children!.filter((c) => c.type === 'folder').length
    : 0
  const fileCount = hasChildren
    ? node.children!.filter((c) => c.type === 'file').length
    : 0

  const toggle = () => {
    if (!hasChildren) return
    if (isOpen) {
      setExpandedKeys((prev) => prev.filter((k) => k !== currentPath))
    } else {
      setExpandedKeys((prev) => [...prev, currentPath])
    }
  }

  return (
    <div className="ml-4 my-1">
      <div
        className="flex items-center space-x-1 cursor-pointer"
        onClick={toggle}
      >
        {hasChildren &&
          (isOpen ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          ))}
        <Icon
          className={`h-5 w-5 ${
            isEmptyFolder ? 'text-red-500' : 'text-gray-600'
          }`}
        />
        <span
          className={`${isFolder ? 'font-semibold' : ''} ${
            isEmptyFolder ? 'text-red-600' : ''
          }`}
        >
          {node.name}
          {isFolder && hasChildren && (
            <span className="ml-1 text-sm text-gray-500">
              ({folderCount} carpetas, {fileCount} archivos)
            </span>
          )}
        </span>
      </div>

      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNode
              key={idx}
              node={child}
              path={currentPath}
              expandedKeys={expandedKeys}
              setExpandedKeys={setExpandedKeys}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TreeNode
