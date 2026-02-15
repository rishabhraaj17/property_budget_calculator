'use client'

import { RecommendationType } from '@/lib/loanOptimizerTypes'
import { Card } from './ui'

interface RecommendationCardProps {
    recommendations: RecommendationType[]
}

const iconMap: Record<'trending-down' | 'wallet' | 'chart-up' | 'alert' | 'info' | 'check', JSX.Element> = {
    'trending-down': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
    ),
    'wallet': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    'chart-up': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
    ),
    'alert': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    'info': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    'check': (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
}

const colorStyles = {
    success: {
        bg: 'bg-success-50',
        border: 'border-success-200',
        icon: 'bg-success-100 text-success-600',
        title: 'text-success-900',
        description: 'text-success-700',
    },
    primary: {
        bg: 'bg-primary-50',
        border: 'border-primary-200',
        icon: 'bg-primary-100 text-primary-600',
        title: 'text-primary-900',
        description: 'text-primary-700',
    },
    warning: {
        bg: 'bg-warning-50',
        border: 'border-warning-200',
        icon: 'bg-warning-100 text-warning-600',
        title: 'text-warning-900',
        description: 'text-warning-700',
    },
    danger: {
        bg: 'bg-danger-50',
        border: 'border-danger-200',
        icon: 'bg-danger-100 text-danger-600',
        title: 'text-danger-900',
        description: 'text-danger-700',
    },
    slate: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        icon: 'bg-slate-100 text-slate-600',
        title: 'text-slate-900',
        description: 'text-slate-700',
    },
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
    if (recommendations.length === 0) {
        return null
    }

    // Get the top recommendation (highest priority = lowest number)
    const topRecommendation = recommendations[0]
    const otherRecommendations = recommendations.slice(1, 4) // Show up to 3 more

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4 md:mb-6">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900">Smart Recommendations</h3>
            </div>

            {/* Top Recommendation - Featured */}
            <div
                className={`
          rounded-xl p-5 border-2 mb-4
          ${colorStyles[topRecommendation.color].bg}
          ${colorStyles[topRecommendation.color].border}
        `}
            >
                <div className="flex gap-4">
                    <div
                        className={`
              w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center
              ${colorStyles[topRecommendation.color].icon}
            `}
                    >
                        {iconMap[topRecommendation.icon]}
                    </div>
                    <div className="flex-1">
                        <h4 className={`font-semibold text-lg ${colorStyles[topRecommendation.color].title}`}>
                            {topRecommendation.title}
                        </h4>
                        <p className={`mt-1 text-sm leading-relaxed ${colorStyles[topRecommendation.color].description}`}>
                            {topRecommendation.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Other Recommendations */}
            {otherRecommendations.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Additional Insights
                    </p>
                    {otherRecommendations.map((rec, index) => (
                        <div
                            key={index}
                            className={`
                rounded-lg p-4 border flex gap-3
                ${colorStyles[rec.color].bg}
                ${colorStyles[rec.color].border}
              `}
                        >
                            <div
                                className={`
                  w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  ${colorStyles[rec.color].icon}
                `}
                            >
                                <span className="scale-75">{iconMap[rec.icon]}</span>
                            </div>
                            <div className="flex-1">
                                <h5 className={`font-medium text-sm ${colorStyles[rec.color].title}`}>
                                    {rec.title}
                                </h5>
                                <p className={`mt-0.5 text-xs ${colorStyles[rec.color].description}`}>
                                    {rec.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Disclaimer */}
            <p className="mt-6 text-xs text-slate-400 italic">
                * These recommendations are based on general financial principles. Please consult a qualified financial advisor for personalized advice.
            </p>
        </Card>
    )
}
