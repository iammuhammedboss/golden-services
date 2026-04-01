'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const t = useTranslations('Login')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = t('emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('invalidEmail')
    if (!formData.password) newErrors.password = t('passwordRequired')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    setErrors({})
    try {
      const result = await signIn('credentials', { redirect: false, email: formData.email, password: formData.password })
      if (result?.error) setErrors({ submit: t('invalidCredentials') })
      else if (result?.ok) { router.push(`/${locale}/admin/dashboard`); router.refresh() }
    } catch { setErrors({ submit: t('error') }) }
    finally { setIsSubmitting(false) }
  }

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const isRtl = locale === 'ar'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gold-50 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gold-100/40" style={{ filter: 'blur(80px)' }} />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gold-200/30" style={{ filter: 'blur(80px)' }} />
      </div>

      {/* Language Switcher — top right */}
      <div className="absolute top-4 right-4 z-10">
        <Link
          href={`/${otherLocale}/login`}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          {otherLocale === 'ar' ? 'العربية' : 'English'}
        </Link>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center animate-fadeIn">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-gold-200/50 ring-1 ring-gray-100">
            <Image src="/logo.png" alt="Golden Services" width={56} height={56} priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {locale === 'ar' ? 'الخدمات' : 'Golden'} <span className="text-gold-600">{locale === 'ar' ? 'الذهبية' : 'Services'}</span>
          </h1>
          <p className="mt-1 text-xs tracking-wide text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-sm animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{t('welcome')}</h2>
            <p className="text-sm text-gray-500">{t('signIn')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-600">{t('email')}</Label>
              <div className="relative">
                <div className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t('emailPlaceholder')} autoComplete="email"
                  className={`${isRtl ? 'pr-9' : 'pl-9'} h-11 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-gold-400`} />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-gray-600">{t('password')}</Label>
              <div className="relative">
                <div className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder={t('passwordPlaceholder')} autoComplete="current-password"
                  className={`${isRtl ? 'pr-9 pl-10' : 'pl-9 pr-10'} h-11 rounded-xl border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-gold-400`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-gray-400 hover:text-gray-600`}>
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errors.submit}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-sm font-semibold text-white shadow-lg shadow-gold-300/30 transition-all hover:from-gold-600 hover:to-gold-700 active:scale-[0.98] disabled:opacity-60">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t('signingIn')}
                </span>
              ) : t('signInButton')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">&copy; {new Date().getFullYear()} {t('copyright')}</p>
      </div>
    </div>
  )
}
