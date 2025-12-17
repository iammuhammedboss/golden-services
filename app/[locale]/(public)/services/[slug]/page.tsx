import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

interface ServiceDetailPageProps {
  params: {
    slug: string
  }
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      pricingRules: true,
    },
  })

  if (!service) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/services" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to Services
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-4xl font-bold">{service.name}</h1>
              {service.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{service.category.name}</p>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold">About This Service</h2>
            <p className="text-muted-foreground">
              {service.description ||
                'Our professional team provides high-quality service with attention to detail. We use the best equipment and techniques to ensure your satisfaction.'}
            </p>

            <h3 className="mt-8 text-xl font-semibold">What We Offer</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Professional and experienced team</li>
              <li>High-quality materials and equipment</li>
              <li>Flexible scheduling to suit your needs</li>
              <li>Competitive pricing</li>
              <li>100% satisfaction guarantee</li>
            </ul>

            <h3 className="mt-8 text-xl font-semibold">Why Choose Us</h3>
            <p className="text-muted-foreground">
              Golden Services has been serving customers in Oman with excellence and dedication.
              Our trained professionals ensure that every job is completed to the highest standards.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Get a quote for this service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {service.pricingRules.length > 0 ? (
                <div className="space-y-3">
                  {service.pricingRules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{rule.pricingType.replace(/_/g, ' ')}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(rule.basePrice.toString(), rule.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">per {rule.unitLabel}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Contact us for a custom quotation based on your specific needs.
                </p>
              )}

              <div className="space-y-2">
                <Link href="/book-now" className="block">
                  <Button className="w-full" size="lg">
                    Book This Service
                  </Button>
                </Link>
                <Link href="/contact" className="block">
                  <Button variant="outline" className="w-full">
                    Get a Quote
                  </Button>
                </Link>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="mb-2 font-semibold text-lg">Need Immediate Assistance?</p>
                <p className="text-muted-foreground mb-3">
                  Our sales representatives are available to answer your questions and provide personalized service solutions.
                </p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm font-medium">Primary: <a href="tel:+96896785802" className="text-primary hover:underline">+968 96785802</a></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm font-medium">Alternate: <a href="tel:+96892314145" className="text-primary hover:underline">+968 92314145</a>, <a href="tel:+96896785806" className="text-primary hover:underline">+968 96785806</a></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Email: <a href="mailto:info@goldenservicesom.com" className="text-primary hover:underline">info@goldenservicesom.com</a></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium">Address: 23rd July Street, Opp. Lulu Hypermarket, Salalah Sultanate of Oman</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="tel:+96896785802" className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90">
                    Call Now
                  </a>
                  <a href="https://wa.me/96896785802" target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                    WhatsApp
                  </a>
                  <Link href="/contact" className="rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                    Contact Form
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
