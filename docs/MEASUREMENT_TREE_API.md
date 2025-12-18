# Measurement Tree API Documentation

## Phase 3: Tree APIs for Measurement Objects

This document describes the REST APIs for managing the hierarchical measurement object tree.

---

## Endpoints

### 1. Fetch Full Measurement Tree

**GET** `/api/measurements/{id}/tree`

Fetches the complete measurement tree with all relations (stains, areas of notice, media).

**Response:**
```json
{
  "measurementId": "string",
  "title": "string",
  "status": "DRAFT | COMPLETED | ARCHIVED",
  "tree": [
    {
      "id": "string",
      "type": "VILLA | ROOM | SOFA | ...",
      "name": "string",
      "itemMasterId": "string | null",
      "itemMaster": {
        "id": "string",
        "name": "string",
        "category": "string",
        "allowedParentTypes": ["string"],
        "allowedChildTypes": ["string"],
        "canBeRootLevel": "boolean"
      },
      "sizeMode": "PRESET | DIMENSIONS | null",
      "size": "XS | S | M | L | XL | XXL | XXXL | null",
      "dimensionLength": "number | null",
      "dimensionWidth": "number | null",
      "dimensionHeight": "number | null",
      "dimensionUnit": "string | null",
      "dirtLevel": "LEVEL_1 | LEVEL_2 | LEVEL_3 | LEVEL_4 | LEVEL_5 | null",
      "quantity": "number",
      "notes": "string | null",
      "remarks": "string | null",
      "sortOrder": "number",
      "stains": [
        {
          "id": "string",
          "description": "string",
          "notes": "string | null",
          "photoUrl": "string | null"
        }
      ],
      "areasOfNotice": [
        {
          "id": "string",
          "description": "string",
          "notes": "string | null",
          "photoUrl": "string | null"
        }
      ],
      "media": [
        {
          "id": "string",
          "type": "PHOTO | VIDEO",
          "url": "string",
          "thumbnailUrl": "string | null",
          "duration": "number | null",
          "caption": "string | null",
          "sortOrder": "number"
        }
      ],
      "children": [
        // ... nested objects recursively
      ]
    }
  ]
}
```

---

### 2. Add Node (Object)

**POST** `/api/measurements/{id}/objects`

Adds a new object node to the measurement tree. Parent is optional (for root-level items).

**Request Body:**
```json
{
  "parentObjectId": "string | null",  // Optional: parent object ID
  "type": "VILLA | ROOM | SOFA | ...",  // Required: object type
  "name": "string",  // Required: object name
  "itemMasterId": "string | null",  // Optional: catalog item reference
  "sizeMode": "PRESET | DIMENSIONS | null",
  "size": "S | M | L | ... | null",
  "dimensionLength": "number | null",
  "dimensionWidth": "number | null",
  "dimensionHeight": "number | null",
  "dimensionUnit": "string | null",
  "dirtLevel": "LEVEL_1 | ... | LEVEL_5 | null",
  "quantity": "number",  // Default: 1
  "notes": "string | null",
  "remarks": "string | null",
  "sortOrder": "number"  // Default: 0
}
```

**Response:** Returns the created object with all relations (201 Created).

**Validation:**
- Enforces nesting rules from catalog (allowedParentTypes, allowedChildTypes)
- Returns 400 with error message if nesting is invalid
- CUSTOM, OTHER, ITEM types bypass all restrictions

---

### 3. Update Node (Object)

**PUT** `/api/measurements/{id}/objects/{objectId}`

Updates an existing measurement object node.

**Request Body:**
```json
{
  "name": "string",
  "sizeMode": "PRESET | DIMENSIONS | null",
  "size": "S | M | L | ... | null",
  "dimensionLength": "number | null",
  "dimensionWidth": "number | null",
  "dimensionHeight": "number | null",
  "dimensionUnit": "string | null",
  "dirtLevel": "LEVEL_1 | ... | LEVEL_5 | null",
  "quantity": "number",
  "notes": "string | null",
  "remarks": "string | null",
  "sortOrder": "number"
}
```

**Response:** Returns the updated object with all relations.

**Notes:**
- Only provided fields are updated
- Cannot change type or parent (for that, delete and recreate)

---

### 4. Duplicate Node

**POST** `/api/measurements/{id}/objects/{objectId}/duplicate`

Duplicates a measurement object node, optionally including its entire subtree.

**Request Body:**
```json
{
  "includeChildren": true  // Default: true. If false, only duplicates the single node
}
```

**Response:** Returns the duplicated object (and subtree if included) (201 Created).

**Notes:**
- Name is suffixed with " (Copy)"
- Stains, areas of notice, and media are also duplicated
- Children are recursively duplicated if `includeChildren` is true
- Duplicate is created as a sibling (same parent)

---

### 5. Delete Node (Soft Delete)

**DELETE** `/api/measurements/{id}/objects/{objectId}`

Soft deletes a measurement object node and all its children recursively.

**Response:**
```json
{
  "message": "Measurement object and children deleted successfully"
}
```

**Notes:**
- Sets `deletedAt` timestamp (soft delete)
- Recursively deletes all children
- Does not physically remove from database
- Deleted objects are excluded from tree queries

---

## Nesting Validation

The API enforces nesting rules defined in the catalog (`ItemMaster`):

### Rules:
1. **Property types** (Villa, House, Flat, etc.) can be at root level
2. **Property types** can contain spaces/rooms and items
3. **Spaces/rooms** must be under properties
4. **Spaces/rooms** can contain items
5. **Items** can be at root level
6. **Items** can be under properties, spaces, or other items
7. **CUSTOM, OTHER, ITEM** types bypass all restrictions

### Validation Examples:

✅ **Valid:**
- Villa (root) → Room → Sofa
- Villa (root) → Sofa
- House (root) → Bedroom → Bed
- Sofa (root) - items can be at root level
- Sofa → Chair - items can nest under other items
- Custom (root) → Anything

❌ **Invalid:**
- Villa → Apartment (properties cannot nest)
- Sofa → Room (items cannot contain spaces)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Villa cannot contain Apartment"
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
  "error": "Measurement not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create measurement object"
}
```

---

## Implementation Notes

- All APIs require authentication
- All write operations require appropriate permissions (`canManageLeads`)
- All operations are logged via audit system
- Tree queries automatically exclude soft-deleted objects
- Relations (stains, areas, media) are included in tree responses
- Nesting validation happens server-side (source of truth)

---

## Related Files

- `/lib/measurement-nesting.ts` - Nesting validation utilities
- `/app/api/measurements/[id]/tree/route.ts` - Fetch tree endpoint
- `/app/api/measurements/[id]/objects/route.ts` - Add node endpoint
- `/app/api/measurements/[id]/objects/[objectId]/route.ts` - Update/delete endpoints
- `/app/api/measurements/[id]/objects/[objectId]/duplicate/route.ts` - Duplicate endpoint
