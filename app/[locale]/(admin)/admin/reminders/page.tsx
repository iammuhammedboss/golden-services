'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'

export default function RemindersPage() {
  const t = useTranslations('Reminders')
  const tc = useTranslations('Common')
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', reminderDate: '', reminderTime: '' })
  const [saving, setSaving] = useState(false)

  const fetchReminders = async () => {
    try {
      const res = await fetch(`/api/reminders?completed=${showCompleted}`)
      if (res.ok) setReminders(await res.json())
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReminders() }, [showCompleted])

  const handleCreate = async () => {
    if (!form.title || !form.reminderDate) return
    setSaving(true)
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm({ title: '', description: '', reminderDate: '', reminderTime: '' })
      setShowForm(false)
      await fetchReminders()
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: true }),
    })
    await fetchReminders()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    await fetchReminders()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueReminders = reminders.filter(
    (r) => !r.isCompleted && new Date(r.reminderDate) < today
  )
  const todayReminders = reminders.filter((r) => {
    const d = new Date(r.reminderDate)
    d.setHours(0, 0, 0, 0)
    return !r.isCompleted && d.getTime() === today.getTime()
  })
  const upcomingReminders = reminders.filter(
    (r) => !r.isCompleted && new Date(r.reminderDate) > today
  )
  const completedReminders = reminders.filter((r) => r.isCompleted)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? tc('cancel') : t('new')}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <Label className="text-xs">{t('formTitle')}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('titlePlaceholder')}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t('notesOptional')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t('date')}</Label>
                <Input
                  type="date"
                  value={form.reminderDate}
                  onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{t('timeOptional')}</Label>
                <Input
                  type="time"
                  value={form.reminderTime}
                  onChange={(e) => setForm({ ...form, reminderTime: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={saving || !form.title || !form.reminderDate}
            >
              {saving ? tc('saving') : t('createReminder')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overdue */}
      {overdueReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">
              {t('overdue')} ({overdueReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {overdueReminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} onComplete={handleComplete} onDelete={handleDelete} t={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today */}
      {todayReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">
              {t('today')} ({todayReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {todayReminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} onComplete={handleComplete} onDelete={handleDelete} t={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('upcoming')} ({upcomingReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {upcomingReminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} onComplete={handleComplete} onDelete={handleDelete} t={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Show completed toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-sm text-muted-foreground underline"
        >
          {showCompleted ? t('hideCompleted') : t('showCompleted')}
        </button>
      </div>

      {showCompleted && completedReminders.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {completedReminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} onComplete={handleComplete} onDelete={handleDelete} t={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && reminders.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('emptyState', { button: t('new') })}
        </p>
      )}
    </div>
  )
}

function ReminderItem({
  reminder,
  onComplete,
  onDelete,
  t,
}: {
  reminder: any
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  t: (key: string) => string
}) {
  const isOverdue = !reminder.isCompleted && new Date(reminder.reminderDate) < new Date()

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${
      reminder.isCompleted ? 'bg-gray-50 opacity-60' : isOverdue ? 'border-red-200 bg-red-50' : ''
    }`}>
      <button
        onClick={() => !reminder.isCompleted && onComplete(reminder.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          reminder.isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
        }`}
      >
        {reminder.isCompleted && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${reminder.isCompleted ? 'line-through' : ''}`}>
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{reminder.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(reminder.reminderDate)}
          {reminder.reminderTime && ` ${t('at')} ${reminder.reminderTime}`}
        </p>
      </div>
      <button
        onClick={() => onDelete(reminder.id)}
        className="shrink-0 text-muted-foreground hover:text-red-500"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
