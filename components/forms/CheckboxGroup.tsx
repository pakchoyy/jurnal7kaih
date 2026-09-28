'use client'

import { cn } from '@/lib/utils'

interface CheckboxGroupProps {
  label?: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
}

export function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="font-display text-[13px] font-extrabold text-ink">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                'rounded-pill border-[1.5px] px-3.5 py-1.5 text-xs font-semibold transition active:scale-[.97]',
                checked
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-line bg-white text-ink-2',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
