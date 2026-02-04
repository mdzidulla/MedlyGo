'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const t = useTranslations('nav')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo_medlygo.PNG"
                alt="MedlyGo Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-h3 font-bold text-primary">MedlyGo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/hospitals"
              className="text-body-sm text-gray-600 hover:text-primary transition-colors"
            >
              Hospitals
            </Link>
            <Link
              href="/departments"
              className="text-body-sm text-gray-600 hover:text-primary transition-colors"
            >
              Departments
            </Link>
            <Link
              href="/about"
              className="text-body-sm text-gray-600 hover:text-primary transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSwitcher />

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{t('signup')}</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/hospitals"
                className="px-4 py-2 text-body text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hospitals
              </Link>
              <Link
                href="/departments"
                className="px-4 py-2 text-body text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                Departments
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 text-body text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                About
              </Link>
              <div className="border-t border-gray-200 my-2" />
              <Link href="/login" className="px-4">
                <Button variant="outline" className="w-full">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/signup" className="px-4">
                <Button className="w-full">{t('signup')}</Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
