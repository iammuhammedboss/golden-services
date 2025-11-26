'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What services does Golden Services provide?',
        answer:
          'We provide comprehensive cleaning services, pest control, manpower services, and facility management for both residential and commercial properties across Oman.',
      },
      {
        question: 'What areas do you serve?',
        answer:
          'We primarily serve Muscat and surrounding areas. However, for larger projects, we can extend our services to other regions in Oman. Contact us to discuss your specific location.',
      },
      {
        question: 'Are you licensed and insured?',
        answer:
          'Yes, Golden Services is fully licensed to operate in Oman and carries comprehensive insurance coverage for all our services and staff.',
      },
    ],
  },
  {
    category: 'Booking & Scheduling',
    questions: [
      {
        question: 'How do I book a service?',
        answer:
          'You can book a service through our website using the "Book Now" button, contact us via WhatsApp, call our phone number, or fill out the contact form. Our team will get back to you promptly to confirm your booking.',
      },
      {
        question: 'How far in advance should I book?',
        answer:
          'We recommend booking at least 2-3 days in advance for regular services. For urgent requests, contact us directly and we\'ll do our best to accommodate you.',
      },
      {
        question: 'Can I reschedule or cancel my appointment?',
        answer:
          'Yes, you can reschedule or cancel your appointment. Please notify us at least 24 hours in advance to avoid any cancellation fees.',
      },
      {
        question: 'Do you offer emergency services?',
        answer:
          'Yes, we offer emergency services for urgent situations such as pest infestations or critical cleaning needs. Additional charges may apply for emergency call-outs.',
      },
    ],
  },
  {
    category: 'Pricing & Payment',
    questions: [
      {
        question: 'How do you determine pricing?',
        answer:
          'Our pricing depends on several factors including the type of service, size of the area, frequency of service, and specific requirements. We provide detailed quotations after an initial consultation or site visit.',
      },
      {
        question: 'Do you provide free quotations?',
        answer:
          'Yes, we provide free, no-obligation quotations. For some services, we may need to conduct a site visit to give you an accurate estimate.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept cash, bank transfers, and online payments. Payment terms will be specified in your quotation and can be discussed with our team.',
      },
      {
        question: 'Do you offer discounts for regular service contracts?',
        answer:
          'Yes, we offer competitive rates for regular service contracts and long-term commitments. Contact us to discuss custom packages tailored to your needs.',
      },
    ],
  },
  {
    category: 'Service Quality',
    questions: [
      {
        question: 'Are your staff trained and vetted?',
        answer:
          'Yes, all our staff members are thoroughly trained, vetted, and experienced professionals. We conduct background checks and provide ongoing training to ensure the highest service quality.',
      },
      {
        question: 'What if I\'m not satisfied with the service?',
        answer:
          'Your satisfaction is our priority. If you\'re not completely satisfied with our service, please contact us within 24 hours and we\'ll make it right at no additional cost.',
      },
      {
        question: 'Do you use eco-friendly products?',
        answer:
          'Yes, we prioritize the use of environmentally friendly and safe cleaning products. We can also accommodate specific product preferences upon request.',
      },
      {
        question: 'Do I need to be present during the service?',
        answer:
          'It\'s not mandatory, but we recommend being present for the first service. Once we\'re familiar with your requirements and you\'re comfortable with our team, you can provide access and we\'ll service your property professionally.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our services
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="mb-4 text-2xl font-bold">{category.category}</h2>
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`
                  const isOpen = openItems.includes(itemId)

                  return (
                    <Card key={faqIndex}>
                      <CardContent className="p-0">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
                        >
                          <span className="pr-8 font-semibold">{faq.question}</span>
                          <svg
                            className={cn(
                              'h-5 w-5 flex-shrink-0 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="border-t px-6 pb-6 pt-4">
                            <p className="text-muted-foreground">{faq.answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-lg bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold">Still Have Questions?</h2>
          <p className="mb-8 text-lg opacity-90">
            Can't find the answer you're looking for? Our team is here to help!
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Contact Us
              </Button>
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '96812345678'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
                Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
