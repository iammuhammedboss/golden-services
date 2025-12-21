'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type MaterialMaster = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MaterialMaster | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/masters/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/masters/materials/${editingItem.id}`
        : '/api/masters/materials'
      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingItem(null)
        setFormData({ name: '', description: '', isActive: true })
        fetchMaterials()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save material')
      }
    } catch (error) {
      console.error('Failed to save material:', error)
      alert('Failed to save material')
    }
  }

  const handleEdit = (item: MaterialMaster) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      isActive: item.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return
    }

    try {
      const response = await fetch(`/api/masters/materials/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMaterials()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete material')
      }
    } catch (error) {
      console.error('Failed to delete material:', error)
      alert('Failed to delete material')
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materials</h1>
          <p className="text-muted-foreground">Manage materials used in jobs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Material' : 'Add New Material'}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the material details below'
                    : 'Create a new material item'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cleaning Solution, Detergent, Polish"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Materials</CardTitle>
          <CardDescription>Total: {materials.length} items</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length > 0 ? (
                  materials.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.description ? (
                          <span className="text-sm text-muted-foreground">{item.description}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(item.createdAt, 'PP')}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No materials found. Click &quot;Add Material&quot; to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
