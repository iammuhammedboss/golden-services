'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  MoreVertical,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { AddObjectDialog } from './add-object-dialog'
import { useDrag, useDrop, DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { getEmptyImage } from 'react-dnd-html5-backend'

const DND_ITEM_TYPE = 'TREE_NODE'

interface MeasurementObject {
  id: string
  name: string
  type: string
  quantity: number
  sortOrder: number
  parentId: string | null
  children?: MeasurementObject[]
  itemMaster?: {
    id: string
    name: string
    category: string
  } | null
  stains?: any[]
  areasOfNotice?: any[]
  media?: any[]
}

interface TreeNodeProps {
  node: MeasurementObject
  measurementId: string
  level: number
  isSelected: boolean
  selectedNode: MeasurementObject | null
  isExpanded: (nodeId: string) => boolean
  onSelect: (node: MeasurementObject) => void
  onRefresh: () => void
  onMove: (
    draggedId: string,
    dropTargetId: string,
    position: 'top' | 'bottom' | 'middle'
  ) => void
  onToggleExpand: (nodeId: string) => void
}

function DraggableTreeNode({
  node,
  measurementId,
  level,
  isSelected,
  selectedNode,
  isExpanded,
  onSelect,
  onRefresh,
  onMove,
  onToggleExpand,
}: TreeNodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'middle' | null>(null)

  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_ITEM_TYPE,
    item: { id: node.id, parentId: node.parentId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    hover(item: { id: string }, monitor) {
      if (!ref.current) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      if (hoverClientY < hoverMiddleY / 2) {
        setDropPosition('top')
      } else if (hoverClientY > hoverMiddleY + hoverMiddleY / 2) {
        setDropPosition('bottom')
      } else {
        setDropPosition('middle')
      }
    },
    drop(item: { id: string }) {
      if (dropPosition) {
        onMove(item.id, node.id, dropPosition)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })
  
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  drag(drop(ref))
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const countChildren = (n: MeasurementObject): number => {
    if (!n.children || n.children.length === 0) {
      return 0
    }
    return n.children.length + n.children.reduce((acc, child) => acc + countChildren(child), 0)
  }

  const handleDelete = async () => {
    const childCount = countChildren(node)
    const confirmationMessage = `Are you sure you want to delete "${node.name}"` + 
      (childCount > 0 ? ` and its ${childCount} child/children?` : '?')

    if (!confirm(confirmationMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/measurements/${measurementId}/objects/${node.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting object:', error)
      alert('Failed to delete object')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (includeChildren: boolean) => {
    setIsDuplicating(true)
    try {
      const response = await fetch(
        `/api/measurements/${measurementId}/objects/${node.id}/duplicate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includeChildren }),
        }
      )

      if (response.ok) {
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Failed to duplicate: ${error.error}`)
      }
    } catch (error) {
      console.error('Error duplicating object:', error)
      alert('Failed to duplicate object')
    } finally {
      setIsDuplicating(false)
    }
  }


  const hasChildren = node.children && node.children.length > 0

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} className="relative">
      {dropPosition === 'top' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />}
      {dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />}
      {dropPosition === 'middle' && <div className="absolute inset-0 border-2 border-primary rounded-md z-10" />}
      
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer group',
          isSelected && 'bg-accent',
          `ml-${level * 4}`
        )}
        onClick={() => onSelect(node)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(node.id)
          }}
          className="p-0.5 hover:bg-accent-foreground/10 rounded"
        >
          {hasChildren ? (
            isExpanded(node.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{node.name}</div>
          {/* ... info ... */}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
         <AddObjectDialog
            measurementId={measurementId}
            parentObjectId={node.id}
            onSuccess={onRefresh}
          >
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </AddObjectDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDuplicate(false)} disabled={isDuplicating}>
                <Copy className="h-4 w-4 mr-2" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate Item Only'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(true)} disabled={isDuplicating}>
                <Copy className="h-4 w-4 mr-2" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate Subtree'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded(node.id) && (
        <div className="ml-2">
          {node.children!.sort((a,b) => a.sortOrder - b.sortOrder).map((child) => (
            <DraggableTreeNode
              key={child.id}
              node={child}
              measurementId={measurementId}
              level={level + 1}
              isSelected={selectedNode?.id === child.id}
              selectedNode={selectedNode}
              isExpanded={isExpanded}
              onSelect={onSelect}
              onRefresh={onRefresh}
              onMove={onMove}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ... RealMeasurementTreeView and MeasurementTreeView are the same
// ...
interface MeasurementTreeViewProps {
  measurementId: string
  tree: MeasurementObject[]
  selectedNode: MeasurementObject | null
  onSelectNode: (node: MeasurementObject | null) => void
  onRefresh: () => void
  isLoading?: boolean
  error?: string | null
}

function RealMeasurementTreeView({
  measurementId,
  tree,
  selectedNode,
  onSelectNode,
  onRefresh,
  isLoading = false,
  error = null,
}: MeasurementTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const isExpanded = (nodeId: string) => !!expandedNodes[nodeId]

  useEffect(() => {
    const savedState = localStorage.getItem(`expandedNodes_${measurementId}`)
    if (savedState) {
      setExpandedNodes(JSON.parse(savedState))
    }
  }, [measurementId])

  const handleToggleExpand = (nodeId: string) => {
    const newState = { ...expandedNodes, [nodeId]: !expandedNodes[nodeId] }
    setExpandedNodes(newState)
    localStorage.setItem(`expandedNodes_${measurementId}`, JSON.stringify(newState))
  }

  const findNode = useCallback((nodes: MeasurementObject[], id: string): MeasurementObject | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }, [])

  const handleMoveNode = async (
    draggedId: string,
    dropTargetId: string,
    position: 'top' | 'bottom' | 'middle'
  ) => {
    const draggedNode = findNode(tree, draggedId)
    const dropTargetNode = findNode(tree, dropTargetId)

    if (!draggedNode || !dropTargetNode) return

    let targetParentId = dropTargetNode.parentId
    let newSortOrder = dropTargetNode.sortOrder

    if (position === 'middle') {
      targetParentId = dropTargetNode.id
      newSortOrder = 0 // Or handle logic to append at the end
    } else if (position === 'bottom') {
      newSortOrder = dropTargetNode.sortOrder + 1
    }
    
    try {
      const response = await fetch(
        `/api/measurements/${measurementId}/objects/${draggedId}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetParentId, newSortOrder }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to move item')
      }

      onRefresh()
    } catch (error) {
      console.error('Error moving node:', error)
      alert(error instanceof Error ? error.message : 'Failed to move node')
    }
  }

  const renderNode = (node: MeasurementObject, level: number) => (
    <DraggableTreeNode
      key={node.id}
      node={node}
      measurementId={measurementId}
      level={level}
      isSelected={selectedNode?.id === node.id}
      selectedNode={selectedNode}
      isExpanded={isExpanded}
      onSelect={onSelectNode}
      onRefresh={onRefresh}
      onMove={handleMoveNode}
      onToggleExpand={handleToggleExpand}
    />
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading tree...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <p className="font-semibold">Error loading tree</p>
        <p className="text-sm">{error}</p>
        <Button onClick={onRefresh} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <AddObjectDialog
          measurementId={measurementId}
          parentObjectId={null}
          onSuccess={onRefresh}
        >
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Root Item
          </Button>
        </AddObjectDialog>
      </div>

      {tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">No items yet</p>
          <p className="text-xs">Add a root item to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg p-2">
          {tree.map((node) => renderNode(node, 0))}
        </div>
      )}
    </div>
  )
}

export function MeasurementTreeView(props: MeasurementTreeViewProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <RealMeasurementTreeView {...props} />
    </DndProvider>
  )
}