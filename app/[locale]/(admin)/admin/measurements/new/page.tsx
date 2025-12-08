import { StreamlinedMeasurementForm } from '@/components/streamlined-measurement-form'

export default function NewMeasurementPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Measurement</h1>
      <StreamlinedMeasurementForm />
    </div>
  )
}
