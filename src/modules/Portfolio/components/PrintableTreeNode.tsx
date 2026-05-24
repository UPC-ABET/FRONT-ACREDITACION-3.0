'use client'

import type { TreeNodeData } from './TreeNode'

interface PrintableTreeNodeProps {
  node: TreeNodeData
  level?: number
  expandedKeys: string[]
  path?: string
}

export function PrintableTreeNode({
  node,
  level = 0,
  expandedKeys,
  path = '',
}: PrintableTreeNodeProps) {
  const currentPath = path ? `${path}/${node.name}` : node.name
  const isOpen = expandedKeys.includes(currentPath)
  const hasChildren = !!node.children && node.children.length > 0
  const icon = node.type === 'folder' ? '[D]' : '[F]'
  const indent = '|   '.repeat(level)

  const folderCount = hasChildren
    ? node.children!.filter((child) => child.type === 'folder').length
    : 0
  const fileCount = hasChildren
    ? node.children!.filter((child) => child.type === 'file').length
    : 0

  return (
    <>
      <div>
        {indent}
        {icon} {node.name}
        {node.type === 'folder' && hasChildren && ` (${folderCount} carpetas, ${fileCount} archivos)`}
      </div>
      {isOpen &&
        hasChildren &&
        node.children!.map((child, idx) => (
          <PrintableTreeNode
            key={idx}
            node={child}
            path={currentPath}
            expandedKeys={expandedKeys}
            level={level + 1}
          />
        ))}
    </>
  )
}

export default PrintableTreeNode
