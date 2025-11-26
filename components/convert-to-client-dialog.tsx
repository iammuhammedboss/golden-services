'use client'

import { useState } from 'react'
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
import { UserCheck, Loader2 } from 'lucide-react'

interface ConvertToClientDialogProps {
  leadId: string
  leadName: string
  leadPhone: string
  leadStatus: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ConvertToClientDialog({
  leadId,
  leadName,
  leadPhone,
  leadStatus,
  variant = 'default',
  size = 'sm',
  className,
}: ConvertToClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL',
    alternatePhone: '',
    additionalNotes: '',
  })

  const handleConvert = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert lead to client')
      }

      setSuccess(data.isNewClient
        ? `✅ Successfully created new client: ${leadName}`
        : `✅ Linked to existing client: ${data.client.name}`)

      // Wait a moment to show success message
      setTimeout(() => {
        setOpen(false)
        router.refresh()
        // Optionally redirect to client page or site creation
        // router.push(`/admin/clients/${data.client.id}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Check if already converted
  const isConverted = leadStatus === 'CONVERTED'

  if (isConverted) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <UserCheck className="h-4 w-4 mr-2" />
        Already Converted
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserCheck className="h-4 w-4 mr-2" />
          Convert to Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert Lead to Client</DialogTitle>
          <DialogDescription>
            Convert {leadName} into a client. This will allow you to create sites and schedule visits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lead Info */}
          <div className="rounded-md border p-3 bg-muted/50">
            <p className="text-sm font-medium">{leadName}</p>
            <p className="text-sm text-muted-foreground">{leadPhone}</p>
          </div>

          {/* Client Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Client Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alternate Phone */}
          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
            <Input
              id="alternatePhone"
              placeholder="+968 9XXX XXXX"
              value={formData.alternatePhone}
              onChange={(e) =>
                setFormData({ ...formData, alternatePhone: e.target.value })
              }
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              rows={3}
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
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
            onClick={handleConvert}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Convert to Client
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
