'use client'

interface ToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  size?: 'sm' | 'md'
}

export function Toggle({ options, value, onChange, label, size = 'md' }: ToggleProps) {
  const isCompact = size === 'sm'

  return (
    <div className="w-full">
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </span>
      )}
      <div className={`inline-flex bg-slate-100 rounded-lg p-1 ${isCompact ? 'w-full' : 'w-full'}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex-1 min-w-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all truncate
              sm:px-3 sm:py-2 sm:text-sm
              ${value === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
