# Golden Services - Quick Start Guide

## Step 1: Create the Seed File

1. Open `SEED_FILE_CONTENT.md` in this directory
2. Copy the entire TypeScript code (starting from `import { PrismaClient }...`)
3. Delete the existing empty `prisma/seed.ts` file
4. Create a new file `prisma/seed.ts` and paste the content

## Step 2: Set Up Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/golden_services"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Set Up Database

```bash
# Generate Prisma Client
npm run postinstall

# Push schema to database
npm run db:push

# Seed the database
npm run db:seed
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Default Login Credentials

- **Email:** admin@goldenservices.test
- **Password:** Admin123!

## What's Included

### Roles Created
- OWNER (full access)
- OPERATIONS_MANAGER (operations & jobs)
- SALES (leads & quotations)
- SUPERVISOR (field operations)
- CLEANER (service delivery)
- ACCOUNTANT (finance)
- RECEPTION (customer support)
- AUDITOR (quality control)

### Service Categories
1. **Cleaning Services** - 9 services
   - Sofa, Carpet, Mattress, Deep Cleaning, Office, Kitchen, Bathroom, Window, Curtain
2. **Pest Control** - 4 services
   - General Pest Control, Termite Treatment, Rodent Control, Fumigation
3. **Water Tank Services** - 2 services
   - Water Tank Cleaning, Water Tank Disinfection
4. **Manpower Services** - 3 services
   - Cleaner Supply, Supervisor Supply, Helper Supply

### Pricing Types
- PER_UNIT - Per item (sofa seats, mattresses, etc.)
- PER_SQM - Per square meter
- PER_HOUR - Hourly rate
- PER_VISIT - Per service visit
- LUMP_SUM - Fixed price

## Key Files Reference

### Authentication
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth API route
- `components/providers/auth-provider.tsx` - Session provider

### Database
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Initial data

### Utilities
- `lib/utils.ts` - Helper functions (formatting, validation)
- `lib/permissions.ts` - Role-based access control

### Styles
- `app/globals.css` - Global styles and Tailwind config
- `app/layout.tsx` - Root layout

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run lint             # Run ESLint
```

## Next Steps

1. Create login page (`app/login/page.tsx`)
2. Create dashboard (`app/(admin)/dashboard/page.tsx`)
3. Implement leads management
4. Implement quotation system
5. Implement job order system
6. Add reporting features

## Troubleshooting

### "Cannot find module '@/lib/prisma'"
Run: `npm run postinstall` to generate Prisma Client

### "Invalid credentials" when logging in
Make sure you ran: `npm run db:seed`

### Database connection errors
Check your DATABASE_URL in `.env` file

### NextAuth errors
Ensure NEXTAUTH_SECRET is set and NEXTAUTH_URL is correct

## Project Structure

```
golden-services/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (admin)/          # Admin dashboard (protected)
│   ├── (public)/         # Public pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # React components
│   └── providers/        # Context providers
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication
│   ├── prisma.ts         # Database client
│   ├── permissions.ts    # Authorization
│   └── utils.ts          # Helper functions
├── prisma/               # Database
│   ├── schema.prisma     # Schema definition
│   └── seed.ts           # Seed data
├── public/               # Static assets
└── package.json          # Dependencies

```

## Support

For detailed information, see:
- `FILES_CREATED_SUMMARY.md` - Complete file documentation
- `SEED_FILE_CONTENT.md` - Seed file content
- `README.md` - Project overview (if created)

## Security Notes

- Change admin password after first login
- Never commit `.env` file
- Use strong NEXTAUTH_SECRET in production
- Enable HTTPS in production
- Implement rate limiting for API routes
- Regular security updates for dependencies

---

Happy coding! Your Golden Services project is ready to go!
