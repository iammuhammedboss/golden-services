import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

import VideoBackground from '@/components/video-background'

export default async function HomePage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { category: true },
    take: 6,
  })

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <VideoBackground src="/bg-video.mp4" type="video/mp4" />
        <div className="container relative mx-auto px-4 py-24 md:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block rounded-full bg-gold-100 px-4 py-1.5">
              <span className="text-sm font-semibold text-gold-800">Premium Quality Services</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Professional Services for Your{' '}
              <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
                Home & Business
              </span>
            </h1>
            <p className="mb-10 text-xl text-gray-600 sm:text-2xl">
              Expert cleaning, pest control, and manpower services in Oman. We deliver quality you can trust.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/book-now">
                <Button size="lg" className="w-full bg-gold-500 hover:bg-gold-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all sm:w-auto text-lg px-8 py-6">
                  Book Now →
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gold-400 text-gray-900 hover:bg-gold-50 text-lg px-8 py-6">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-lg bg-gold-100 px-3 py-1">
              <span className="text-sm font-semibold text-gold-800">What We Offer</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">Our <span className="text-gold-600">Services</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive solutions tailored to meet all your service needs with excellence
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Card key={service.id} className="group relative overflow-hidden border-2 border-transparent hover:border-gold-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-gold-400 to-gold-600"></div>
                <CardHeader className="pb-4">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold">{index + 1}</span>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-gold-600 transition-colors">{service.name}</CardTitle>
                  <CardDescription className="text-base text-gold-700 font-medium">{service.category.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-6 text-gray-600 leading-relaxed">
                    {service.description || 'Professional service with meticulous attention to detail and guaranteed satisfaction.'}
                  </p>
                  <Link href={`/services/${service.slug}`}>
                    <Button variant="outline" className="w-full border-2 border-gold-400 text-gold-700 hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all font-semibold">
                      Learn More →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/services">
              <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-gray-900 font-semibold shadow-lg px-8">
                View All Services →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-gold-50/20 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-lg bg-gold-100 px-3 py-1">
              <span className="text-sm font-semibold text-gold-800">Simple Process</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">How It <span className="text-gold-600">Works</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="group relative text-center">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-3xl font-bold text-white shadow-2xl transition-transform group-hover:scale-110">
                1
                <div className="absolute -inset-2 rounded-2xl bg-gold-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Book Online</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Choose your service and schedule a convenient time through our website or WhatsApp.
              </p>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute top-12 -right-6 text-gold-400 text-4xl">→</div>
            </div>

            <div className="group relative text-center">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-3xl font-bold text-white shadow-2xl transition-transform group-hover:scale-110">
                2
                <div className="absolute -inset-2 rounded-2xl bg-gold-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Get a Quote</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Our team will visit your site, assess your needs, and provide a detailed quotation.
              </p>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute top-12 -right-6 text-gold-400 text-4xl">→</div>
            </div>

            <div className="group relative text-center">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-3xl font-bold text-white shadow-2xl transition-transform group-hover:scale-110">
                3
                <div className="absolute -inset-2 rounded-2xl bg-gold-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">Relax</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Our professional team delivers quality service on time, every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 via-gold-400 to-gold-600 px-8 py-16 md:py-20 text-center shadow-2xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="mb-5 text-4xl font-bold text-gray-900 md:text-5xl">Ready to Get Started?</h2>
              <p className="mb-10 text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
                Book your service today and experience the difference of professional quality and exceptional service.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/book-now">
                  <Button size="lg" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-bold shadow-xl text-lg px-10 py-6">
                    Book Now →
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-900 bg-transparent text-gray-900 hover:bg-gray-900 hover:text-white font-bold text-lg px-10 py-6">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
