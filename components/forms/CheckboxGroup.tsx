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
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-brand-dark">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                checked
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-gray-300 bg-white text-gray-600',
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
