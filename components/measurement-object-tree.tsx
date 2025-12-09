'use client'

import { MeasurementObject } from '@prisma/client'
import { Button } from './ui/button'
import { AddMeasurementObjectDialog } from './add-measurement-object-dialog'

interface MeasurementObjectTreeProps {
  measurementId: string
  objects: (MeasurementObject & { children: any[] })[]
  onObjectCreated: (newObject: any, parentId?: string | null) => void
}

function ObjectNode({
  obj,
  measurementId,
  onObjectCreated,
}: {
  obj: (MeasurementObject & { children: any[] })
  measurementId: string
  onObjectCreated: (newObject: any, parentId?: string | null) => void
}) {
  return (
    <div className="ml-4 pl-4 border-l">
      <div className="flex items-center justify-between">
        <p>{obj.name}</p>
        <AddMeasurementObjectDialog
          measurementId={measurementId}
          parentId={obj.id}
          onObjectCreated={(newObject) => onObjectCreated(newObject, obj.id)}
        >
          <Button variant="ghost" size="sm">+ Add child</Button>
        </AddMeasurementObjectDialog>
      </div>
      {obj.children && obj.children.length > 0 && (
        <div>
          {obj.children.map((child) => (
            <ObjectNode
              key={child.id}
              obj={child}
              measurementId={measurementId}
              onObjectCreated={onObjectCreated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MeasurementObjectTree({
  objects,
  measurementId,
  onObjectCreated,
}: MeasurementObjectTreeProps) {
  return (
    <div className="space-y-2">
      <AddMeasurementObjectDialog
        measurementId={measurementId}
        onObjectCreated={(newObject) => onObjectCreated(newObject, null)}
      >
        <Button>+ Add Root Object</Button>
      </AddMeasurementObjectDialog>
      {objects.map((obj) => (
        <ObjectNode
          key={obj.id}
          obj={obj}
          measurementId={measurementId}
          onObjectCreated={onObjectCreated}
        />
      ))}
    </div>
  )
}
