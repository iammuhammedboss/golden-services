'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Client, Site } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Receipt,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  User,
  Calendar
} from 'lucide-react'
import { formatDate, enumToReadable } from '@/lib/utils'
import Link from 'next/link'

type ClientWithSites = Client & {
  sites: Site[]
}

export default function ClientDetailsPage() {
  const [client, setClient] = useState<ClientWithSites | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const fetchClient = useCallback(async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/clients/${id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  const handleDelete = async () => {
    if (!client) return

    if (!confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/clients')
      } else {
        alert('Failed to delete client')
      }
    } catch (error) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client')
    }
  }

  const handleDuplicate = async () => {
    if (!client) return

    if (!confirm(`Create a copy of client "${client.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${client.id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const newClient = await response.json()
        router.push(`/admin/clients/${newClient.id}/edit`)
      } else {
        alert('Failed to duplicate client')
      }
    } catch (error) {
      console.error('Failed to duplicate client:', error)
      alert('Failed to duplicate client')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Button onClick={() => router.push('/admin/clients')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/admin/clients')} variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">Client Details</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/admin/clients/${client.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/clients/${client.id}/ledger`}>
            <Receipt className="h-4 w-4 mr-2" />
            Ledger Statement
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Basic details about this client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base font-semibold">{client.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-base">{client.phone}</p>
                {client.alternatePhone && (
                  <p className="text-sm text-muted-foreground">Alt: {client.alternatePhone}</p>
                )}
              </div>
            </div>

            {client.whatsapp && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                  <p className="text-base">{client.whatsapp}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{client.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">{enumToReadable(client.type)}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {enumToReadable(client.status)}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Source</p>
                <Badge variant="outline" className="mt-1">{enumToReadable(client.source)}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">{formatDate(client.createdAt, 'PPP')}</p>
                <p className="text-sm text-muted-foreground">{formatDate(client.createdAt, 'p')}</p>
              </div>
            </div>
          </div>

          {client.notes && (
            <>
              <div className="border-t my-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="text-base whitespace-pre-wrap">{client.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sites Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sites</CardTitle>
              <CardDescription>
                {client.sites.length} {client.sites.length === 1 ? 'site' : 'sites'} associated with this client
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/sites/new?clientId=${client.id}`}>
                <MapPin className="h-4 w-4 mr-2" />
                Add Site
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {client.sites.length > 0 ? (
            <div className="space-y-3">
              {client.sites.map(site => (
                <Card key={site.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">{site.name}</p>
                        {site.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {site.address}
                          </p>
                        )}
                        {site.city && (
                          <p className="text-sm text-muted-foreground">{site.city}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{enumToReadable(site.type)}</Badge>
                          {site.bhkType && <Badge variant="secondary">{site.bhkType}</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/sites/${site.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sites found for this client</p>
              <p className="text-sm">Add a site to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}