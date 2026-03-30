'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  address?: string
  onLocationChange: (data: {
    latitude: number | null
    longitude: number | null
    address: string
  }) => void
  googleMapsUrl?: string
  onGoogleMapsUrlChange?: (url: string) => void
}

export function LocationPicker({
  latitude,
  longitude,
  address = '',
  onLocationChange,
  googleMapsUrl = '',
  onGoogleMapsUrlChange,
}: LocationPickerProps) {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState('')
  const [localAddress, setLocalAddress] = useState(address)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setLocalAddress(address)
  }, [address])

  // Load Google Maps if API key exists
  useEffect(() => {
    if (!latitude || !longitude) return
    if (typeof window === 'undefined') return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !mapRef.current) return

    // Load Google Maps script if not already loaded
    if (!(window as any).google?.maps) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.async = true
      script.onload = () => initMap()
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [latitude, longitude])

  const initMap = () => {
    if (!mapRef.current || !latitude || !longitude) return
    const google = (window as any).google

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      draggable: true,
      title: 'Drag to adjust location',
    })

    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      const newLat = pos.lat()
      const newLng = pos.lng()
      const url = `https://www.google.com/maps?q=${newLat},${newLng}`
      onLocationChange({ latitude: newLat, longitude: newLng, address: localAddress })
      onGoogleMapsUrlChange?.(url)
    })

    mapInstanceRef.current = map
    markerRef.current = marker
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setCapturing(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const url = `https://www.google.com/maps?q=${lat},${lng}`
        onLocationChange({ latitude: lat, longitude: lng, address: localAddress })
        onGoogleMapsUrlChange?.(url)
        setCapturing(false)
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location access denied. Please enable location permissions.'
            : 'Failed to get location. Please try again.'
        )
        setCapturing(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      {/* Manual Address */}
      <div>
        <Label className="text-xs">Address</Label>
        <Input
          value={localAddress}
          onChange={(e) => {
            setLocalAddress(e.target.value)
            onLocationChange({
              latitude: latitude || null,
              longitude: longitude || null,
              address: e.target.value,
            })
          }}
          placeholder="Enter address manually..."
          className="mt-1"
        />
      </div>

      {/* GPS Capture Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={captureLocation}
          disabled={capturing}
          className="flex-1"
        >
          {capturing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Getting location...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture GPS
            </>
          )}
        </Button>

        {latitude && longitude && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Maps
            </a>
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Coordinates Display */}
      {latitude && longitude && (
        <div className="rounded-lg bg-accent p-2 text-xs text-muted-foreground">
          <span className="font-mono">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      )}

      {/* Google Maps URL (manual input) */}
      <div>
        <Label className="text-xs">Google Maps URL</Label>
        <Input
          value={googleMapsUrl}
          onChange={(e) => onGoogleMapsUrlChange?.(e.target.value)}
          placeholder="Paste Google Maps link..."
          className="mt-1 text-xs"
        />
      </div>

      {/* Map Preview */}
      {latitude && longitude && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div
          ref={mapRef}
          className="h-48 w-full rounded-lg border"
          style={{ minHeight: '192px' }}
        />
      )}

      {/* Static map fallback if no API key */}
      {latitude && longitude && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-muted">
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  )
}
