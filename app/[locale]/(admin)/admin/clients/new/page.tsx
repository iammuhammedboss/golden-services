'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function CreateClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    whatsapp: '',
    email: '',
    company: '',
    vatTrn: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE',
    source: 'PHONE' as const,
    status: 'NEW' as const,
    area: '',
    street: '',
    building: '',
    city: '',
    locationPin: '',
    primaryContactName: '',
    primaryContactPhone: '',
    alternateContactName: '',
    alternateContactPhone: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const client = await response.json()
        router.push(`/admin/clients/${client.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create client')
      }
    } catch (error) {
      console.error('Failed to create client:', error)
      alert('Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Client</h1>
            <p className="text-muted-foreground">Add a new client to your database</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild disabled={loading}>
            <Link href="/admin/clients">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Client Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'INDIVIDUAL' | 'CORPORATE') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatTrn">VAT/TRN (optional)</Label>
                <Input
                  id="vatTrn"
                  value={formData.vatTrn}
                  onChange={(e) => setFormData({ ...formData, vatTrn: e.target.value })}
                  placeholder="VAT/TRN number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Client location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Area/District"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="building">Building/Villa/Apartment</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Building/Villa/Apt details"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="locationPin">Location Pin (optional)</Label>
                <Input
                  id="locationPin"
                  value={formData.locationPin}
                  onChange={(e) => setFormData({ ...formData, locationPin: e.target.value })}
                  placeholder="Google Maps link or coordinates"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Primary and alternate contact persons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>Primary Contact</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactName">Contact Name</Label>
                    <Input
                      id="primaryContactName"
                      value={formData.primaryContactName}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryContactName: e.target.value })
                      }
                      placeholder="Primary contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactPhone">Contact Phone</Label>
                    <Input
                      id="primaryContactPhone"
                      type="tel"
                      value={formData.primaryContactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryContactPhone: e.target.value })
                      }
                      placeholder="+968 XXXX XXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Alternate Contact</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="alternateContactName">Contact Name</Label>
                    <Input
                      id="alternateContactName"
                      value={formData.alternateContactName}
                      onChange={(e) =>
                        setFormData({ ...formData, alternateContactName: e.target.value })
                      }
                      placeholder="Alternate contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternateContactPhone">Contact Phone</Label>
                    <Input
                      id="alternateContactPhone"
                      type="tel"
                      value={formData.alternateContactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, alternateContactPhone: e.target.value })
                      }
                      placeholder="+968 XXXX XXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Internal notes and comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any internal notes about this client..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sticky bottom save bar on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-end gap-2 md:hidden">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/admin/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </form>
    </div>
  )
}
