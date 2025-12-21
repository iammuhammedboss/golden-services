'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobOrder, Client, Quotation, Measurement, User, MaterialMaster, EquipmentMaster } from '@prisma/client'
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

type JobWithRelations = JobOrder & {
  client: Client | null
  quotation: Quotation | null,
  measurement: Measurement | null,
  assignments: any[],
  materials: any[],
  equipment: any[],
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
        materials: [...job.materials, { materialId: '', quantity: 1 }]
    })
    }

    const addEquipment = () => {
    if(!job) return;
    setJob({
        ...job,
        equipment: [...job.equipment, { equipmentId: '', quantity: 1 }]
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

        <div className="grid grid-cols-2 gap-4">
            {/* Header fields */}
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
                                <Input value={assignment.roleInJob} />
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
                                <Input type="number" value={material.quantity} />
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
                                <Input type="number" value={eq.quantity} />
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
    </div>
  )
}