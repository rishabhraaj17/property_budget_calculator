'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { Button } from './ui'

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileMenuOpen])

  const navLinks = [
    { href: '/', label: 'Properties' },
    { href: '/compare', label: 'Compare' },
    { href: '/loan-optimizer', label: 'Loan Optimizer' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Property Calculator</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Indian Real Estate Financial Architect</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <nav className="flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${pathname === link.href
                        ? 'text-primary-600'
                        : 'text-slate-600 hover:text-primary-600'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Auth Section */}
              <div className="border-l border-slate-200 pl-4">
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                ) : isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-primary-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:inline">{user.name || user.email.split('@')[0]}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">{user.name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            logout()
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-slate-200 bg-white animate-fade-in">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {/* Mobile Auth */}
            <div className="px-4 py-3 border-t border-slate-100">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium text-sm">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.name || user.email.split('@')[0]}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="text-sm text-slate-600 hover:text-danger-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowAuthModal(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
