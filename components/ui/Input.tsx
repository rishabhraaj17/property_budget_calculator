'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
  labelClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = '', labelClassName = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    // Calculate padding based on suffix - be conservative to avoid layout issues
    const suffixPaddingClass = suffix
      ? (suffix.length > 4 ? 'pr-20' : 'pr-12')
      : ''

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={`block text-sm font-medium text-slate-700 mb-1.5 ${labelClassName}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none z-10">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 rounded-lg border outline-none transition-all
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${prefix ? 'pl-8' : ''}
              ${suffixPaddingClass}
              ${error
                ? 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-danger-500'
                : 'border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }
              ${className}
              bg-white placeholder:text-slate-400
            `}
            style={{
              color: '#0f172a',
              fontWeight: 500,
            }}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs whitespace-nowrap pointer-events-none z-10">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
