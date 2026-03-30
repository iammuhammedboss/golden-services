Comprehensive Product Requirements Document (PRD)
Project: Golden Services Operations App
Business Type: Commercial & Residential Cleaning Services
Architecture: Responsive Web Application (Mobile-first for field workers, Desktop for office admin)

1. System Entry & User Roles
Authentication: The system sits behind a secure login. (For MVP development, mock a simple auth state to test role-based access).

Roles & Permissions:

Admin/Manager (Office): Full access. Creates/edits Master Data, views global schedules, approves quotations, manages AMC schedules, and oversees all job statuses.

Sales Executive (Field): Creates Site Visits, inputs Measurements, uploads photos/audio notes, and generates Draft Quotations. Views personal schedule.

Technician (Field): Receives assigned Job Orders. Can update progress, upload "Before/During/After" photos, and log payment collections.

2. Settings & Master Data Management (MDM)
Admin-only configuration area for app-wide dropdowns and pricing.

Service Category Master: Sofa Cleaning, Carpet Cleaning, Villa Cleaning, AMC Pest Control, etc.

Cleaning Type Master: General Cleaning, Deep Cleaning.

Item Master: Window (S, M, L), Sofa (1-seater, L-Shape), Room, Apartment (1BHK, 2BHK).

Dirt Level Master: Light, Medium, Heavy, Hazardous.

Price Master: Relational table linking Service Category + Item/Size + Cleaning Type = Standard Price. Used for auto-calculating quotes.

3. Site Visit & Measurement Module
Mobile-optimized workflow for Sales Executives arriving at a client location.

Lead Creation: Customer Name, Phone, Location (GPS/Manual), Service Categories.

AMC Toggle: Checkbox for Annual Maintenance Contracts. Reveals Frequency (Weekly/Monthly/Quarterly) and Duration dropdowns.

Hierarchical Scoping: * Add "Area/Room" (e.g., Master Bedroom).

Add "Items" inside the Area (e.g., Carpet, Sofa) with Size, Cleaning Type, and Dirt Level.

Rapid Media Capture: Next to every Item is a Camera icon (for photos/video with text remarks) and a Mic icon (for WhatsApp-style voice notes).

Global Media Capture: Ability to upload general room photos or voice notes without linking to a specific item.

4. Quotation Engine & PDF Generation
Converts field measurements into financial proposals.

Auto-Pricing: Pulls from Price Master based on entered items. Allows manual override.

Financials: Calculates Subtotal, applies flat/percentage Discount, and strictly adds 5% VAT to the post-discount subtotal.

Customer Display Toggles:

Option A (Detailed): Shows all Rooms -> Items -> Qty -> Unit Price -> Line Total.

Option B (Grouped): Shows Rooms/Categories and Qty, but hides individual unit prices.

Option C (Lumpsum): Shows scope of work in description, but only displays one Grand Total price at the bottom.

PDF Formatting Rules (Crucial):

Letterhead Compatibility: First page must have a strict top margin (e.g., 120mm) to allow printing on physical company letterhead.

Transparency: All tables, rows, and text backgrounds in the PDF must be transparent (opacity: 0) so the physical letterhead logo/watermark shows through.

Smart Page Breaks: Prevent table rows from splitting across pages.

5. Job Order Form (Dispatch)
Manager allocates resources to an Approved Quotation.

Logistics: Select Date, Start Time, and Duration.

Assignment: Multi-select to assign specific Technicians, Vehicles, and required Machinery/Equipment (e.g., Steam Cleaner).

Status: Marks job as Scheduled.

6. Technician Field UI (Execution Tracking)
Mobile view for the cleaning crew.

WhatsApp-Style Job Feed: Technicians tap status buttons (Dispatched, Arrived, Started Work) which update a timeline.

Live Progress: A 0-100% visual slider to indicate job completion.

Media Evidence: Mandatory photo uploads tagged as Before, During, or After. Can be linked to specific items or the general job.

On-the-Fly Additions: Ability to add new items/measurements to the Job Order if the customer requests extra work on-site.

7. Completion & Payments
Finish Job Protocol: Technician taps "Finish Job". System warns if progress is not 100%.

Payment Alert Modal: Immediately asks for payment status before closing the job:

Later: Status -> Completed - Payment Pending.

Paid Cash: Input amount collected. Status -> Completed - Paid.

Shared Screenshot: Upload WhatsApp receipt of bank transfer. Status -> Completed - Paid (Pending Admin Verification).

8. Schedules & Reminders
Global Calendar: Manager view showing all Scheduled Jobs, Site Visits, and AMC recurring visits.

AMC Auto-Scheduling: When an AMC Quote is approved, the backend automatically generates future Job_Orders based on the contract frequency.

Private Reminders: A personal notes/calendar section for each user to add reminders tied strictly to their user_id.

9. AI Developer Instructions & Technical Constraints
Database Relational Integrity: Implement a polymorphic relationship for the Media table (id, file_url, media_type, linked_entity_type, linked_entity_id). This allows media to attach to Site Visits, Measurement Items, or Job Updates.

PDF Generation: Use a robust library like pdfmake to handle the transparent backgrounds, strict margins, and complex table pagination.

Real-Time State Management: Use WebSockets or real-time database listeners (e.g., Supabase Realtime) for the Job Feed so Manager dashboards update instantly when field technicians post photos or change statuses.

Tax Variable: Store the 5% VAT rate in a global settings table, not hardcoded into the math logic.

10. Implementation Decisions (Confirmed 2026-03-30)

Price Master: SKIPPED — no auto-pricing. All pricing is free-form/manual entry by the person creating the quotation.

AMC Module (High Priority): Build AMC toggle on quotations with Frequency (Weekly/Monthly/Quarterly) and Duration fields. When an AMC quote is approved, the backend auto-generates recurring Job Orders based on the contract frequency.

Real-Time Updates: Full WebSocket/SSE implementation. Manager dashboards update instantly when field technicians post status changes, photos, or progress updates. No polling fallback.

Media Capture: Support photo uploads, video uploads, AND in-browser audio voice notes (WhatsApp-style, unlimited duration). Camera and Mic icons next to every measurement item as described in Section 3. All media stored via Cloudinary.

On-Site Additions & Deductions: Technicians/drivers can ADD new items (with manually entered price) and DEDUCT/remove items (with selectable reason) from a Job Order on-site. All changes are audit-logged with who/when/what. The job price updates in real-time but full history is preserved. No customer signature or approval required. No manager intervention needed.

Payments:
- Payment Methods (all configurable in Master Data, not hardcoded):
  - Cash — direct collection
  - Transfer via Mobile — sub-options: Boss, Tufool, Hossam, Tanveer, Custom (admin-configurable)
  - Transfer via Account — sub-options: Golden Services, Golden Elevators, Ahlam Dhofar, Boss AC, Tufool AC, Custom (admin-configurable)
  - Credit — requires Sales Executive approval; job closes as "Credit - Pending Approval", notification sent immediately
- Partial Payments: Supported. Customer can split across multiple methods (e.g., 500 cash + 300 mobile transfer + rest credit). Each portion logged separately.
- Payment Collector Role: New 9th role. Can see job value/amount due and payment history. Focused collection role.

Location & GPS: Capture GPS coordinates via browser Geolocation API. Display on Google Maps with adjustable pin for leads and site visits. Also allow manual text address entry as fallback.

Notifications: In-app only — notification bell with badge count. No WhatsApp or email delivery. Notification table already exists in schema.

Offline Support: Required for ALL field roles (Sales Executive, Technician/Cleaner, Supervisor, Payment Collector). Service worker + local queue that syncs when connectivity returns. Visual indicator showing offline status and pending sync count. Field workers may have WiFi-only devices with no mobile data.

11. Build Status & Remaining Work

Already Built:
- Authentication & role-based access control (8 roles: Owner, Operations Manager, Sales, Supervisor, Cleaner, Accountant, Reception, Auditor)
- Lead management with conversion to clients
- Client CRM with full profiles and ledger
- Hierarchical measurements (rooms → items with nesting)
- Site visits with scheduling
- Quotation engine with 3 display modes (Detailed/Grouped/Lumpsum) + PDF generation
- Job order creation and assignment
- Master data management (units, items, equipment, materials, room types, payment methods)
- Calendar/schedule management
- Invoice generation with PDF
- Photo uploads via Cloudinary
- Soft delete with audit logs
- Multi-language support (English + Arabic RTL)
- 62 API endpoints

Remaining to Build (Priority Order):
1. AMC Module — toggle, frequency, duration, auto-scheduling of recurring Job Orders
2. WebSocket Real-Time Updates — live job feed for manager dashboard
3. Technician Field UI — WhatsApp-style job feed, manual 0-100% progress slider, Before/During/After photos
4. On-Site Additions & Deductions — technician adds/removes items with audit logging, price updates with history
5. Audio Voice Notes — in-browser recording (unlimited duration) for measurements and field work
6. GPS + Google Maps — browser geolocation capture with map display and pin adjustment
7. Payment System — configurable payment methods (Cash/Mobile/Account/Credit), partial payments, Payment Collector role
8. Offline Support — service worker, local queue, sync indicator for all field roles
9. In-App Notifications — bell icon with badge count, notification delivery from existing table
10. Private User Reminders — personal notes/calendar tied to user_id

