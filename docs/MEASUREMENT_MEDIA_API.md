# Measurement Media API Documentation

## Phase 5: Media APIs (Photos + Videos)

This document describes the REST APIs for managing photos and videos on measurement objects.

---

## Overview

The Media API allows you to attach, list, update, and delete photos and videos for any measurement object. Each media item can include:

- **Photos**: Images documenting the object's condition
- **Videos**: Video recordings with optional thumbnail and duration
- **Metadata**: Caption, sort order for organization

---

## Endpoints

### 1. List Media

**GET** `/api/measurements/{id}/objects/{objectId}/media`

Fetch all media (photos and videos) for a specific measurement object.

**Query Parameters:**
- `type` (optional): Filter by media type (`PHOTO` or `VIDEO`)

**Response:**
```json
[
  {
    "id": "string",
    "measurementObjectId": "string",
    "type": "PHOTO | VIDEO",
    "url": "string",
    "thumbnailUrl": "string | null",
    "duration": "number | null",  // Duration in seconds (for videos)
    "caption": "string | null",
    "sortOrder": "number",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

**Examples:**

List all media:
```bash
GET /api/measurements/cm123/objects/obj456/media
```

List only photos:
```bash
GET /api/measurements/cm123/objects/obj456/media?type=PHOTO
```

List only videos:
```bash
GET /api/measurements/cm123/objects/obj456/media?type=VIDEO
```

---

### 2. Get Single Media Item

**GET** `/api/measurements/{id}/objects/{objectId}/media/{mediaId}`

Fetch details of a specific media item.

**Response:**
```json
{
  "id": "string",
  "measurementObjectId": "string",
  "type": "PHOTO | VIDEO",
  "url": "string",
  "thumbnailUrl": "string | null",
  "duration": "number | null",
  "caption": "string | null",
  "sortOrder": "number",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

### 3. Attach Media

**POST** `/api/measurements/{id}/objects/{objectId}/media`

Attach a new photo or video to a measurement object.

**Request Body:**
```json
{
  "type": "PHOTO | VIDEO",  // Required: Media type
  "url": "string",  // Required: URL to the media file
  "thumbnailUrl": "string | null",  // Optional: Thumbnail URL (for videos)
  "duration": "number | null",  // Optional: Duration in seconds (for videos)
  "caption": "string | null",  // Optional: Caption/description
  "sortOrder": "number"  // Optional: Sort order (default: 0)
}
```

**Response:** Returns the created media item (201 Created).

**Examples:**

Attach a photo:
```json
{
  "type": "PHOTO",
  "url": "https://storage.example.com/photos/sofa-before-123.jpg",
  "caption": "Sofa condition before cleaning",
  "sortOrder": 1
}
```

Attach a video:
```json
{
  "type": "VIDEO",
  "url": "https://storage.example.com/videos/inspection-456.mp4",
  "thumbnailUrl": "https://storage.example.com/thumbnails/inspection-456.jpg",
  "duration": 45,
  "caption": "Full inspection walkthrough",
  "sortOrder": 2
}
```

---

### 4. Update Media

**PUT** `/api/measurements/{id}/objects/{objectId}/media/{mediaId}`

Update an existing media item.

**Request Body:**
```json
{
  "url": "string",  // Optional
  "thumbnailUrl": "string | null",  // Optional
  "duration": "number | null",  // Optional
  "caption": "string | null",  // Optional
  "sortOrder": "number"  // Optional
}
```

**Response:** Returns the updated media item.

**Notes:**
- Only provided fields are updated
- Partial updates are supported
- Cannot change media type (delete and create new instead)

**Example:**

Update caption and sort order:
```json
{
  "caption": "Updated: Sofa after deep cleaning",
  "sortOrder": 5
}
```

---

### 5. Delete Media

**DELETE** `/api/measurements/{id}/objects/{objectId}/media/{mediaId}`

Delete a media item from a measurement object (soft delete).

**Response:**
```json
{
  "message": "Media deleted successfully"
}
```

**Note:** This is a soft delete - the media record is preserved in the database with a `deletedAt` timestamp, but excluded from queries.

---

## Usage Patterns

### Photo Documentation Workflow

```bash
# 1. Take photos of object before service
POST /api/measurements/cm123/objects/obj456/media
{
  "type": "PHOTO",
  "url": "https://storage.example.com/before-1.jpg",
  "caption": "Front view - before cleaning",
  "sortOrder": 1
}

# 2. Add more photos during service
POST /api/measurements/cm123/objects/obj456/media
{
  "type": "PHOTO",
  "url": "https://storage.example.com/during-1.jpg",
  "caption": "Stain removal in progress",
  "sortOrder": 2
}

# 3. Add after photos
POST /api/measurements/cm123/objects/obj456/media
{
  "type": "PHOTO",
  "url": "https://storage.example.com/after-1.jpg",
  "caption": "Front view - after cleaning",
  "sortOrder": 3
}

# 4. List all photos to create before/after comparison
GET /api/measurements/cm123/objects/obj456/media?type=PHOTO
```

---

### Video Documentation Workflow

```bash
# 1. Record inspection video
POST /api/measurements/cm123/objects/obj456/media
{
  "type": "VIDEO",
  "url": "https://storage.example.com/videos/inspection.mp4",
  "thumbnailUrl": "https://storage.example.com/thumbnails/inspection.jpg",
  "duration": 120,
  "caption": "Complete furniture inspection - all angles",
  "sortOrder": 1
}

# 2. Add demonstration video
POST /api/measurements/cm123/objects/obj456/media
{
  "type": "VIDEO",
  "url": "https://storage.example.com/videos/cleaning-demo.mp4",
  "thumbnailUrl": "https://storage.example.com/thumbnails/cleaning-demo.jpg",
  "duration": 180,
  "caption": "Cleaning process demonstration",
  "sortOrder": 2
}

# 3. List all videos
GET /api/measurements/cm123/objects/obj456/media?type=VIDEO
```

---

### Mixed Media Gallery

```bash
# Create a mixed gallery with photos and videos
# Photos with sortOrder 1-5
# Videos with sortOrder 10-15

# This way photos appear first, then videos
GET /api/measurements/cm123/objects/obj456/media
# Returns all media sorted by sortOrder
```

---

## Common Use Cases

### 1. Before/After Documentation
```
1. Attach "before" photos with sortOrder 1-10
2. Perform service
3. Attach "after" photos with sortOrder 11-20
4. Use captions to differentiate ("Before: ...", "After: ...")
5. Display in UI sorted by sortOrder
```

### 2. Problem Documentation
```
1. Photo of overall object (sortOrder: 1)
2. Close-up photos of problem areas (sortOrder: 2-5)
3. Video walkthrough explaining issues (sortOrder: 10)
4. Reference during quotation and service
```

### 3. Quality Verification
```
1. Customer provides pre-service photos
2. Technician adds during-service photos
3. Supervisor adds post-service verification photos
4. Create complete audit trail
```

### 4. Video Inspection
```
1. Record comprehensive video inspection
2. Generate thumbnail automatically
3. Extract duration from video metadata
4. Use for remote assessment and quotation
```

---

## Integration with Tree API

Media is automatically included when fetching the measurement tree:

**GET** `/api/measurements/{id}/tree`

Returns objects with:
```json
{
  "id": "obj456",
  "name": "Sofa",
  "media": [
    {
      "id": "media123",
      "type": "PHOTO",
      "url": "https://storage.example.com/photo.jpg",
      "caption": "Before cleaning",
      "sortOrder": 1
    },
    {
      "id": "media456",
      "type": "VIDEO",
      "url": "https://storage.example.com/video.mp4",
      "thumbnailUrl": "https://storage.example.com/thumb.jpg",
      "duration": 45,
      "caption": "Inspection video",
      "sortOrder": 2
    }
  ],
  "stains": [...],
  "areasOfNotice": [...],
  "children": [...]
}
```

---

## File Upload Considerations

**Important:** This API manages media **metadata** (URLs, captions, etc.), not the actual file upload.

### Recommended Upload Flow:

1. **Upload file to storage** (separate endpoint/service):
   ```bash
   POST /api/upload
   # Returns: { "url": "https://storage.example.com/file.jpg" }
   ```

2. **Attach media with URL**:
   ```bash
   POST /api/measurements/{id}/objects/{objectId}/media
   {
     "type": "PHOTO",
     "url": "https://storage.example.com/file.jpg",
     "caption": "..."
   }
   ```

### Storage Options:
- Local storage (not recommended for production)
- Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- CDN (Cloudflare, CloudFront)
- Third-party services (Cloudinary, Uploadcare)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "type and url are required"
}
```
or
```json
{
  "error": "type must be either PHOTO or VIDEO"
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
  "error": "Media not found"
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
  "error": "Failed to create media"
}
```

---

## Best Practices

### 1. Sort Order Management
- Use increments of 10 (10, 20, 30...) for easy reordering
- Reserve ranges for different types:
  - 1-100: Photos
  - 101-200: Videos
  - 201-300: Documents

### 2. Video Thumbnails
- Always generate and provide thumbnails for videos
- Improves UI/UX (preview before playing)
- Reduces bandwidth (thumbnails load faster)

### 3. Captions
- Use descriptive captions for better organization
- Include timestamp or context ("Before", "After", "During")
- Helps with search and filtering

### 4. Duration
- Extract duration from video metadata
- Store in seconds for consistency
- Display formatted (MM:SS or HH:MM:SS) in UI

### 5. Performance
- Lazy load media in UI (don't load all at once)
- Use pagination for objects with many media items
- Compress images before upload
- Use appropriate video formats (MP4 for web)

---

## Implementation Notes

- All APIs require authentication
- Write operations require appropriate permissions (`canManageLeads`)
- All operations are logged via audit system
- Soft delete is used (records are not physically removed)
- Media is included in tree queries automatically
- Files are stored as URLs (file upload handled separately)
- Sort order determines display sequence
- Created/updated timestamps are automatically managed

---

## Related Files

- `/app/api/measurements/[id]/objects/[objectId]/media/route.ts` - List/Attach media
- `/app/api/measurements/[id]/objects/[objectId]/media/[mediaId]/route.ts` - Get/Update/Delete media
- `/app/api/measurements/[id]/tree/route.ts` - Fetch tree with media included
- `/prisma/schema.prisma` - MeasurementObjectMedia model definition
