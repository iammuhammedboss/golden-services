'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, enumToReadable } from '@/lib/utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Client } from '@prisma/client'
import { MoreHorizontal, Eye, UserPlus, Calendar, Briefcase, FileText, Receipt, Edit, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ClientWithSites = Client & {
  sites: { id: string }[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithSites[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const stats = {
    total: clients.length,
    individual: clients.filter((c) => c.type === 'INDIVIDUAL').length,
    corporate: clients.filter((c) => c.type === 'CORPORATE').length,
    temporary: clients.filter((c) => c.isTemporary).length,
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to remove this client?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchClients()
      } else {
        alert('Failed to delete client')
      }
    } catch (error) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button asChild>
          <Link href="/admin/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.individual}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Corporate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.corporate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>A list of all clients in the system</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{client.phone}</div>
                        {client.whatsapp && client.whatsapp !== client.phone && (
                          <div className="text-muted-foreground">WA: {client.whatsapp}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.email ? (
                        <span className="text-sm">{client.email}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{enumToReadable(client.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {client.sites.length > 0 ? (
                        <span className="text-sm font-medium">{client.sites.length}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(client.createdAt, 'PP')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(client.createdAt, 'p')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/clients/${client.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Create</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/admin/site-visits?clientId=${client.id}`)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Site Visit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/schedule?clientId=${client.id}`)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/jobs?clientId=${client.id}`)}>
                              <Briefcase className="mr-2 h-4 w-4" />
                              Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/invoices?clientId=${client.id}`)}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/quotations?clientId=${client.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Quotation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}/ledger`)}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Ledger Statement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No clients found
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
