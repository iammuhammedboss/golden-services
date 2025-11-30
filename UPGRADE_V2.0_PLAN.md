# Golden Services v2.0 Implementation Plan

## Executive Summary

This document outlines the complete upgrade path from v1.3.0 to v2.0, introducing advanced operational features including enhanced site visits, job verification, scheduling, and financial tracking.

---

## I. Database Schema Changes

### A. New Models (8 new tables)

#### 1. MeasurementItem
Captures granular site measurement data during site visits.

```prisma
model MeasurementItem {
  id                String    @id @default(cuid())
  siteVisitId       String
  itemTypeId        String    // Links to ItemTypeMaster
  roomTypeId        String?   // Links to RoomTypeMaster
  quantity          Decimal   @db.Decimal(10, 2)
  size              String?   // e.g., "3ft x 4ft"
  customDescription String?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  deletedById       String?

  siteVisit  SiteVisit      @relation(fields: [siteVisitId], references: [id], onDelete: Cascade)
  itemType   ItemTypeMaster @relation(fields: [itemTypeId], references: [id])
  roomType   RoomTypeMaster? @relation(fields: [roomTypeId], references: [id])

  @@index([siteVisitId])
  @@index([itemTypeId])
  @@index([deletedAt])
  @@map("measurement_items")
}
```

#### 2. JobLaborTime
Tracks check-in/check-out times for team members on jobs.

```prisma
model JobLaborTime {
  id         String    @id @default(cuid())
  jobOrderId String
  userId     String
  checkInAt  DateTime
  checkOutAt DateTime?
  notes      String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?
  deletedById String?

  jobOrder JobOrder @relation(fields: [jobOrderId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])

  @@index([jobOrderId])
  @@index([userId])
  @@index([checkInAt])
  @@index([deletedAt])
  @@map("job_labor_times")
}
```

#### 3. JobChecklistTemplate
Master data for pre-defined checklist items per service type.

```prisma
model JobChecklistTemplate {
  id            String   @id @default(cuid())
  serviceId     String   // Links to Service
  name          String
  description   String?
  requiresPhoto Boolean  @default(false)
  sortOrder     Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  deletedById   String?

  service Service @relation(fields: [serviceId], references: [id])

  @@index([serviceId])
  @@index([isActive])
  @@index([deletedAt])
  @@map("job_checklist_templates")
}
```

#### 4. JobChecklistItem
Dynamic checklist items generated for each job.

```prisma
model JobChecklistItem {
  id            String    @id @default(cuid())
  jobOrderId    String
  templateId    String?   // Reference to template if generated from one
  description   String
  requiresPhoto Boolean   @default(false)
  isCompleted   Boolean   @default(false)
  completedAt   DateTime?
  completedById String?
  photoUrl      String?
  notes         String?
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  deletedById   String?

  jobOrder    JobOrder                @relation(fields: [jobOrderId], references: [id], onDelete: Cascade)
  template    JobChecklistTemplate?   @relation(fields: [templateId], references: [id])
  completedBy User?                   @relation(fields: [completedById], references: [id])

  @@index([jobOrderId])
  @@index([templateId])
  @@index([isCompleted])
  @@index([deletedAt])
  @@map("job_checklist_items")
}
```

#### 5. Reminder
For tracking follow-ups and internal reminders.

```prisma
model Reminder {
  id              String        @id @default(cuid())
  title           String
  description     String?
  dueAt           DateTime
  assignedToId    String
  createdById     String
  status          ReminderStatus @default(PENDING)
  priority        ReminderPriority @default(NORMAL)
  // Polymorphic relations
  relatedEntityType String?     // 'Lead', 'Client', 'Quotation', 'JobOrder'
  relatedEntityId   String?
  completedAt     DateTime?
  completedById   String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  deletedById     String?

  assignedTo  User  @relation("ReminderAssignee", fields: [assignedToId], references: [id])
  createdBy   User  @relation("ReminderCreator", fields: [createdById], references: [id])
  completedBy User? @relation("ReminderCompleter", fields: [completedById], references: [id])

  @@index([assignedToId])
  @@index([dueAt])
  @@index([status])
  @@index([relatedEntityType, relatedEntityId])
  @@index([deletedAt])
  @@map("reminders")
}

enum ReminderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ReminderPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### 6. PaymentLog
Tracks individual payments against invoices.

```prisma
model PaymentLog {
  id              String   @id @default(cuid())
  invoiceId       String
  amount          Decimal  @db.Decimal(10, 3)
  paymentMethodId String   // Links to PaymentMethodMaster
  paymentDate     DateTime
  referenceNumber String?
  notes           String?
  recordedById    String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
  deletedById     String?

  invoice       Invoice             @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  paymentMethod PaymentMethodMaster @relation(fields: [paymentMethodId], references: [id])
  recordedBy    User                @relation(fields: [recordedById], references: [id])

  @@index([invoiceId])
  @@index([paymentDate])
  @@index([deletedAt])
  @@map("payment_logs")
}
```

### B. Modified Models

#### 1. Photo Model - Add siteVisitId
```prisma
model Photo {
  id          String    @id @default(cuid())
  jobOrderId  String?   // Existing
  siteVisitId String?   // NEW - for site visit photos
  url         String
  description String?
  uploadedById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedById String?

  jobOrder   JobOrder?  @relation(fields: [jobOrderId], references: [id], onDelete: Cascade)
  siteVisit  SiteVisit? @relation(fields: [siteVisitId], references: [id], onDelete: Cascade)
  uploadedBy User       @relation(fields: [uploadedById], references: [id])

  @@index([jobOrderId])
  @@index([siteVisitId])  // NEW index
  @@index([deletedAt])
  @@map("photos")
}
```

#### 2. JobOrder Model - Add Two-Factor Confirmation
```prisma
model JobOrder {
  id                       String            @id @default(cuid())
  quotationId              String?
  clientId                 String
  siteId                   String
  jobNumber                String            @unique
  status                   JobOrderStatus    @default(SCHEDULED)
  scheduledDate            DateTime          @db.Date
  scheduledStartTime       DateTime?
  scheduledEndTime         DateTime?
  isMultiDay               Boolean           @default(false)
  endDate                  DateTime?         @db.Date
  materialsRequired        String?
  machineryRequired        String?
  notes                    String?

  // NEW - Two-Factor Completion Confirmation
  supervisorConfirmedAt    DateTime?
  supervisorConfirmedById  String?
  managerConfirmedAt       DateTime?
  managerConfirmedById     String?

  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt
  deletedAt                DateTime?
  deletedById              String?

  assignments        JobAssignment[]
  client             Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  quotation          Quotation?        @relation(fields: [quotationId], references: [id])
  site               Site              @relation(fields: [siteId], references: [id], onDelete: Cascade)
  statusUpdates      JobStatusUpdate[]
  photos             Photo[]
  invoices           Invoice[]
  checklistItems     JobChecklistItem[]  // NEW relation
  laborTimes         JobLaborTime[]      // NEW relation

  supervisorConfirmer User? @relation("SupervisorConfirmer", fields: [supervisorConfirmedById], references: [id])
  managerConfirmer    User? @relation("ManagerConfirmer", fields: [managerConfirmedById], references: [id])

  @@index([status])
  @@index([scheduledDate])
  @@index([clientId])
  @@index([siteId])
  @@index([quotationId])
  @@index([deletedAt])
  @@map("job_orders")
}
```

#### 3. JobAssignment - Add Assignment Type
```prisma
model JobAssignment {
  id             String          @id @default(cuid())
  jobOrderId     String
  userId         String
  roleInJob      JobRoleInJob
  assignmentType AssignmentType  @default(TECHNICIAN)  // NEW field
  assignedAt     DateTime        @default(now())
  deletedAt      DateTime?
  deletedById    String?

  jobOrder JobOrder @relation(fields: [jobOrderId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])

  @@unique([jobOrderId, userId])
  @@index([jobOrderId])
  @@index([userId])
  @@index([deletedAt])
  @@map("job_assignments")
}

enum AssignmentType {
  TECHNICIAN
  SUPERVISOR
  MANAGER
  OTHER
}
```

#### 4. Invoice - Add PARTIALLY_PAID Status
```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  PARTIALLY_PAID  // NEW
  PAID
  OVERDUE
  CANCELLED
}
```

#### 5. SiteVisit - Add Relation
```prisma
model SiteVisit {
  // ... existing fields ...

  measurementItems MeasurementItem[]  // NEW relation
  photos           Photo[]            // NEW relation

  // ... rest of model ...
}
```

#### 6. User - Add New Relations
```prisma
model User {
  // ... existing fields ...

  laborTimes              JobLaborTime[]
  checklistCompletions    JobChecklistItem[]
  remindersAssigned       Reminder[]          @relation("ReminderAssignee")
  remindersCreated        Reminder[]          @relation("ReminderCreator")
  remindersCompleted      Reminder[]          @relation("ReminderCompleter")
  paymentsRecorded        PaymentLog[]
  jobsSupervisorConfirmed JobOrder[]          @relation("SupervisorConfirmer")
  jobsManagerConfirmed    JobOrder[]          @relation("ManagerConfirmer")

  // ... rest of model ...
}
```

#### 7. ItemTypeMaster & RoomTypeMaster - Add Relations
```prisma
model ItemTypeMaster {
  // ... existing fields ...
  measurementItems MeasurementItem[]
  // ... rest of model ...
}

model RoomTypeMaster {
  // ... existing fields ...
  measurementItems MeasurementItem[]
  // ... rest of model ...
}
```

#### 8. Service - Add Relation
```prisma
model Service {
  // ... existing fields ...
  checklistTemplates JobChecklistTemplate[]
  // ... rest of model ...
}
```

#### 9. PaymentMethodMaster - Add Relation
```prisma
model PaymentMethodMaster {
  // ... existing fields ...
  paymentLogs PaymentLog[]
  // ... rest of model ...
}
```

---

## II. API Routes & Endpoints

### A. Measurement Management

#### POST /api/site-visits/[id]/measurements
Create multiple measurement items for a site visit.

**Request Body:**
```typescript
{
  measurements: [
    {
      itemTypeId: string;
      roomTypeId?: string;
      quantity: number;
      size?: string;
      customDescription?: string;
      notes?: string;
    }
  ]
}
```

**Response:**
```typescript
{
  success: boolean;
  measurements: MeasurementItem[];
  count: number;
}
```

#### GET /api/site-visits/[id]/measurements
Retrieve all measurements for a site visit.

#### GET /api/sites/[id]/latest-measurements
Get measurements from the most recent completed site visit for a site.

#### PATCH /api/measurements/[id]
Update a specific measurement item.

#### DELETE /api/measurements/[id]
Soft delete a measurement item.

### B. Photo Management

#### POST /api/site-visits/[id]/photos
Upload photos for a site visit.

**Request:** Multipart form data with photos

**Response:**
```typescript
{
  success: boolean;
  photos: Photo[];
}
```

### C. Job Checklist Management

#### POST /api/jobs/[id]/checklist/generate
Dynamically generate checklist items for a job based on services and quotation.

**Logic:**
1. Fetch JobOrder with quotation and services
2. For each service, find matching JobChecklistTemplates
3. Create JobChecklistItems based on templates
4. Return generated checklist

**Response:**
```typescript
{
  success: boolean;
  checklistItems: JobChecklistItem[];
  count: number;
}
```

#### GET /api/jobs/[id]/checklist
Retrieve all checklist items for a job.

#### PATCH /api/jobs/checklist-item/[id]/complete
Mark a checklist item as complete with photo evidence.

**Request Body:**
```typescript
{
  photoData?: string; // Base64 or upload
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  checklistItem: JobChecklistItem;
}
```

#### POST /api/jobs/checklist-item
Manually add a checklist item to a job.

### D. Labor Time Tracking

#### POST /api/jobs/labor/check-in
Record team member check-in.

**Request Body:**
```typescript
{
  jobOrderId: string;
  userId: string;
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  laborTime: JobLaborTime;
}
```

#### PATCH /api/jobs/labor/check-out
Record team member check-out.

**Request Body:**
```typescript
{
  laborTimeId: string;
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  laborTime: JobLaborTime;
  duration: number; // in minutes
}
```

#### GET /api/jobs/[id]/labor-times
Get all labor time records for a job.

### E. Job Confirmation

#### POST /api/jobs/[id]/confirm
Submit supervisor or manager confirmation for job completion.

**Request Body:**
```typescript
{
  confirmationType: 'SUPERVISOR' | 'MANAGER';
}
```

**Logic:**
1. Verify user has appropriate role
2. Check all checklist items are completed with photos (if required)
3. Record confirmation timestamp and user
4. If both confirmations present, update job status to COMPLETED

**Response:**
```typescript
{
  success: boolean;
  jobOrder: JobOrder;
  readyForCompletion: boolean;
  pendingConfirmations: string[];
}
```

### F. Reminder Management

#### POST /api/reminders
Create a new reminder.

#### GET /api/reminders
List reminders with filters.

**Query Params:**
- assignedToId
- status
- priority
- dueFrom, dueTo
- relatedEntityType, relatedEntityId

#### GET /api/reminders/[id]
Get reminder details.

#### PATCH /api/reminders/[id]
Update reminder.

#### DELETE /api/reminders/[id]
Soft delete reminder.

#### POST /api/reminders/[id]/complete
Mark reminder as completed.

### G. Payment Logging

#### POST /api/invoices/[id]/payments
Record a payment against an invoice.

**Request Body:**
```typescript
{
  amount: number;
  paymentMethodId: string;
  paymentDate: string; // ISO date
  referenceNumber?: string;
  notes?: string;
}
```

**Logic:**
1. Create PaymentLog entry
2. Calculate total paid amount
3. Update invoice status:
   - If total paid >= invoice total: PAID
   - If total paid > 0 but < invoice total: PARTIALLY_PAID
   - Otherwise: no change

**Response:**
```typescript
{
  success: boolean;
  paymentLog: PaymentLog;
  invoice: Invoice;
  totalPaid: number;
  remainingBalance: number;
}
```

#### GET /api/invoices/[id]/payments
Get all payment logs for an invoice.

### H. Schedule Aggregation

#### GET /api/schedule/upcoming
Get combined upcoming items (site visits, jobs, reminders).

**Query Params:**
- from, to (date range)
- types[] (filter by type)

**Response:**
```typescript
{
  siteVisits: SiteVisit[];
  jobOrders: JobOrder[];
  reminders: Reminder[];
}
```

---

## III. Core Logic & Services

### A. lib/checklist-generator.ts

```typescript
import { prisma } from '@/lib/prisma'

export async function generateJobChecklist(jobOrderId: string, createdById: string) {
  // 1. Fetch job order with quotation and items
  const job = await prisma.jobOrder.findUnique({
    where: { id: jobOrderId },
    include: {
      quotation: {
        include: {
          items: {
            include: {
              service: true
            }
          }
        }
      }
    }
  })

  if (!job) throw new Error('Job order not found')
  if (!job.quotation) throw new Error('Job has no associated quotation')

  // 2. Get unique services from quotation items
  const serviceIds = [...new Set(
    job.quotation.items
      .filter(item => item.serviceId)
      .map(item => item.serviceId!)
  )]

  // 3. Fetch checklist templates for these services
  const templates = await prisma.jobChecklistTemplate.findMany({
    where: {
      serviceId: { in: serviceIds },
      isActive: true,
      deletedAt: null
    },
    orderBy: {
      sortOrder: 'asc'
    }
  })

  // 4. Create checklist items
  const checklistItems = await Promise.all(
    templates.map((template, index) =>
      prisma.jobChecklistItem.create({
        data: {
          jobOrderId,
          templateId: template.id,
          description: template.description || template.name,
          requiresPhoto: template.requiresPhoto,
          sortOrder: index,
        }
      })
    )
  )

  return checklistItems
}

export async function canCompleteJob(jobOrderId: string): Promise<{
  canComplete: boolean;
  reasons: string[];
}> {
  const reasons: string[] = []

  // Check all checklist items are completed
  const incompleteItems = await prisma.jobChecklistItem.count({
    where: {
      jobOrderId,
      isCompleted: false,
      deletedAt: null
    }
  })

  if (incompleteItems > 0) {
    reasons.push(`${incompleteItems} checklist items not completed`)
  }

  // Check items requiring photos have photos
  const itemsNeedingPhotos = await prisma.jobChecklistItem.count({
    where: {
      jobOrderId,
      requiresPhoto: true,
      photoUrl: null,
      deletedAt: null
    }
  })

  if (itemsNeedingPhotos > 0) {
    reasons.push(`${itemsNeedingPhotos} checklist items require photo evidence`)
  }

  return {
    canComplete: reasons.length === 0,
    reasons
  }
}
```

### B. lib/job-workflow.ts

```typescript
import { prisma } from '@/lib/prisma'
import { canCompleteJob } from './checklist-generator'

export async function confirmJobBySupervisor(
  jobOrderId: string,
  supervisorId: string
) {
  // Verify user is a supervisor
  const user = await prisma.user.findUnique({
    where: { id: supervisorId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  })

  const hasRole = user?.roles.some(
    r => r.role.name === 'SUPERVISOR' || r.role.name === 'OPERATIONS_MANAGER'
  )

  if (!hasRole) {
    throw new Error('User does not have supervisor permissions')
  }

  // Check if checklist is complete
  const { canComplete, reasons } = await canCompleteJob(jobOrderId)
  if (!canComplete) {
    throw new Error(`Cannot confirm job: ${reasons.join(', ')}`)
  }

  // Record supervisor confirmation
  const job = await prisma.jobOrder.update({
    where: { id: jobOrderId },
    data: {
      supervisorConfirmedAt: new Date(),
      supervisorConfirmedById: supervisorId
    },
    include: {
      supervisorConfirmer: true,
      managerConfirmer: true
    }
  })

  return job
}

export async function confirmJobByManager(
  jobOrderId: string,
  managerId: string
) {
  // Verify user is a manager
  const user = await prisma.user.findUnique({
    where: { id: managerId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  })

  const hasRole = user?.roles.some(
    r => r.role.name === 'OPERATIONS_MANAGER' || r.role.name === 'OWNER'
  )

  if (!hasRole) {
    throw new Error('User does not have manager permissions')
  }

  // Record manager confirmation
  const job = await prisma.jobOrder.update({
    where: { id: jobOrderId },
    data: {
      managerConfirmedAt: new Date(),
      managerConfirmedById: managerId
    },
    include: {
      supervisorConfirmer: true,
      managerConfirmer: true
    }
  })

  // If both confirmations present, mark job as completed
  if (job.supervisorConfirmedAt && job.managerConfirmedAt) {
    await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: {
        status: 'COMPLETED'
      }
    })
  }

  return job
}

export async function getJobCompletionStatus(jobOrderId: string) {
  const job = await prisma.jobOrder.findUnique({
    where: { id: jobOrderId },
    include: {
      supervisorConfirmer: {
        select: { name: true, email: true }
      },
      managerConfirmer: {
        select: { name: true, email: true }
      }
    }
  })

  if (!job) throw new Error('Job not found')

  const { canComplete, reasons } = await canCompleteJob(jobOrderId)

  return {
    job,
    checklistComplete: canComplete,
    checklistIssues: reasons,
    supervisorConfirmed: !!job.supervisorConfirmedAt,
    managerConfirmed: !!job.managerConfirmedAt,
    readyForCompletion: canComplete &&
                        !!job.supervisorConfirmedAt &&
                        !!job.managerConfirmedAt
  }
}
```

### C. lib/invoice-calculator.ts

```typescript
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function calculateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      payments: {
        where: {
          deletedAt: null
        }
      }
    }
  })

  if (!invoice) throw new Error('Invoice not found')

  // Calculate total invoice amount
  const totalAmount = invoice.items.reduce(
    (sum, item) => sum.add(item.total),
    new Decimal(0)
  )

  // Calculate total paid
  const totalPaid = invoice.payments.reduce(
    (sum, payment) => sum.add(payment.amount),
    new Decimal(0)
  )

  const remainingBalance = totalAmount.sub(totalPaid)

  // Determine status
  let status = invoice.status
  if (totalPaid.greaterThanOrEqualTo(totalAmount)) {
    status = 'PAID'
  } else if (totalPaid.greaterThan(0)) {
    status = 'PARTIALLY_PAID'
  }

  return {
    totalAmount: totalAmount.toNumber(),
    totalPaid: totalPaid.toNumber(),
    remainingBalance: remainingBalance.toNumber(),
    suggestedStatus: status,
    payments: invoice.payments
  }
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  paymentMethodId: string,
  paymentDate: Date,
  recordedById: string,
  referenceNumber?: string,
  notes?: string
) {
  // Create payment log
  const payment = await prisma.paymentLog.create({
    data: {
      invoiceId,
      amount: new Decimal(amount),
      paymentMethodId,
      paymentDate,
      referenceNumber,
      notes,
      recordedById
    }
  })

  // Recalculate and update invoice status
  const { suggestedStatus } = await calculateInvoicePaymentStatus(invoiceId)

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: suggestedStatus
    }
  })

  return payment
}
```

---

## IV. UI/UX Implementation

### A. Site Visit Detail Page Enhancements
**File:** `app/[locale]/(admin)/admin/site-visits/[id]/page.tsx`

**New Sections:**
1. Measurements Tab
2. Photos Gallery
3. Generate Quotation from Measurements button

**Components Needed:**
- `components/measurement-form.tsx` - Dynamic form for adding measurements
- `components/measurement-list.tsx` - Display measurements in table
- `components/photo-upload.tsx` - Multi-photo upload component

### B. Job Detail Page Enhancements
**File:** `app/[locale]/(admin)/admin/jobs/[id]/page.tsx`

**New Sections:**
1. Team Check-in/Check-out Interface
2. Dynamic Checklist with Photo Upload
3. Two-Factor Confirmation Cards
4. Labor Time Summary

**Components Needed:**
- `components/job-team-tracker.tsx` - Check-in/out UI
- `components/job-checklist.tsx` - Interactive checklist
- `components/job-confirmation-panel.tsx` - Confirmation interface
- `components/labor-time-summary.tsx` - Display labor hours

### C. Schedule Dashboard Updates
**File:** `app/[locale]/(admin)/admin/schedule/page.tsx`

**Updates:**
- Add Reminders section
- Aggregate view showing all three types (Visits, Jobs, Reminders)
- Filter by type
- Color-coding by entity type

**Components Needed:**
- `components/schedule-calendar.tsx` - Enhanced calendar
- `components/reminder-list.tsx` - Reminders display
- `components/add-reminder-dialog.tsx` - Create reminder

### D. Invoice Detail Page Enhancements
**File:** `app/[locale]/(admin)/admin/invoices/[id]/page.tsx`

**New Sections:**
1. Payment Log Table
2. Add Payment Form
3. Payment Summary (Total Paid, Remaining Balance)

**Components Needed:**
- `components/payment-log-table.tsx`
- `components/record-payment-dialog.tsx`
- `components/invoice-payment-summary.tsx`

---

## V. Implementation Phases

### Phase 1: Database & Core Logic (Week 1-2)
1. Update Prisma schema with all new models
2. Run migrations
3. Implement core logic files (checklist-generator, job-workflow, invoice-calculator)
4. Test with Prisma Studio

### Phase 2: API Routes (Week 2-3)
1. Implement measurement APIs
2. Implement checklist APIs
3. Implement labor tracking APIs
4. Implement reminder APIs
5. Implement payment logging APIs
6. Test with Postman/Thunder Client

### Phase 3: UI Components (Week 3-5)
1. Create all new components
2. Update existing detail pages
3. Build forms and dialogs
4. Implement photo upload functionality

### Phase 4: Integration & Testing (Week 5-6)
1. End-to-end workflow testing
2. Permission/role testing
3. Data validation
4. Performance optimization

### Phase 5: Documentation & Training (Week 6-7)
1. Update user documentation
2. Create admin training materials
3. Record workflow videos
4. Prepare deployment checklist

---

## VI. Migration Scripts

### Initial Data Population

```typescript
// scripts/populate-checklist-templates.ts
import { prisma } from '@/lib/prisma'

async function populateChecklistTemplates() {
  // Example: Cleaning service templates
  const cleaningService = await prisma.service.findFirst({
    where: { name: { contains: 'Cleaning' } }
  })

  if (cleaningService) {
    await prisma.jobChecklistTemplate.createMany({
      data: [
        {
          serviceId: cleaningService.id,
          name: 'Pre-job site inspection',
          description: 'Inspect site and note any pre-existing damage',
          requiresPhoto: true,
          sortOrder: 1
        },
        {
          serviceId: cleaningService.id,
          name: 'Vacuum all carpeted areas',
          description: 'Thoroughly vacuum all carpets and rugs',
          requiresPhoto: false,
          sortOrder: 2
        },
        {
          serviceId: cleaningService.id,
          name: 'Clean all windows',
          description: 'Clean interior and exterior of all windows',
          requiresPhoto: true,
          sortOrder: 3
        },
        {
          serviceId: cleaningService.id,
          name: 'Post-job quality check',
          description: 'Final inspection and photo documentation',
          requiresPhoto: true,
          sortOrder: 99
        }
      ]
    })
  }
}

populateChecklistTemplates()
  .then(() => console.log('Templates populated'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## VII. Testing Checklist

- [ ] All new models can be created, read, updated, deleted
- [ ] Soft delete works for all new models
- [ ] Measurements can be added to site visits
- [ ] Photos can be uploaded for site visits
- [ ] Checklist auto-generates based on job services
- [ ] Checklist items can be marked complete with photos
- [ ] Labor time check-in/check-out works
- [ ] Two-factor confirmation prevents premature job completion
- [ ] Both confirmations allow job to be marked COMPLETED
- [ ] Reminders can be created and assigned
- [ ] Schedule dashboard shows all entity types
- [ ] Payments can be recorded against invoices
- [ ] Invoice status updates to PARTIALLY_PAID correctly
- [ ] Invoice status updates to PAID when fully paid
- [ ] All audit logs are created for new entities
- [ ] Permission checks work for all new endpoints
- [ ] Mobile responsiveness for all new UI components

---

## VIII. Security Considerations

1. **Photo Upload:**
   - Implement file size limits (max 5MB per photo)
   - Validate file types (only jpg, png, webp)
   - Sanitize filenames
   - Store in secure cloud storage (S3, Cloudinary)

2. **Two-Factor Confirmation:**
   - Ensure different users for each confirmation
   - Log all confirmation attempts
   - Prevent backdating of confirmations

3. **Payment Logging:**
   - Validate payment amounts (no negative payments)
   - Prevent overpayment beyond invoice total
   - Audit trail for all payment records
   - Reference number validation for bank transfers

4. **API Rate Limiting:**
   - Implement rate limits on photo uploads
   - Throttle checklist generation API

---

## IX. Performance Optimizations

1. **Database Indexes:**
   - All foreign keys indexed
   - Date fields for scheduling indexed
   - Status fields indexed

2. **Query Optimization:**
   - Use `select` to limit returned fields
   - Implement pagination for large lists
   - Cache frequently accessed master data

3. **Photo Handling:**
   - Compress images before upload
   - Generate thumbnails for gallery views
   - Lazy load images on detail pages

---

## X. Rollback Plan

If issues arise during deployment:

1. **Database:** Keep migrations reversible
2. **API:** Version endpoints (v1, v2)
3. **UI:** Feature flags for new components
4. **Data:** Backup database before migration

---

**END OF IMPLEMENTATION PLAN**

This document should be reviewed and approved before beginning implementation.
Contact the development team for questions or clarifications.
