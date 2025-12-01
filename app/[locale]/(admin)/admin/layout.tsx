import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
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
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col pl-64">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AdminLayoutWrapper>
  )
}
