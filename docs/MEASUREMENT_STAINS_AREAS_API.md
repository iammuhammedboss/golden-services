# Measurement Stains & Areas of Notice API Documentation

## Phase 4: Stains + Areas APIs

This document describes the REST APIs for managing stains and areas of notice on measurement objects.

---

## Stains API

Stains represent marks, discoloration, or damage on measurement objects that need special attention during cleaning or service.

### 1. List Stains

**GET** `/api/measurements/{id}/objects/{objectId}/stains`

Fetch all stains for a specific measurement object.

**Response:**
```json
[
  {
    "id": "string",
    "measurementObjectId": "string",
    "description": "string",
    "notes": "string | null",
    "photoUrl": "string | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

---

### 2. Add Stain

**POST** `/api/measurements/{id}/objects/{objectId}/stains`

Add a new stain to a measurement object.

**Request Body:**
```json
{
  "description": "string",  // Required: Description of the stain
  "notes": "string | null",  // Optional: Additional notes
  "photoUrl": "string | null"  // Optional: URL to photo of the stain
}
```

**Response:** Returns the created stain (201 Created).

**Example:**
```json
{
  "description": "Large red wine stain on left cushion",
  "notes": "May require special cleaning solution",
  "photoUrl": "https://storage.example.com/stain-photo-123.jpg"
}
```

---

### 3. Update Stain

**PUT** `/api/measurements/{id}/objects/{objectId}/stains/{stainId}`

Update an existing stain.

**Request Body:**
```json
{
  "description": "string",  // Optional
  "notes": "string | null",  // Optional
  "photoUrl": "string | null"  // Optional
}
```

**Response:** Returns the updated stain.

**Notes:**
- Only provided fields are updated
- Partial updates are supported

---

### 4. Delete Stain

**DELETE** `/api/measurements/{id}/objects/{objectId}/stains/{stainId}`

Delete a stain from a measurement object (soft delete).

**Response:**
```json
{
  "message": "Stain deleted successfully"
}
```

---

## Areas of Notice API

Areas of notice represent specific regions or aspects of a measurement object that require attention, inspection, or special handling.

### 1. List Areas of Notice

**GET** `/api/measurements/{id}/objects/{objectId}/areas`

Fetch all areas of notice for a specific measurement object.

**Response:**
```json
[
  {
    "id": "string",
    "measurementObjectId": "string",
    "description": "string",
    "notes": "string | null",
    "photoUrl": "string | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

---

### 2. Add Area of Notice

**POST** `/api/measurements/{id}/objects/{objectId}/areas`

Add a new area of notice to a measurement object.

**Request Body:**
```json
{
  "description": "string",  // Required: Description of the area
  "notes": "string | null",  // Optional: Additional notes
  "photoUrl": "string | null"  // Optional: URL to photo of the area
}
```

**Response:** Returns the created area of notice (201 Created).

**Example:**
```json
{
  "description": "Worn corner showing fabric damage",
  "notes": "Client requested special care in this area",
  "photoUrl": "https://storage.example.com/area-photo-456.jpg"
}
```

---

### 3. Update Area of Notice

**PUT** `/api/measurements/{id}/objects/{objectId}/areas/{areaId}`

Update an existing area of notice.

**Request Body:**
```json
{
  "description": "string",  // Optional
  "notes": "string | null",  // Optional
  "photoUrl": "string | null"  // Optional
}
```

**Response:** Returns the updated area of notice.

**Notes:**
- Only provided fields are updated
- Partial updates are supported

---

### 4. Delete Area of Notice

**DELETE** `/api/measurements/{id}/objects/{objectId}/areas/{areaId}`

Delete an area of notice from a measurement object (soft delete).

**Response:**
```json
{
  "message": "Area of notice deleted successfully"
}
```

---

## Usage Examples

### Adding a Stain with Photo

```bash
POST /api/measurements/cm123/objects/obj456/stains
Content-Type: application/json

{
  "description": "Coffee stain on armrest",
  "notes": "Fresh stain, may be easier to remove",
  "photoUrl": "https://storage.example.com/photos/coffee-stain.jpg"
}
```

### Adding an Area of Notice

```bash
POST /api/measurements/cm123/objects/obj456/areas
Content-Type: application/json

{
  "description": "Loose stitching along back seam",
  "notes": "Inform client before cleaning to avoid further damage",
  "photoUrl": "https://storage.example.com/photos/loose-stitching.jpg"
}
```

### Updating a Stain

```bash
PUT /api/measurements/cm123/objects/obj456/stains/stain789
Content-Type: application/json

{
  "notes": "Successfully removed with special solution"
}
```

### Listing All Stains

```bash
GET /api/measurements/cm123/objects/obj456/stains
```

---

## Common Use Cases

### 1. Documenting Damage Before Service
```
1. Create measurement object (e.g., Sofa)
2. Add areas of notice for existing damage
3. Add photos to document condition
4. Use during quotation to clarify scope
```

### 2. Recording Stains for Cleaning
```
1. Add stains with descriptions
2. Attach photos of each stain
3. Add notes about stain type/age
4. Reference during job execution
```

### 3. Quality Control & Verification
```
1. List all stains/areas before service
2. Update notes during/after cleaning
3. Compare before/after photos
4. Mark stains as resolved or remaining
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "description is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Stain not found"
}
```
or
```json
{
  "error": "Area of notice not found"
}
```
or
```json
{
  "error": "Measurement object not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create stain"
}
```

---

## Integration with Tree API

Stains and areas of notice are automatically included when fetching the measurement tree:

**GET** `/api/measurements/{id}/tree`

Returns objects with:
```json
{
  "id": "obj456",
  "name": "Sofa",
  "stains": [
    {
      "id": "stain789",
      "description": "Coffee stain on armrest",
      "photoUrl": "..."
    }
  ],
  "areasOfNotice": [
    {
      "id": "area101",
      "description": "Loose stitching along back seam",
      "photoUrl": "..."
    }
  ],
  "children": [...]
}
```

---

## Implementation Notes

- All APIs require authentication
- Write operations require appropriate permissions (`canManageLeads`)
- All operations are logged via audit system
- Soft delete is used (records are not physically removed)
- Stains and areas are included in tree queries automatically
- Photos are stored as URLs (file upload handled separately)
- Created/updated timestamps are automatically managed

---

## Related Files

- `/app/api/measurements/[id]/objects/[objectId]/stains/route.ts` - List/Add stains
- `/app/api/measurements/[id]/objects/[objectId]/stains/[stainId]/route.ts` - Update/Delete stain
- `/app/api/measurements/[id]/objects/[objectId]/areas/route.ts` - List/Add areas
- `/app/api/measurements/[id]/objects/[objectId]/areas/[areaId]/route.ts` - Update/Delete area
- `/app/api/measurements/[id]/tree/route.ts` - Fetch tree with stains/areas included
