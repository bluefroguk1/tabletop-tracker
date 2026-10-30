import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Btn({ variant = 'secondary', size = 'md', className = '', children, ...rest }: Props) {
  const v = {
    primary:   'bg-[var(--color-accent)] text-white hover:opacity-90 active:opacity-80',
    secondary: 'bg-[var(--color-surface2)] text-[var(--color-text)] hover:opacity-90 border border-[var(--color-border)]',
    danger:    'bg-[var(--color-danger)] text-white hover:opacity-90',
    ghost:     'text-[var(--color-muted)] hover:text-[var(--color-text)]',
  }[variant]
  const s = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5', lg: 'px-6 py-4 text-lg font-semibold' }[size]
  return (
    <button
      className={`rounded-xl font-medium transition-opacity disabled:opacity-40 disabled:pointer-events-none ${v} ${s} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
