'use client'

import { useState, useCallback } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" onClick={onCancel}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div
        className="relative z-10 mx-4 mb-4 w-full max-w-sm animate-fadeIn rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
          variant === 'danger' ? 'bg-red-50' : 'bg-blue-50'
        }`}>
          {variant === 'danger' ? (
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-1.5 text-sm text-gray-500">{description}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-200/40'
                : 'bg-gradient-to-r from-primary to-gold-600 shadow-md shadow-gold-200/40'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Please wait...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Hook for easy usage */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    variant: 'danger' | 'default'
    confirmLabel: string
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    confirmLabel: 'Confirm',
    resolve: null,
  })

  const confirm = useCallback(
    (opts: { title: string; description: string; variant?: 'danger' | 'default'; confirmLabel?: string }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: opts.title,
          description: opts.description,
          variant: opts.variant || 'default',
          confirmLabel: opts.confirmLabel || 'Confirm',
          resolve,
        })
      })
    },
    []
  )

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState((s) => ({ ...s, open: false }))
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState((s) => ({ ...s, open: false }))
  }, [state.resolve])

  const ConfirmDialogEl = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmLabel={state.confirmLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, ConfirmDialog: ConfirmDialogEl }
}
