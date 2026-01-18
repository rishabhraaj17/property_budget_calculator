'use client'

interface ToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function Toggle({ options, value, onChange, label }: ToggleProps) {
  return (
    <div className="w-full">
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </span>
      )}
      <div className="flex bg-slate-100 rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
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
