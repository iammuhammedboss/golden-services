'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface CatalogItem {
  id: string
  name: string
  category: string
  canBeRootLevel: boolean
  allowedParentTypes: string[]
  allowedChildTypes: string[]
}

interface AddObjectDialogProps {
  measurementId: string
  parentObjectId: string | null
  onSuccess: () => void
  children: React.ReactNode
}

const RECENTLY_USED_KEY = 'gs-recentlyUsedItems'
const MAX_RECENTLY_USED = 10

export function AddObjectDialog({
  measurementId,
  parentObjectId,
  onSuccess,
  children,
}: AddObjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [filteredCatalog, setFilteredCatalog] = useState<CatalogItem[]>([])
  const [recentlyUsed, setRecentlyUsed] = useState<CatalogItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [customName, setCustomName] = useState('')
  const [customType, setCustomType] = useState<string>('CUSTOM')
  const [quantity, setQuantity] = useState(1)

  const loadCatalog = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/catalog/items')
      if (response.ok) {
        const data = await response.json()
        setCatalog(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load catalog')
      }
    } catch (error) {
      console.error('Error loading catalog:', error)
      setError('Failed to load catalog. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadCatalog()
      const storedRecent = localStorage.getItem(RECENTLY_USED_KEY)
      if (storedRecent) {
        setRecentlyUsed(JSON.parse(storedRecent))
      }
    } else {
      // Reset form when dialog closes
      resetForm()
      setError(null)
    }
  }, [open])

  const filterCatalog = useCallback(() => {
    let source = catalog
    if (selectedCategory === 'Recently Used') {
      source = recentlyUsed
    }
    
    let filtered = source
    if (selectedCategory !== 'All' && selectedCategory !== 'Recently Used') {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredCatalog(filtered)
  }, [catalog, selectedCategory, searchQuery, recentlyUsed])

  useEffect(() => {
    filterCatalog()
  }, [filterCatalog])

  const categories = ['All', ...(recentlyUsed.length > 0 ? ['Recently Used'] : []), ...Array.from(new Set(catalog.map((item) => item.category)))]

  const addToRecentlyUsed = (item: CatalogItem) => {
    const updatedRecent = [item, ...recentlyUsed.filter(i => i.id !== item.id)].slice(0, MAX_RECENTLY_USED)
    setRecentlyUsed(updatedRecent)
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updatedRecent))
  }

  const handleAddFromCatalog = async () => {
    if (!selectedItem) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/measurements/${measurementId}/objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentObjectId,
          type: selectedItem.name.toUpperCase().replace(/\s+/g, '_'),
          name: selectedItem.name,
          itemMasterId: selectedItem.id,
          quantity,
        }),
      })

      if (response.ok) {
        addToRecentlyUsed(selectedItem)
        setOpen(false)
        onSuccess()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to add item: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding object:', error)
      alert('Failed to add item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCustom = async () => {
    if (!customName.trim()) {
      alert('Please enter a name')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/measurements/${measurementId}/objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentObjectId,
          type: customType,
          name: customName,
          itemMasterId: null,
          quantity,
        }),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to add item: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding custom object:', error)
      alert('Failed to add custom item')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedItem(null)
    setCustomName('')
    setCustomType('CUSTOM')
    setQuantity(1)
    setSearchQuery('')
    setSelectedCategory('All')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>
            {parentObjectId ? 'Add a child item' : 'Add a root item to the measurement'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="catalog" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">From Catalog</TabsTrigger>
            <TabsTrigger value="custom">Custom/Other</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading catalog...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-48 text-destructive">
                <p className="font-semibold mb-2">Error</p>
                <p className="text-sm mb-4">{error}</p>
                <Button onClick={loadCatalog} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-[200px] border rounded-md p-2 overflow-y-auto">
                  {filteredCatalog.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No items found
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredCatalog.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-3 border rounded-lg text-left hover:bg-accent transition-colors ${
                            selectedItem?.id === item.id ? 'bg-accent border-primary' : ''
                          }`}
                        >
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedItem && (
                  <div className="p-3 border border-primary rounded-lg bg-blue-50">
                    <p className="text-sm font-medium">Selected: {selectedItem.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.category}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFromCatalog}
                    disabled={!selectedItem || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                placeholder="Enter custom item name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={customType} onValueChange={setCustomType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="ITEM">Item</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Custom/Other/Item types can be placed anywhere and bypass nesting restrictions
              </p>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddCustom} disabled={isSaving} className="flex-1">
                {isSaving ? 'Adding...' : 'Add Custom Item'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
