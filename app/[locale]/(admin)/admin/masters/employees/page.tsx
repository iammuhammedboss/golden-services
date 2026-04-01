'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/components/confirm-dialog'

type Employee = {
  id: string; code: string; name: string; email?: string; phone?: string; isActive: boolean; createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const params = useParams()
  const { confirm, ConfirmDialog } = useConfirm()
  const t = useTranslations('Masters')
  const tc = useTranslations('Common')

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/sales-executives?all=true')
      if (res.ok) setEmployees(await res.json())
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  const resetForm = () => { setForm({ code: '', name: '', email: '', phone: '' }); setEditId(null); setError(''); setShowForm(false) }

  const openEdit = (emp: Employee) => {
    setForm({ code: emp.code, name: emp.name, email: emp.email || '', phone: emp.phone || '' })
    setEditId(emp.id)
    setShowForm(true)
    setActionMenuId(null)
  }

  const handleSave = async () => {
    setError('')
    if (!form.code || !form.name) { setError(t('codeNameRequired')); return }
    setSaving(true)
    try {
      const url = editId ? `/api/sales-executives/${editId}` : '/api/sales-executives'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { resetForm(); fetchEmployees() }
      else { const data = await res.json(); setError(data.error || 'Failed to save') }
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (emp: Employee) => {
    setActionMenuId(null)
    const ok = await confirm({ title: t('deleteEmployee'), description: t('deleteEmployeeDesc', { name: emp.name, code: emp.code }), variant: 'danger', confirmLabel: tc('delete') })
    if (!ok) return
    try {
      await fetch(`/api/sales-executives/${emp.id}`, { method: 'DELETE' })
      fetchEmployees()
    } catch { alert('Failed to delete') }
  }

  const handleDuplicate = (emp: Employee) => {
    setForm({ code: emp.code + '-COPY', name: emp.name + ' (Copy)', email: emp.email || '', phone: emp.phone || '' })
    setEditId(null)
    setShowForm(true)
    setActionMenuId(null)
  }

  const handleToggleActive = async (emp: Employee) => {
    setActionMenuId(null)
    await fetch(`/api/sales-executives/${emp.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !emp.isActive }),
    })
    fetchEmployees()
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {ConfirmDialog}

      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('employees')}</h1>
        <p className="text-xs text-gray-400">{t('employeesDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-800">{employees.length}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('total')}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-green-600">{employees.filter(e => e.isActive).length}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('active')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-400">{employees.filter(e => !e.isActive).length}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('inactive')}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{editId ? t('editEmployee') : t('newEmployee')}</h3>
            <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600">{tc('cancel')}</button>
          </div>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{tc('code')} <span className="text-red-400">*</span></Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('codePlaceholder')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{tc('name')} <span className="text-red-400">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('fullNamePlaceholder')} className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{tc('email')}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={tc('email')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{tc('phone')}</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+968..." className="rounded-xl" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !form.code || !form.name}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md active:scale-[0.98] disabled:opacity-50">
            {saving ? tc('saving') : editId ? tc('saveChanges') : t('addEmployee')}
          </button>
        </div>
      )}

      {/* Employee Cards */}
      <div className="space-y-2">
        {employees.map((emp) => (
          <div key={emp.id} className="relative rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                emp.isActive ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {emp.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                  {!emp.isActive && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-400">{tc('inactive')}</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {emp.phone || emp.email || t('noContactInfo')}
                </p>
              </div>
              <button onClick={() => setActionMenuId(actionMenuId === emp.id ? null : emp.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
              </button>
            </div>

            {actionMenuId === emp.id && (
              <div className="absolute right-2 top-12 z-20 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                <button onClick={() => openEdit(emp)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
                <button onClick={() => handleDuplicate(emp)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Duplicate
                </button>
                <button onClick={() => handleToggleActive(emp)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={emp.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                  {emp.isActive ? t('deactivate') : t('activate')}
                </button>
                <div className="my-1 border-t border-gray-50" />
                <button onClick={() => handleDelete(emp)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {employees.length === 0 && (
          <div className="py-12 text-center"><p className="text-sm text-gray-400">{tc('noData')}</p></div>
        )}
      </div>

      {/* Close action menus */}
      {actionMenuId && <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />}

      {/* FAB */}
      {!showForm && (
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}
    </div>
  )
}
