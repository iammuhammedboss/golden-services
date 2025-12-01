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
    <div className="min-h-screen bg-gradient-to-b from-gold-50/30 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gold-100 to-gold-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 inline-block rounded-lg bg-gold-200 px-3 py-1">
            <span className="text-sm font-semibold text-gold-900">What We Offer</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold md:text-6xl">
            Our <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">Services</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Professional solutions tailored to meet your unique needs with excellence and dedication
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

      <div className="space-y-20">
        {categories.map((category, catIndex) => (
          <div key={category.id}>
            <div className="mb-10 text-center md:text-left">
              <div className="mb-3 inline-flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-white font-bold">
                  {catIndex + 1}
                </div>
                <h2 className="text-3xl font-bold md:text-4xl text-gray-900">{category.name}</h2>
              </div>
              {category.description && (
                <p className="mt-3 text-lg text-gray-600 max-w-3xl md:ml-12">{category.description}</p>
              )}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service, svcIndex) => (
                <Card key={service.id} className="group relative flex flex-col overflow-hidden border-2 border-transparent hover:border-gold-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-gold-600"></div>

                  {/* Placeholder Image Area */}
                  <div className="relative h-48 bg-gradient-to-br from-gold-100 to-gold-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-bold text-gold-300 opacity-50">{svcIndex + 1}</div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gold-500 text-gray-900 border-0 shadow-md">Active</Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl group-hover:text-gold-600 transition-colors">{service.name}</CardTitle>
                    <CardDescription className="text-base text-gray-600 leading-relaxed">
                      {service.description || 'Professional service with meticulous attention to detail and guaranteed satisfaction.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {service.pricingRules.length > 0 && (
                      <div className="mb-4 rounded-lg bg-gold-50 p-4 border border-gold-200">
                        <p className="text-sm font-bold text-gold-900 mb-2">Pricing:</p>
                        {service.pricingRules.map((rule) => (
                          <p key={rule.id} className="text-base text-gray-700 font-semibold">
                            {rule.basePrice.toString()} <span className="text-gold-600">{rule.currency}</span> / {rule.unitLabel}
                          </p>
                        ))}
                      </div>
                    )}
                    <Link href={`/services/${service.slug}`} className="mt-auto">
                      <Button variant="outline" className="w-full border-2 border-gold-400 text-gold-700 hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all font-semibold">
                        View Details →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {category.services.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-lg">
                No services available in this category.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 via-gold-400 to-gold-600 p-12 md:p-16 text-center shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">Need a Custom Solution?</h3>
          <p className="mb-8 text-xl text-gray-800 max-w-2xl mx-auto">
            Contact us to discuss your specific requirements and get a tailored quotation designed just for you.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-bold shadow-xl text-lg px-10 py-6">
              Contact Us →
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </div>
  )
}
