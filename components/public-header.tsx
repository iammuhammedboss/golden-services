'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const params = useParams()
  const locale = (params.locale as string) || 'en'

  const navigation = [
    { name: 'Home', href: '' },
    { name: 'Services', href: 'services' },
    { name: 'About', href: 'about' },
    { name: 'FAQ', href: 'faq' },
    { name: 'Contact', href: 'contact' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="Golden Services Logo"
            width={50}
            height={50}
            className="h-12 w-auto"
            priority
          />
          <span className="text-xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">Golden Services</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={`/${locale}/${item.href}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:space-x-4">
          <Link href={`/${locale}/book-now`}>
            <Button>Book Now</Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="ghost">Login</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={`/${locale}/${item.href}`}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="space-y-2 pt-4">
              <Link href={`/${locale}/book-now`} className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Book Now</Button>
              </Link>
              <Link href={`/${locale}/login`} className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
