'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { TooltipDefinition } from '@/lib/types'

interface TooltipProps {
  content: TooltipDefinition | string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  showIcon?: boolean
}

export function Tooltip({ content, children, position = 'top', showIcon = true }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowDetails(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isDetailedTooltip = typeof content !== 'string'

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent',
  }

  return (
    <div className="relative inline-flex items-center gap-1" ref={tooltipRef}>
      {children}
      {showIcon && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => !isOpen && setIsOpen(true)}
          onMouseLeave={() => !showDetails && setIsOpen(false)}
          className="inline-flex items-center justify-center w-4 h-4 text-xs text-slate-400 hover:text-primary-600 transition-colors"
          aria-label="More information"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute z-50 ${positionClasses[position]}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-800 text-white rounded-lg shadow-lg max-w-sm">
            {isDetailedTooltip ? (
              <div className="p-3">
                <div className="font-semibold text-sm mb-1">{content.term}</div>
                <p className="text-xs text-slate-300 mb-2">{content.shortDescription}</p>

                {showDetails ? (
                  <div className="space-y-2 animate-fade-in">
                    <p className="text-xs text-slate-200 whitespace-pre-line">
                      {content.longDescription}
                    </p>
                    {content.example && (
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-xs text-primary-300 font-medium">Example: </span>
                        <span className="text-xs text-slate-300">{content.example}</span>
                      </div>
                    )}
                    {content.source && (
                      <p className="text-xs text-slate-400 italic">Source: {content.source}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDetails(false)}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Show less
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Learn more...
                  </button>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 text-xs">{content}</div>
            )}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  )
}

// Simple inline info badge showing auto-selected status
interface AutoBadgeProps {
  label: string
  value: string
  tooltipKey?: string
}

export function AutoBadge({ label, value, tooltipKey }: AutoBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      {tooltipKey && (
        <span className="text-primary-500 ml-0.5">(Auto)</span>
      )}
    </span>
  )
}
