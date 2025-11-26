'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus } from 'lucide-react'

interface AddSiteVisitDialogProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

interface Client {
  id: string
  name: string
}

interface Site {
  id: string
  name: string
  clientId: string
}

interface User {
  id: string
  name: string
}

export function AddSiteVisitDialog({
  variant = 'default',
  size = 'default',
  className,
}: AddSiteVisitDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredSites, setFilteredSites] = useState<Site[]>([])

  const [formData, setFormData] = useState({
    clientId: '',
    siteId: '',
    scheduledAt: '',
    visitType: 'FULL_HOUSE',
    assignedToId: '',
    notes: '',
  })

  // Fetch clients, sites, and users when dialog opens
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  // Filter sites when client changes
  useEffect(() => {
    if (formData.clientId) {
      const filtered = sites.filter((site) => site.clientId === formData.clientId)
      setFilteredSites(filtered)
    } else {
      setFilteredSites([])
    }
  }, [formData.clientId, sites])

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients')
      const clientsData = await clientsRes.json()
      setClients(clientsData.clients || [])

      // Fetch sites
      const sitesRes = await fetch('/api/sites')
      const sitesData = await sitesRes.json()
      setSites(sitesData.sites || [])

      // Fetch users
      const usersRes = await fetch('/api/users')
      const usersData = await usersRes.json()
      setUsers(usersData.users || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.clientId || !formData.siteId || !formData.scheduledAt || !formData.assignedToId) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/site-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          siteId: formData.siteId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          visitType: formData.visitType,
          assignedToId: formData.assignedToId,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create site visit')
      }

      setSuccess('✅ Site visit created successfully!')

      // Reset form
      setFormData({
        clientId: '',
        siteId: '',
        scheduledAt: '',
        visitType: 'FULL_HOUSE',
        assignedToId: '',
        notes: '',
      })

      // Wait a moment to show success message
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Site Visit</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Site Visit</DialogTitle>
          <DialogDescription>
            Schedule a site visit for a client. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => {
                setFormData({ ...formData, clientId: value, siteId: '' })
              }}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Selection */}
          <div className="space-y-2">
            <Label htmlFor="site">Site *</Label>
            <Select
              value={formData.siteId}
              onValueChange={(value) =>
                setFormData({ ...formData, siteId: value })
              }
              disabled={!formData.clientId}
            >
              <SelectTrigger id="site">
                <SelectValue placeholder={formData.clientId ? "Select a site" : "Select a client first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSites.length > 0 ? (
                  filteredSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No sites available for this client
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
            />
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label htmlFor="visitType">Visit Type</Label>
            <Select
              value={formData.visitType}
              onValueChange={(value) =>
                setFormData({ ...formData, visitType: value })
              }
            >
              <SelectTrigger id="visitType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_HOUSE">Full House</SelectItem>
                <SelectItem value="SPECIFIC_SERVICE">Specific Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To *</Label>
            <Select
              value={formData.assignedToId}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedToId: value })
              }
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Site Visit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
