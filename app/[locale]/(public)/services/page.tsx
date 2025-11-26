import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      services: {
        where: { isActive: true },
        include: {
          pricingRules: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Our Services</h1>
        <p className="text-lg text-muted-foreground">
          Professional solutions tailored to your needs
        </p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{category.name}</h2>
              {category.description && (
                <p className="mt-2 text-muted-foreground">{category.description}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service) => (
                <Card key={service.id} className="flex flex-col transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription>
                      {service.description || 'Professional service with attention to detail.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {service.pricingRules.length > 0 && (
                      <div className="mb-4 space-y-1">
                        <p className="text-sm font-semibold">Pricing:</p>
                        {service.pricingRules.map((rule) => (
                          <p key={rule.id} className="text-sm text-muted-foreground">
                            {rule.basePrice.toString()} {rule.currency} / {rule.unitLabel}
                          </p>
                        ))}
                      </div>
                    )}
                    <Link href={`/services/${service.slug}`}>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {category.services.length === 0 && (
              <p className="text-center text-muted-foreground">
                No services available in this category.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-lg bg-muted p-8 text-center">
        <h3 className="mb-4 text-2xl font-bold">Need a Custom Solution?</h3>
        <p className="mb-6 text-muted-foreground">
          Contact us to discuss your specific requirements and get a tailored quotation.
        </p>
        <Link href="/contact">
          <Button size="lg">Contact Us</Button>
        </Link>
      </div>
    </div>
  )
}
