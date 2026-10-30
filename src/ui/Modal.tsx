import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Btn } from './Btn'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-lg text-[var(--color-text)] m-0">{title}</h2>
          <Btn variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Btn>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
        {footer && <div className="p-4 border-t border-[var(--color-border)] flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  )
}
