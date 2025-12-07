'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Client } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce'
import { AddClientDialog } from './add-client-dialog'

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void
  initialClientId?: string
}

export function ClientSelector({
  onClientSelect,
  initialClientId,
}: ClientSelectorProps) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  const fetchClients = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setClients([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/search?q=${searchQuery}`)
      const data = await response.json()
      if (response.ok) {
        setClients(data)
      } else {
        setClients([])
      }
    } catch (error) {
      console.error('Failed to search clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients(debouncedQuery)
  }, [debouncedQuery, fetchClients])
  
  // TODO: Implement initial client fetching
  // TODO: Implement "Add New Client" dialog

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    onClientSelect(client)
    setQuery('')
    setClients([])
  }

  if (selectedClient) {
    return (
      <div className="rounded-md border p-3 bg-muted/50">
        <p className="text-sm font-medium">{selectedClient.name}</p>
        <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
        <Button
          variant="link"
          className="p-0 h-auto mt-1"
          onClick={() => {
            setSelectedClient(null)
            onClientSelect(null)
          }}
        >
          Change
        </Button>
      </div>
    )
  }

import { AddClientDialog } from './add-client-dialog'

// ... (rest of the component)

  return (
    <div className="space-y-2">
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search by phone or name..."
          value={query}
          onValueChange={setQuery}
          disabled={loading}
        />
        <CommandList>
          <CommandEmpty>{loading ? 'Searching...' : 'No clients found.'}</CommandEmpty>
          {clients.length > 0 && (
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => handleSelectClient(client)}
                  value={client.id}
                >
                  {client.name} - {client.phone}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <AddClientDialog onClientCreated={handleSelectClient}>
        <Button variant="outline" size="sm" className="w-full">
          + Create New Client
        </Button>
      </AddClientDialog>
    </div>
  )
}
