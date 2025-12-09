'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Client, Site } from '@prisma/client'
import { AddSiteDialog } from '@/components/add-site-dialog'
import { AddSiteVisitDialog } from '@/components/add-site-visit-dialog'
import { Button } from '@/components/ui/button'

type ClientWithSites = Client & {
  sites: Site[]
}

export default function ClientDetailsPage() {
  const [client, setClient] = useState<ClientWithSites | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const { id, locale } = params

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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!client) {
    return <div className="text-center text-muted-foreground">Client not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">Client Details</p>
        </div>
        <AddSiteDialog clientId={client.id} onSiteCreated={fetchClient}>
            <Button>+ Add Site</Button>
        </AddSiteDialog>
      </div>
        
        {/* Sites List */}
        <div>
            <h2 className="text-2xl font-bold">Sites</h2>
            {client.sites.length > 0 ? (
                <ul className="space-y-4">
                    {client.sites.map(site => (
                        <li key={site.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold">{site.name}</p>
                                <p>{site.address}</p>
                            </div>
                            <AddSiteVisitDialog clientId={client.id} siteId={site.id} onSiteVisitCreated={fetchClient}>
                                <Button variant="outline">+ Add Site Visit</Button>
                            </AddSiteVisitDialog>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No sites found for this client.</p>
            )}
        </div>
    </div>
  )
}