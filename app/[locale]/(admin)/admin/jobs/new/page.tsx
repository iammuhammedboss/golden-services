'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddClientDialog } from '@/components/add-client-dialog'

export default function NewJobPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'

  const [clients, setClients] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    quotationId: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    status: 'SCHEDULED',
    notes: '',
    location: '',
    isMultiDay: false,
    endDate: '',
    durationDays: 0,
    durationHours: 0,
    durationMinutes: 0,
    assignments: [] as { userId: string; roleInJob: string }[],
    jobMaterials: [] as { materialId: string; quantity: number }[],
  })

  useEffect(() => {
    fetchClients()
    fetchUsers()
    fetchMaterials()
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      fetchQuotations(formData.clientId)
    } else {
      setQuotations([])
    }
  }, [formData.clientId])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/masters/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  useEffect(() => {
    if (formData.scheduledDate && formData.scheduledStartTime) {
      const startDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledStartTime}`);
      const durationMillis =
        (formData.durationDays * 24 * 60 * 60 +
          formData.durationHours * 60 * 60 +
          formData.durationMinutes * 60) *
        1000;
      
      if (durationMillis > 0) {
        const endDateTime = new Date(startDateTime.getTime() + durationMillis);
        
        setFormData(prevData => ({
          ...prevData,
          scheduledEndTime: endDateTime.toTimeString().slice(0, 5),
          endDate: endDateTime.toISOString().slice(0, 10),
          isMultiDay: endDateTime.getDate() !== startDateTime.getDate(),
        }));
      }
    }
  }, [
    formData.scheduledDate,
    formData.scheduledStartTime,
    formData.durationDays,
    formData.durationHours,
    formData.durationMinutes,
  ]);

  const fetchQuotations = async (clientId: string) => {
    try {
      const response = await fetch(`/api/quotations?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
    }
  }

  const handleAssignmentChange = (index: number, field: string, value: string) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData({ ...formData, assignments: newAssignments });
  };

  const addAssignment = () => {
    setFormData({
      ...formData,
      assignments: [...formData.assignments, { userId: '', roleInJob: 'TECHNICIAN' }],
    });
  };

  const removeAssignment = (index: number) => {
    const newAssignments = formData.assignments.filter((_, i) => i !== index);
    setFormData({ ...formData, assignments: newAssignments });
  };

  const handleMaterialChange = (index: number, field: string, value: string | number) => {
    const newMaterials = [...formData.jobMaterials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({ ...formData, jobMaterials: newMaterials });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      jobMaterials: [...formData.jobMaterials, { materialId: '', quantity: 1 }],
    });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.jobMaterials.filter((_, i) => i !== index);
    setFormData({ ...formData, jobMaterials: newMaterials });
  };

  const onClientCreated = () => {
    fetchClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !formData.scheduledDate) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quotationId: formData.quotationId || null,
          assignments: formData.assignments,
          jobMaterials: formData.jobMaterials,
        }),
      })

      if (response.ok) {
        const job = await response.json()
        router.push(`/${locale}/admin/jobs/${job.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create job order')
      }
    } catch (error) {
      console.error('Error creating job order:', error)
      alert('Failed to create job order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Job Order</h1>
          <p className="text-muted-foreground">Schedule a new job for your client</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/jobs`)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          clientId: value,
                          quotationId: '',
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AddClientDialog onClientCreated={onClientCreated}>
                      <Button type="button" variant="outline">New</Button>
                    </AddClientDialog>
                  </div>
                </div>

                
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotationId">Quotation (Optional)</Label>
                <Select
                  value={formData.quotationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quotationId: value })
                  }
                  disabled={!formData.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.client.name} - ({quotation.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Client's home address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Duration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledStartTime">Start Time (Optional)</Label>
                  <Input
                    id="scheduledStartTime"
                    type="time"
                    value={formData.scheduledStartTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledStartTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expected Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Days"
                    value={formData.durationDays || ''}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="Hours"
                    value={formData.durationHours || ''}
                    onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={formData.durationMinutes || ''}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledEndTime">End Time</Label>
                  <Input
                    id="scheduledEndTime"
                    type="time"
                    value={formData.scheduledEndTime}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Staff */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.assignments.map((assignment, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                  <Select
                    value={assignment.userId}
                    onValueChange={(value) => handleAssignmentChange(index, 'userId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={assignment.roleInJob}
                    onValueChange={(value) => handleAssignmentChange(index, 'roleInJob', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICIAN">Technician</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" onClick={() => removeAssignment(index)}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addAssignment}>Add Assignee</Button>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.jobMaterials.map((material, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                  <Select
                    value={material.materialId}
                    onValueChange={(value) => handleMaterialChange(index, 'materialId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id}>{mat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => handleMaterialChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Quantity"
                  />
                  <Button type="button" variant="ghost" onClick={() => removeMaterial(index)}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMaterial}>Add Material</Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any additional notes or special instructions..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/jobs`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job Order'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

