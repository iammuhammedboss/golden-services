import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AdminLayoutWrapper } from '@/components/admin-layout-wrapper'
import { authOptions } from '@/lib/auth'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${params.locale}/login`)
  }

  return (
    <AdminLayoutWrapper>
      {children}
    </AdminLayoutWrapper>
  )
}
