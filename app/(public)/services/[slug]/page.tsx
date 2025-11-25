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

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2 font-semibold">Need Help?</p>
                <p className="text-muted-foreground">
                  Our team is ready to answer your questions and help you choose the right service.
                </p>
                <Link href="/contact" className="mt-2 inline-block text-primary hover:underline">
                  Contact Us →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
