# Add Item Dialog - Usage Guide

## Improvements Made ✅

### 1. **Better Layout**
- ✅ Reduced catalog height from 300px to 200px
- ✅ Made dialog scrollable with `max-h-[90vh] overflow-y-auto`
- ✅ Buttons are now always visible at the bottom

### 2. **Visual Feedback**
- ✅ Added "Selected Item" indicator (blue box shows what you selected)
- ✅ Added "No items found" message when catalog is empty
- ✅ Selected items have blue border and accent background

### 3. **Better Buttons**
- ✅ Added Cancel button next to Add button
- ✅ Buttons are now 50/50 width (flex-1)
- ✅ Clear visual hierarchy

### 4. **Two Ways to Add Items**

#### Tab 1: From Catalog
1. Search or filter by category
2. Click on an item in the grid (it will highlight)
3. See "Selected: [item name]" appear in blue box
4. Set quantity (default is 1)
5. Click "Add Item" button

#### Tab 2: Custom/Other
1. Enter a custom name
2. Select type (Custom/Other/Item)
3. Set quantity
4. Click "Add Custom Item" button

## Common Issues & Solutions

### Issue 1: "No items found" in catalog
**Cause:** Your database has no items in the `item_masters` table

**Solution:** You need to seed the database with catalog items. Run:
```bash
npx tsx prisma/seed-measurement-catalog.ts
```

Or create items manually through the admin interface.

### Issue 2: Can't see the Add button
**Fixed!** The dialog is now scrollable and button is always visible.

### Issue 3: Not sure if item is selected
**Fixed!** Selected items now show:
- Blue border and accent background on the item card
- Blue "Selected: [name]" box below the catalog

### Issue 4: Button is disabled
**Reason:** You must select an item first from the catalog
**Solution:** Click on any item in the grid, then the button will become enabled

## How to Use

### Adding a Root Item
```typescript
// In measurement tree view
<AddObjectDialog
  measurementId={measurementId}
  parentObjectId={null}  // null = root level
  onSuccess={() => fetchMeasurementTree()}
>
  <Button>Add Root Item</Button>
</AddObjectDialog>
```

### Adding a Child Item
```typescript
// In tree node
<AddObjectDialog
  measurementId={measurementId}
  parentObjectId={node.id}  // parent's ID
  onSuccess={() => fetchMeasurementTree()}
>
  <Button><Plus /> Add Child</Button>
</AddObjectDialog>
```

## Step-by-Step Test

1. **Open a measurement** → Go to Admin → Measurements → [any measurement]

2. **Click "Add Root Item"** button
   - Dialog should open
   - You should see "From Catalog" and "Custom/Other" tabs

3. **From Catalog Tab:**
   - If you see items: Click on one → it highlights → blue "Selected" box appears
   - Set quantity if needed
   - Click "Add Item" → Item appears in tree

4. **If catalog is empty:**
   - Switch to "Custom/Other" tab
   - Type a name like "Test Item"
   - Select type "Custom"
   - Click "Add Custom Item" → Item appears in tree

5. **To add a child:**
   - Hover over a tree item
   - Click the "+" button
   - Same process as above

## Troubleshooting

### Nothing happens when I click an item
- Make sure you're clicking the item card, not just hovering
- The item should get a blue border when selected
- The "Selected: [name]" box should appear below the catalog

### Add Item button is grayed out
- You haven't selected an item yet
- Click on an item card in the catalog first
- The button will become blue/enabled

### Dialog is cut off
- This should be fixed now with `overflow-y-auto`
- Try scrolling inside the dialog if needed

### Can't find any items in catalog
- Your database needs items seeded
- Use the "Custom/Other" tab as a workaround
- Or run the seed script to populate catalog

## Visual Flow

```
┌─────────────────────────────────────┐
│  Add Item                      [X]  │
│  Add a root item to measurement     │
├─────────────────────────────────────┤
│  [From Catalog] [Custom/Other]      │
├─────────────────────────────────────┤
│  Search: [________] Category: [All] │
│  ┌───────────────────────────────┐  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐  │  │ ← Clickable items
│  │ │ Sofa │ │Chair │ │Table │  │  │
│  │ └──────┘ └──────┘ └──────┘  │  │
│  │ ┌──────┐ ┌──────┐           │  │
│  │ │ Bed  │ │Carpet│           │  │ ← Click to select
│  │ └──────┘ └──────┘           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Selected: Sofa                │  │ ← Shows selection
│  │ Furniture                     │  │
│  └───────────────────────────────┘  │
│  Quantity: [1]                      │
│  [Cancel]  [Add Item]               │ ← Buttons always visible
└─────────────────────────────────────┘
```

## What Changed

### Before:
- Button might be hidden below scroll
- No visual feedback on selection
- Hard to know if item was selected
- Dialog too tall

### After:
- ✅ Button always visible
- ✅ Blue box shows selected item
- ✅ Selected item has blue border
- ✅ Dialog is scrollable
- ✅ Cancel button added
- ✅ Empty state message
