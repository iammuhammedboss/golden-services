'use client'

import { MeasurementItem, ItemMaster, RoomTypeMaster } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

type MeasurementWithRelations = MeasurementItem & {
  itemType: ItemMaster
  roomType: RoomTypeMaster | null
}

interface MeasurementListProps {
  measurements: MeasurementWithRelations[]
  onEdit: (measurement: MeasurementWithRelations) => void
  onDelete: (measurementId: string) => void
}

export function MeasurementList({
  measurements,
  onEdit,
  onDelete,
}: MeasurementListProps) {
  if (measurements.length === 0) {
    return <p className="text-muted-foreground">No measurements recorded yet.</p>
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.itemType.name}</TableCell>
              <TableCell>{m.roomType?.name || 'N/A'}</TableCell>
              <TableCell className="text-right">{m.quantity.toString()}</TableCell>
              <TableCell>{m.size || '-'}</TableCell>
              <TableCell>{m.customDescription || '-'}</TableCell>
              <TableCell>{m.notes || '-'}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(m)}
                  className="mr-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(m.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
