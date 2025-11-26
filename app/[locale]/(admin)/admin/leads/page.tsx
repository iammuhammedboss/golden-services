import Link from 'next/link'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate, getStatusColor, enumToReadable } from '@/lib/utils'
import { AddLeadDialog } from '@/components/add-lead-dialog'
import { LeadActions } from '@/components/lead-actions'

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      convertedToClient: {
        select: {
          id: true,
          name: true,
        },
      },
      siteVisits: {
        select: {
          id: true,
          scheduledAt: true,
          status: true,
        },
      },
      quotations: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'NEW').length,
    contacted: leads.filter((l) => l.status === 'CONTACTED').length,
    quoted: leads.filter((l) => l.status === 'QUOTED').length,
    converted: leads.filter((l) => l.status === 'CONVERTED').length,
    won: leads.filter((l) => l.status === 'WON').length,
    lost: leads.filter((l) => l.status === 'LOST').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your leads and inquiries</p>
        </div>
        <AddLeadDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quoted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.quoted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.won}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>A list of all leads and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Service Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site Visits</TableHead>
                <TableHead>Quotations</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{lead.phone}</div>
                        {lead.email && (
                          <div className="text-muted-foreground">{lead.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{enumToReadable(lead.source)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {lead.serviceInterest || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {enumToReadable(lead.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.siteVisits.length > 0 ? (
                        <span className="text-sm">{lead.siteVisits.length}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.quotations.length > 0 ? (
                        <span className="text-sm">{lead.quotations.length}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(lead.createdAt, 'PP')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(lead.createdAt, 'p')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.createdBy.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <LeadActions lead={{
                        id: lead.id,
                        name: lead.name,
                        phone: lead.phone,
                        status: lead.status,
                        convertedToClientId: lead.convertedToClientId,
                      }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
