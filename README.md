# Golden Services Company - Full Stack Web Application

A comprehensive web application for a cleaning & pest control company built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Public Website
- Multi-language Ready: English + Arabic (RTL support ready)
- Service Pages: Browse cleaning, pest control, water tank, and manpower services
- Lead Generation: Contact and Book Now forms create leads in the system
- Floating WhatsApp Button: Quick contact on all pages
- Responsive Design: Mobile-first, works on all devices

### Internal Admin System
- Role-Based Access Control: 8 predefined roles with granular permissions
- User Management: Create users with multiple roles
- CRM Module: Lead management, Client profiles, Site management
- Operations Module: Site visits, Measurements, Photos, Quotations, Job orders
- Dashboard: Key metrics and recent activity

## Tech Stack

- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: NextAuth (Auth.js)
- Styling: Tailwind CSS
- UI Components: Custom components (shadcn/ui style)

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL 14.x or higher

## Installation & Setup

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Log into PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE golden_services;

# Exit
\q
```

### 2. Environment Configuration

Update `.env` with your database credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/golden_services?schema=public"
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXT_PUBLIC_WHATSAPP_NUMBER="96812345678"
```

Replace YOUR_USERNAME and YOUR_PASSWORD with your PostgreSQL credentials.

### 3. Install Dependencies

Dependencies are already installed. To reinstall:

```bash
npm install
```

### 4. Database Migration & Seeding

```bash
# Generate Prisma Client
npm run postinstall

# Push schema to database
npm run db:push

# Seed the database
npm run db:seed
```

The seed creates:
- 8 Roles
- 1 Admin User
- 4 Service Categories
- 18 Services with pricing

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Default Login Credentials

Email: admin@goldenservices.test
Password: Admin123!

**Change this password in production!**

## Project Structure

```
golden-services/
├── app/
│   ├── (public)/              # Public website pages
│   │   ├── page.tsx           # Home
│   │   ├── services/          # Services
│   │   ├── about/             # About
│   │   ├── contact/           # Contact
│   │   ├── book-now/          # Booking
│   │   └── faq/               # FAQ
│   ├── (admin)/admin/         # Admin pages
│   │   ├── dashboard/         # Dashboard
│   │   ├── leads/             # Leads
│   │   ├── clients/           # Clients
│   │   ├── sites/             # Sites
│   │   ├── site-visits/       # Site Visits
│   │   ├── quotations/        # Quotations
│   │   ├── jobs/              # Jobs
│   │   └── users/             # Users
│   ├── login/                 # Login
│   └── api/                   # API routes
├── components/
│   ├── ui/                    # UI components
│   ├── public-header.tsx      # Public header
│   ├── public-footer.tsx      # Public footer
│   ├── admin-sidebar.tsx      # Admin sidebar
│   └── whatsapp-button.tsx    # WhatsApp button
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── prisma.ts              # Prisma client
│   ├── permissions.ts         # Permissions
│   └── utils.ts               # Utilities
└── prisma/
    ├── schema.prisma          # Database schema
    └── seed.ts                # Seed script
```

## Available Scripts

```bash
npm run dev              # Development server
npm run build            # Build for production
npm run start            # Start production
npm run lint             # ESLint
npm run db:push          # Push schema to DB
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Prisma Studio GUI
```

## User Roles

1. **OWNER** - Full system access
2. **OPERATIONS_MANAGER** - Manage operations, leads, jobs, quotations
3. **SALES** - Manage leads, clients, sites, quotations
4. **SUPERVISOR** - View/update assigned jobs, upload photos
5. **CLEANER** - View assigned jobs, basic updates
6. **ACCOUNTANT** - View quotations (invoices coming soon)
7. **RECEPTION** - Create leads, view calendar
8. **AUDITOR** - Read-only access to all modules

## Public Pages

- / - Home with services overview
- /services - All services by category
- /services/[slug] - Service details
- /about - Company information
- /contact - Contact form (creates Lead)
- /book-now - Booking form (creates Lead + Site Visit)
- /faq - FAQ

## Admin Pages

- /admin/dashboard - Overview with stats
- /admin/leads - Lead management
- /admin/clients - Client management
- /admin/sites - Site management
- /admin/site-visits - Site visit scheduling
- /admin/quotations - Quotations
- /admin/invoices - Invoice management (NEW)
- /admin/jobs - Job orders and assignments
- /admin/jobs/calendar - Calendar view for job scheduling (NEW)
- /admin/users - User management (OWNER only)

## Typical Workflow

1. Lead comes in (Website/WhatsApp/Phone)
2. Lead created by Reception or Sales
3. Site Visit scheduled
4. Site Visit completed with measurements/photos
5. Quotation created
6. Quotation sent to client
7. Job Order created when accepted
8. Team assigned to job
9. Job executed with updates and photos
10. Invoice generated and sent to client (NEW)
11. Payment tracking and status updates

## Database Models

- User Management: Users, Roles, UserRoles
- CRM: Leads, Clients, Sites
- Operations: SiteVisits, MeasurementItems, Photos
- Services: ServiceCategories, Services, PricingRules
- Sales: Quotations, QuotationItems
- Finance: Invoices, InvoiceItems (NEW)
- Jobs: JobOrders, JobAssignments, JobStatusUpdates

## New Features (v1.1.0)

### Invoice Module

The Invoice module provides complete invoicing capabilities:

**Features:**
- Generate invoices from quotations or job orders
- Track invoice status: DRAFT, SENT, PAID, OVERDUE, CANCELLED
- Automatic invoice numbering (INV-YYYYMMDD-XXX format)
- Line-item management with quantities and pricing
- Tax calculation support
- Due date tracking
- Revenue reporting

**Permissions:**
- **OWNER**: Full access to all invoice functions
- **ACCOUNTANT**: Full access to invoices
- **SALES**: Can create and manage invoices
- **OPERATIONS_MANAGER**: Read-only access to invoices

**API Endpoints:**
- `GET /api/invoices` - List all invoices with filtering
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PATCH /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice (except PAID)

**Usage:**
1. Navigate to /admin/invoices
2. Click "New Invoice" to create from scratch or from a quotation
3. Add line items with descriptions, quantities, and prices
4. Set due date and status
5. Save and send to client

### Calendar View for Job Scheduling

Visual calendar interface for job order management:

**Features:**
- Month, Week, and Day views
- Color-coded by job status:
  - Blue: Scheduled
  - Orange: In Progress
  - Green: Completed
  - Red: Cancelled
- Click events to view job details
- Filter by status and assigned staff
- Real-time schedule visualization

**Access:**
- Navigate to /admin/jobs
- Click "Calendar View" button
- Switch between Month/Week/Day views as needed

**Permissions:**
- **OPERATIONS_MANAGER**: Full access
- **SUPERVISOR**: Full access
- **OWNER**: Full access

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U postgres -d golden_services -c "SELECT NOW();"
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Port Already in Use
```bash
npx kill-port 3000
# Or
PORT=3001 npm run dev
```

### Reset Database (DELETES ALL DATA)
```bash
npx prisma migrate reset
npm run db:seed
```

## Security

- Passwords hashed with bcrypt
- JWT sessions (30-day expiry)
- API route authentication
- Role-based access control
- SQL injection protection (Prisma)
- XSS protection (React)
- CSRF protection (NextAuth)

## Known Issues / To-Do

### Button Functionality
Several "Add" and "View" buttons in admin pages currently don't have functionality:
- **Add Lead, New Client, New Site, New Job, New User buttons**: Need form dialogs or pages
- **View buttons in tables**: Need detail pages or slide-over panels

These can be implemented by:
1. Creating form dialog components (using existing Dialog UI component)
2. Adding detail pages for each entity (e.g., `/admin/leads/[id]`)
3. Implementing create/edit API logic

Example implementation approach:
- Use React Hook Form + Zod for validation
- Create reusable Dialog components
- Add navigation to detail pages for View buttons

## Future Enhancements

- Complete CRUD forms for all entities (Leads, Clients, Sites, Jobs, Users)
- Detail pages for viewing/editing individual records
- Attendance tracking
- Inventory management
- SMS/Email notifications
- Mobile app
- PDF reports
- Advanced analytics
- WhatsApp Business API
- Calendar sync

## License

Proprietary - Golden Services Company

## Version

1.0.0 (MVP)

---

**Need Help?** Contact your system administrator.
