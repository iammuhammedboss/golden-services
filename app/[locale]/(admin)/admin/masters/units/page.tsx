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

type UnitMaster = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitMaster | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/masters/units')
      if (response.ok) {
        const data = await response.json()
        setUnits(data)
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingUnit
        ? `/api/masters/units/${editingUnit.id}`
        : '/api/masters/units'
      const method = editingUnit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingUnit(null)
        setFormData({ name: '', description: '', isActive: true })
        fetchUnits()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save unit')
      }
    } catch (error) {
      console.error('Failed to save unit:', error)
      alert('Failed to save unit')
    }
  }

  const handleEdit = (unit: UnitMaster) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name,
      description: unit.description || '',
      isActive: unit.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) {
      return
    }

    try {
      const response = await fetch(`/api/masters/units/${unitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUnits()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete unit')
      }
    } catch (error) {
      console.error('Failed to delete unit:', error)
      alert('Failed to delete unit')
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingUnit(null)
    setFormData({ name: '', description: '', isActive: true })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Units</h1>
          <p className="text-muted-foreground">Manage measurement units</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
                <DialogDescription>
                  {editingUnit
                    ? 'Update the unit details below'
                    : 'Create a new measurement unit'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Piece, Set, sqm"
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
                <Button type="submit">{editingUnit ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
          <CardDescription>Total: {units.length} units</CardDescription>
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
                {units.length > 0 ? (
                  units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        {unit.description ? (
                          <span className="text-sm text-muted-foreground">{unit.description}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                          {unit.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(unit.createdAt, 'PP')}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(unit)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
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
                      No units found. Click &quot;Add Unit&quot; to create one.
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
