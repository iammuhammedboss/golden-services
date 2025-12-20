'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConvertToClientDialog } from '@/components/convert-to-client-dialog'
import { EditLeadDialog } from '@/components/edit-lead-dialog'
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { Lead } from '@prisma/client'

interface LeadActionsProps {
  lead: Lead
}

export function LeadActions({ lead }: LeadActionsProps) {
  const router = useRouter()
  const isConverted = lead.status === 'CONVERTED'

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/leads/${lead.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          router.refresh()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to delete lead')
        }
      } catch (error) {
        console.error('Error deleting lead:', error)
        alert('Failed to delete lead')
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
      {/* Quick Action: Convert to Client - Hidden on mobile, shown in dropdown */}
      <div className="hidden sm:block">
        {!isConverted && (
          <ConvertToClientDialog
            leadId={lead.id}
            leadName={lead.name}
            leadPhone={lead.phone}
            leadStatus={lead.status}
            variant="default"
            size="sm"
            className="whitespace-nowrap"
          />
        )}

        {/* Quick Action: Go to Client if converted */}
        {isConverted && lead.convertedToClientId && (
          <Link href={`/admin/clients/${lead.convertedToClientId}`}>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <UserCheck className="h-4 w-4 mr-2" />
              View Client
            </Button>
          </Link>
        )}
      </div>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Convert to Client - Mobile only */}
          {!isConverted && (
            <div className="sm:hidden">
              <ConvertToClientDialog
                leadId={lead.id}
                leadName={lead.name}
                leadPhone={lead.phone}
                leadStatus={lead.status}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              />
            </div>
          )}

          {/* View Client - Mobile only */}
          {isConverted && lead.convertedToClientId && (
            <div className="sm:hidden">
              <DropdownMenuItem asChild>
                <Link href={`/admin/clients/${lead.convertedToClientId}`} className="flex items-center">
                  <UserCheck className="mr-2 h-4 w-4" />
                  View Client
                </Link>
              </DropdownMenuItem>
            </div>
          )}

          {/* Edit */}
          <EditLeadDialog lead={lead}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </EditLeadDialog>
          
          {/* View Details */}
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {/* Call Customer */}
          <DropdownMenuItem asChild>
            <a href={`tel:${lead.phone}`} className="flex items-center">
              <Phone className="mr-2 h-4 w-4" />
              Call {lead.phone}
            </a>

          </DropdownMenuItem>

          {/* Delete */}
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>


          <DropdownMenuSeparator />

          {/* Schedule Site Visit */}
          {isConverted && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/site-visits/new?leadId=${lead.id}`} className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Site Visit
              </Link>
            </DropdownMenuItem>
          )}

          {/* Create Quotation */}
          {isConverted && (
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Create Quotation
            </DropdownMenuItem>
          )}

          
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
