'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Service {
  id: string
  name: string
  slug: string
}

export default function BookNowPage() {
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    serviceInterest: '',
    address: '',
    city: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    needsSiteVisit: 'true',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(data))
      .catch((err) => console.error('Failed to load services:', err))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[0-9\s-()]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.serviceInterest) {
      newErrors.serviceInterest = 'Please select a service'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (formData.needsSiteVisit === 'true') {
      if (!formData.preferredDate) {
        newErrors.preferredDate = 'Preferred date is required'
      }
      if (!formData.preferredTime) {
        newErrors.preferredTime = 'Preferred time is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit booking')
      }

      setSubmitSuccess(true)
      setFormData({
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        serviceInterest: '',
        address: '',
        city: '',
        preferredDate: '',
        preferredTime: '',
        notes: '',
        needsSiteVisit: 'true',
      })
    } catch (error) {
      setErrors({ submit: 'Failed to submit booking. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Book a Service</h1>
          <p className="text-lg text-muted-foreground">
            Fill out the form below and we'll contact you to confirm your booking.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>
              Please provide your details and service requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitSuccess ? (
              <div className="rounded-lg bg-green-50 p-6 text-green-800">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold">Booking Request Submitted!</p>
                    <p className="mt-1 text-sm">
                      Thank you for your booking. Our team will contact you shortly to confirm the details.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSubmitSuccess(false)}
                >
                  Make Another Booking
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                        />
                      
                      {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+968 1234 5678"
                          />
                        
                        {errors.phone && <p className="text-sm font-medium text-destructive">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        
                          <Input
                            id="whatsapp"
                            name="whatsapp"
                            type="tel"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            placeholder="+968 96785802"
                          />
                        
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                        />
                      
                      {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Service Details</h3>

                    <div className="space-y-2">
                      <Label htmlFor="serviceInterest">Service Type *</Label>
                      
                        <Select
                          value={formData.serviceInterest}
                          onValueChange={(value) =>
                            setFormData({ ...formData, serviceInterest: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.name}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      
                      {errors.serviceInterest && <p className="text-sm font-medium text-destructive">{errors.serviceInterest}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Service Address *</Label>
                      
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Building name, street, area..."
                          rows={3}
                        />
                      
                      {errors.address && <p className="text-sm font-medium text-destructive">{errors.address}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g., Muscat"
                        />
                      
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Site Visit</h3>

                    <div className="space-y-2">
                      <Label htmlFor="needsSiteVisit">Do you need a site visit?</Label>
                      
                        <Select
                          value={formData.needsSiteVisit}
                          onValueChange={(value) =>
                            setFormData({ ...formData, needsSiteVisit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes, schedule a site visit</SelectItem>
                            <SelectItem value="false">No, just send a quotation</SelectItem>
                          </SelectContent>
                        </Select>
                      
                    </div>

                    {formData.needsSiteVisit === 'true' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="preferredDate">Preferred Date *</Label>
                          
                            <Input
                              id="preferredDate"
                              name="preferredDate"
                              type="date"
                              value={formData.preferredDate}
                              onChange={handleChange}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          
                          {errors.preferredDate && <p className="text-sm font-medium text-destructive">{errors.preferredDate}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferredTime">Preferred Time *</Label>
                          
                            <Input
                              id="preferredTime"
                              name="preferredTime"
                              type="time"
                              value={formData.preferredTime}
                              onChange={handleChange}
                            />
                          
                          {errors.preferredTime && <p className="text-sm font-medium text-destructive">{errors.preferredTime}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special requirements or additional information..."
                        rows={4}
                      />
                    
                  </div>

                  {errors.submit && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                      {errors.submit}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
