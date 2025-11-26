'use client'

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
import {
  MoreVertical,
  Eye,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  Building2,
} from 'lucide-react'
import Link from 'next/link'

interface LeadActionsProps {
  lead: {
    id: string
    name: string
    phone: string
    status: string
    convertedToClientId?: string | null
  }
}

export function LeadActions({ lead }: LeadActionsProps) {
  const isConverted = lead.status === 'CONVERTED'

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

          <DropdownMenuSeparator />

          {/* Schedule Site Visit */}
          {isConverted && (
            <DropdownMenuItem>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Site Visit
            </DropdownMenuItem>
          )}

          {/* Create Quotation */}
          {isConverted && (
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Create Quotation
            </DropdownMenuItem>
          )}

          {/* Create Site */}
          {isConverted && lead.convertedToClientId && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/sites/new?clientId=${lead.convertedToClientId}`} className="flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Create Site
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
