import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'green' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-soft',
  green: 'bg-brand-green text-white shadow-[0_4px_12px_rgba(16,185,129,.35)] hover:bg-emerald-600',
  secondary: 'bg-brand-yellow text-brand-dark hover:brightness-95 shadow-soft',
  ghost: 'bg-white text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/5',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  dark: 'bg-slatehead text-white hover:bg-slatehead-2 shadow-soft',
}

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-btn font-display font-extrabold tracking-tight transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
