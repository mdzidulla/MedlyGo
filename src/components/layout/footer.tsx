'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo_medlygo.PNG"
                alt="MedlyGo Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-h3 font-bold text-white">MedlyGo</span>
            </Link>
            <p className="text-body-sm text-gray-400">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-label mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {tNav('home')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-label mb-4">{t('support')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {tNav('helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-label mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-body-sm text-gray-400 hover:text-white transition-colors">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-body-sm text-gray-400">
            © {currentYear} MedlyGo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
