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

type PaymentMethodMaster = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PaymentMethodMaster | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  })

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/masters/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/masters/payment-methods/${editingItem.id}`
        : '/api/masters/payment-methods'
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
        setFormData({ name: '', description: '', isActive: true, sortOrder: 0 })
        fetchPaymentMethods()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save payment method')
      }
    } catch (error) {
      console.error('Failed to save payment method:', error)
      alert('Failed to save payment method')
    }
  }

  const handleEdit = (item: PaymentMethodMaster) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    try {
      const response = await fetch(`/api/masters/payment-methods/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPaymentMethods()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete payment method')
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error)
      alert('Failed to delete payment method')
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true, sortOrder: 0 })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Manage payment methods</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Payment Method' : 'Add New Payment Method'}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the payment method details below'
                    : 'Create a new payment method'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CASH, CARD, BANK_TRANSFER"
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
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
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
          <CardTitle>All Payment Methods</CardTitle>
          <CardDescription>Total: {paymentMethods.length} methods</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((item) => (
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
                        <span className="text-sm">{item.sortOrder}</span>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No payment methods found. Click &quot;Add Payment Method&quot; to create one.
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
