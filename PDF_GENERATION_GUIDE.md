# PDF Generation Guide

## Overview

The invoice and quotation PDF generation system has been enhanced with three different modes and sales executive tracking.

## Features

### 1. Invoice Number Format

Invoices now use the format: `GSINV-XXXXXXXXXX`

Example: `GSINV-0000000001`

The number is sequential and padded to 10 digits.

### 2. Sales Executive Tracking

Sales executives are automatically identified based on the user who created the invoice/quotation:

- **Jesfin** → `JS-2399`
- **Hossam** → `HS-2398`
- **Ashlin** → `AS-2397`

The sales executive ID is displayed on all PDF documents.

### 3. PDF Generation Modes

Three modes are available for both invoices and quotations:

#### Mode 1: Plain
- Minimal design
- No colors or decorative elements
- Black and white layout
- Best for printing on pre-printed letterhead
- Usage: Add `?mode=plain` to the download URL

#### Mode 2: Letterhead
- Designed for physical letterhead paper
- Uses the letterhead template from `/public/letter-template.pdf`
- Leaves space at top (200px) and bottom (150px) for letterhead
- Content only in the middle section
- No header/footer generated
- Usage: Add `?mode=letterhead` to the download URL

#### Mode 3: Plain-Model (Default)
- Full digital letterhead
- Company logo and branding
- Golden/black color scheme
- Complete header and footer
- This is the default mode if no mode is specified
- Usage: No parameter needed, or add `?mode=plain-model`

## API Usage

### Download Invoice PDF

```
GET /api/invoices/[id]/download?mode=<mode>
```

**Parameters:**
- `mode` (optional): `plain` | `letterhead` | `plain-model`
  - Default: `plain-model`

**Examples:**
```
/api/invoices/abc123/download
/api/invoices/abc123/download?mode=plain
/api/invoices/abc123/download?mode=letterhead
/api/invoices/abc123/download?mode=plain-model
```

### Download Quotation PDF

```
GET /api/quotations/[id]/download?mode=<mode>
```

**Parameters:**
- `mode` (optional): `plain` | `letterhead` | `plain-model`
  - Default: `plain-model`

**Examples:**
```
/api/quotations/xyz789/download
/api/quotations/xyz789/download?mode=plain
/api/quotations/xyz789/download?mode=letterhead
/api/quotations/xyz789/download?mode=plain-model
```

## When to Use Each Mode

### Use Plain Mode When:
- Printing on pre-printed company letterhead
- Need minimal ink usage
- Simple black and white output required
- Client prefers plain documents

### Use Letterhead Mode When:
- Using physical letterhead paper with pre-printed header/footer
- The letterhead design from `/public/letter-template.pdf` is being used
- Want to utilize existing printed stationery

### Use Plain-Model Mode When:
- Emailing PDFs to clients
- Need branded, professional-looking documents
- Digital delivery (WhatsApp, email, etc.)
- No physical letterhead available
- Default professional appearance needed

## Files Modified

### New Files:
- `lib/sales-executive.ts` - Sales executive mapping utility
- `lib/pdf-templates/invoice-pdf-enhanced.tsx` - Enhanced invoice PDF with 3 modes
- `lib/pdf-templates/quotation-pdf-enhanced.tsx` - Enhanced quotation PDF with 3 modes
- `PDF_GENERATION_GUIDE.md` - This documentation

### Modified Files:
- `app/api/invoices/route.ts` - Updated invoice number generation to GSINV format
- `app/api/invoices/[id]/download/route.tsx` - Added mode support and sales exec
- `app/api/quotations/[id]/download/route.tsx` - Added mode support and sales exec

### Letterhead Template:
- `public/letter-template.pdf` - Physical letterhead design reference

## Customization

### Adding New Sales Executives

Edit `lib/sales-executive.ts` and add new entries to the `SALES_EXECUTIVES` object:

```typescript
const SALES_EXECUTIVES: Record<string, SalesExecutive> = {
  // Existing entries...
  newname: {
    code: 'NN',
    id: 'NN-2396',
    name: 'New Name',
  },
}
```

### Modifying PDF Styles

Edit the respective template files:
- Invoice: `lib/pdf-templates/invoice-pdf-enhanced.tsx`
- Quotation: `lib/pdf-templates/quotation-pdf-enhanced.tsx`

Styles are defined using `react-pdf/renderer` StyleSheet.

## Notes

- The original PDF templates (`invoice-pdf.tsx` and `quotation-pdf.tsx`) are preserved for backward compatibility
- Sales executive matching is case-insensitive and supports partial name matching
- The letterhead template can be updated by replacing `/public/letter-template.pdf`
- All PDFs maintain the same data structure, only the presentation changes
