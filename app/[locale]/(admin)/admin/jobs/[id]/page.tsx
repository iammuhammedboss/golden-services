'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobOrder, Client, Quotation, Measurement, User, MaterialMaster, EquipmentMaster, JobAssignment, JobMaterial, JobEquipment, ChecklistItem, JobStatusUpdate, JobRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type JobAssignmentInput = Omit<JobAssignment, 'id' | 'jobOrderId' | 'createdAt' | 'deletedAt'>;
type JobMaterialInput = Omit<JobMaterial, 'id' | 'jobOrderId' | 'quantity'> & { quantity: number };
type JobEquipmentInput = Omit<JobEquipment, 'id' | 'jobOrderId'>;

type JobWithRelations = JobOrder & {
  client: Client | null
  quotation: Quotation | null,
  measurement: Measurement | null,
  assignments: (JobAssignment | JobAssignmentInput)[],
  materials: (JobMaterial | JobMaterialInput)[],
  equipment: (JobEquipment | JobEquipmentInput)[],
  checklistItems: ChecklistItem[],
  statusUpdates: JobStatusUpdate[],
}

export default function JobDetailsPage() {
  const [job, setJob] = useState<JobWithRelations | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [materialMasters, setMaterialMasters] = useState<MaterialMaster[]>([])
  const [equipmentMasters, setEquipmentMasters] = useState<EquipmentMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showShareConfirmation, setShowShareConfirmation] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, quotationsRes, measurementsRes, usersRes, materialsRes, equipmentRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/quotations'),
          fetch('/api/measurements'),
          fetch('/api/users'),
          fetch('/api/masters/materials'),
          fetch('/api/masters/equipment'),
        ]);
        if(clientsRes.ok) setClients(await clientsRes.json());
        if(quotationsRes.ok) setQuotations(await quotationsRes.json());
        if(measurementsRes.ok) setMeasurements(await measurementsRes.json());
        if(usersRes.ok) setUsers(await usersRes.json());
        if(materialsRes.ok) setMaterialMasters(await materialsRes.json());
        if(equipmentRes.ok) setEquipmentMasters(await equipmentRes.json());
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    fetchData()
  }, [])
  
  useEffect(() => {
    async function fetchJob() {
      if (id === 'new') {
        setJob({
            id: 'new',
            assignments: [],
            materials: [],
            equipment: [],
            checklistItems: [],
            statusUpdates: [],
        } as unknown as JobWithRelations)
        setLoading(false)
        return
      }
      try {
        const response = await fetch(`/api/jobs/${id}`)
        if (response.ok) {
          const data = await response.json()
          setJob(data)
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const method = id === 'new' ? 'POST' : 'PUT'
    const url = id === 'new' ? '/api/jobs' : `/api/jobs/${id}`
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })
      if (response.ok) {
        router.push('/admin/jobs')
      }
    } catch (error) {
      console.error('Failed to save job:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = () => {
    if (!job) return;

    const jobDetails = `
*Job Order Details*

*Job Number:* ${job.jobNumber}
*Client:* ${job.client?.name}
*Phone:* ${job.client?.phone}
*Location:* ${job.location}
*Scheduled Date:* ${new Date(job.scheduledDate).toLocaleDateString()}
    `;

    navigator.clipboard.writeText(jobDetails.trim()).then(() => {
      setShowShareConfirmation(true);
      setTimeout(() => setShowShareConfirmation(false), 2000);
      window.open('https://web.whatsapp.com', '_blank');
    });
  };
  
  const addAssignment = () => {
    if(!job) return;
    setJob({
        ...job,
        assignments: [...job.assignments, { userId: '', roleInJob: 'CLEANER' }]
    })
  }

  const addMaterial = () => {
    if(!job) return;
    setJob({
        ...job,
        materials: [...job.materials, { materialId: '', quantity: 1, notes: '' }]
    })
    }

const addEquipment = () => {
    if(!job) return;
    setJob({
        ...job,
        equipment: [...job.equipment, { equipmentId: '', quantity: 1, notes: '' }]
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!job) {
    return <div>Job not found</div>
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{id === 'new' ? 'New Job' : `Job ${job.jobNumber}`}</h1>
            <div className="flex gap-2">
                {id !== 'new' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/jobs/${id}/status`)}
                  >
                    Status & Payments
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Job'}
                </Button>
                <Button
                    onClick={handleShare}
                    disabled={id === 'new'}
                    variant="outline"
                >
                    Share on WhatsApp
                </Button>
            </div>
        </div>
        
        {showShareConfirmation && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <p className="font-bold">Copied to clipboard!</p>
            <p>Job details copied. You can now paste it in WhatsApp.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Job Information */}
            <div className="space-y-2">
                <Label>Client</Label>
                <Select
                    value={job.clientId || ''}
                    onValueChange={(value) => setJob({ ...job, clientId: value })}
                >
                    <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Quotation</Label>
                <Select
                    value={job.quotationId || '__NONE__'}
                    onValueChange={(value) => setJob({ ...job, quotationId: value === '__NONE__' ? null : value })}
                >
                    <SelectTrigger><SelectValue placeholder="Select Quotation" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__NONE__">None</SelectItem>
                        {quotations.map(q => (
                            <SelectItem key={q.id} value={q.id}>Quotation #{q.id}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Measurement</Label>
                <Select
                    value={job.measurementId || '__NONE__'}
                    onValueChange={(value) => setJob({ ...job, measurementId: value === '__NONE__' ? null : value })}
                >
                    <SelectTrigger><SelectValue placeholder="Select Measurement" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__NONE__">None</SelectItem>
                        {measurements.map(m => (
                            <SelectItem key={m.id} value={m.id}>Measurement #{m.id}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Status</Label>
                <Select
                    value={job.status || 'SCHEDULED'}
                    onValueChange={(value) => setJob({ ...job, status: value as any })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                    type="date"
                    value={job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setJob({ ...job, scheduledDate: new Date(e.target.value) })}
                />
            </div>
            <div className="space-y-2">
                <Label>Scheduled Start Time</Label>
                <Input
                    type="time"
                    value={job.scheduledStartTime ? new Date(job.scheduledStartTime).toTimeString().slice(0, 5) : ''}
                    onChange={(e) => {
                        const date = job.scheduledDate ? new Date(job.scheduledDate) : new Date()
                        const dateStr = date.toISOString().split('T')[0]
                        setJob({ ...job, scheduledStartTime: new Date(`${dateStr}T${e.target.value}`) })
                    }}
                />
            </div>
            <div className="space-y-2">
                <Label>Location</Label>
                <Input
                    value={job.location || ''}
                    onChange={(e) => setJob({ ...job, location: e.target.value })}
                    placeholder="Enter job location"
                />
            </div>
            <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                    value={job.paymentStatus || 'UNPAID'}
                    onValueChange={(value) => setJob({ ...job, paymentStatus: value as any })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                        <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
                value={job.notes || ''}
                onChange={(e) => setJob({ ...job, notes: e.target.value })}
                placeholder="Add notes about this job..."
                rows={3}
            />
        </div>

        <div>
            <h3 className="text-lg font-semibold">Staff Assignments</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {job.assignments.map((assignment, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Select
                                    value={assignment.userId}
                                    onValueChange={(value) => {
                                        const newAssignments = [...job.assignments]
                                        newAssignments[index].userId = value
                                        setJob({ ...job, assignments: newAssignments })
                                    }}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={assignment.roleInJob}
                                    onValueChange={(value) => {
                                        const newAssignments = [...job.assignments]
                                        newAssignments[index].roleInJob = value as JobRole
                                        setJob({ ...job, assignments: newAssignments })
                                    }}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                        <SelectItem value="CLEANER">Cleaner</SelectItem>
                                        <SelectItem value="TECHNICIAN">Technician</SelectItem>
                                        <SelectItem value="DRIVER">Driver</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Button variant="destructive" size="sm" onClick={() => {
                                    const newAssignments = [...job.assignments]
                                    newAssignments.splice(index, 1)
                                    setJob({ ...job, assignments: newAssignments })
                                }}>Remove</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button onClick={addAssignment} className="mt-2">Add Assignee</Button>
        </div>

        <div>
            <h3 className="text-lg font-semibold">Materials</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {job.materials.map((material, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Select
                                    value={material.materialId}
                                    onValueChange={(value) => {
                                        const newMaterials = [...job.materials]
                                        newMaterials[index].materialId = value
                                        setJob({ ...job, materials: newMaterials })
                                    }}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {materialMasters.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    value={typeof material.quantity === 'number' ? material.quantity : material.quantity.toNumber()}
                                    onChange={(e) => {
                                        const newMaterials = [...job.materials]
                                        const material = newMaterials[index];
                                        if ('quantity' in material) {
                                            (material.quantity as number) = parseFloat(e.target.value) || 0
                                        }
                                        setJob({ ...job, materials: newMaterials })
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Button variant="destructive" size="sm" onClick={() => {
                                    const newMaterials = [...job.materials]
                                    newMaterials.splice(index, 1)
                                    setJob({ ...job, materials: newMaterials })
                                }}>Remove</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button onClick={addMaterial} className="mt-2">Add Material</Button>
        </div>

        <div>
            <h3 className="text-lg font-semibold">Equipment</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {job.equipment.map((eq, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Select
                                    value={eq.equipmentId}
                                    onValueChange={(value) => {
                                        const newEquipment = [...job.equipment]
                                        newEquipment[index].equipmentId = value
                                        setJob({ ...job, equipment: newEquipment })
                                    }}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {equipmentMasters.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    value={eq.quantity}
                                    onChange={(e) => {
                                        const newEquipment = [...job.equipment]
                                        newEquipment[index].quantity = parseInt(e.target.value) || 0
                                        setJob({ ...job, equipment: newEquipment })
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <Button variant="destructive" size="sm" onClick={() => {
                                    const newEquipment = [...job.equipment]
                                    newEquipment.splice(index, 1)
                                    setJob({ ...job, equipment: newEquipment })
                                }}>Remove</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button onClick={addEquipment} className="mt-2">Add Equipment</Button>
        </div>

        {id !== 'new' && (
          <>
            <div>
                <h3 className="text-lg font-semibold">Checklist Items</h3>
                {job.checklistItems && job.checklistItems.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Completed</TableHead>
                              <TableHead>Verified</TableHead>
                              <TableHead>Photo</TableHead>
                              <TableHead>Notes</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {job.checklistItems.map((item: any) => (
                              <TableRow key={item.id}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell>
                                      {item.isCompleted ? (
                                        <span className="text-green-600">
                                          ✓ {item.completedBy?.name} ({new Date(item.completedAt).toLocaleString()})
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not completed</span>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                      {item.isVerified ? (
                                        <span className="text-blue-600">
                                          ✓ {item.verifiedBy?.name} ({new Date(item.verifiedAt).toLocaleString()})
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not verified</span>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                      {item.photoUrl ? (
                                        <a href={item.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                          View Photo
                                        </a>
                                      ) : (
                                        item.photoRequired ? <span className="text-red-600">Required</span> : <span className="text-gray-400">-</span>
                                      )}
                                  </TableCell>
                                  <TableCell>{item.notes || '-'}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm mt-2">No checklist items for this job.</p>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold">Job Progress Updates</h3>
                {job.statusUpdates && job.statusUpdates.length > 0 ? (
                  <div className="space-y-2">
                      {job.statusUpdates.map((update: any) => (
                          <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                              <div className="flex items-center gap-2">
                                  <span className="font-semibold">{update.status}</span>
                                  {update.progressPercent !== null && (
                                    <span className="text-sm text-gray-600">({update.progressPercent}%)</span>
                                  )}
                              </div>
                              {update.note && <p className="text-sm text-gray-700 mt-1">{update.note}</p>}
                              <p className="text-xs text-gray-500 mt-1">
                                  By {update.createdBy?.name} on {new Date(update.createdAt).toLocaleString()}
                              </p>
                          </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm mt-2">No status updates yet.</p>
                )}
            </div>
          </>
        )}
    </div>
  )
}