import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'

export default function Home() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section with Background */}
        <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 max-w-6xl py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-display font-bold text-white mb-6 leading-tight">
                  {t('hero.title')}
                </h1>
                <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto lg:mx-0">
                  {t('hero.subtitle')}
                </p>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={t('hero.searchPlaceholder')}
                      className="w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-white/95 backdrop-blur text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-lg"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/login">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 shadow-lg">
                      {t('hero.ctaButton')}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                      Check Existing Booking
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8">
                  <div className="text-center lg:text-left">
                    <p className="text-3xl font-bold text-white">50+</p>
                    <p className="text-sm text-white/70">Partner Hospitals</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-3xl font-bold text-white">10K+</p>
                    <p className="text-sm text-white/70">Appointments Booked</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-3xl font-bold text-white">98%</p>
                    <p className="text-sm text-white/70">Patient Satisfaction</p>
                  </div>
                </div>
              </div>

              {/* Hero Image/Card */}
              <div className="flex-1 hidden lg:flex justify-center">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Quick Booking</h3>
                    <p className="text-white/80 text-sm mb-6">Book appointments in just 3 simple steps</p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3 text-white/90">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">1</div>
                        <span className="text-sm">Select Hospital & Department</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">2</div>
                        <span className="text-sm">Choose Date & Time</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">3</div>
                        <span className="text-sm">Confirm & Receive SMS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-h1 text-center text-gray-900 mb-4">{t('howItWorks.title')}</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Getting a hospital appointment has never been easier. Follow these simple steps to book your visit.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <svg className="w-10 h-10 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('howItWorks.step1.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('howItWorks.step1.description')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-secondary-100 rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
                  <svg className="w-10 h-10 text-secondary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('howItWorks.step2.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('howItWorks.step2.description')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-accent-100 rounded-2xl flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <svg className="w-10 h-10 text-accent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('howItWorks.step3.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-h1 text-center text-gray-900 mb-4">{t('features.title')}</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Experience hassle-free healthcare booking with features designed for your convenience.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('features.free.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('features.free.description')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('features.reminders.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('features.reminders.description')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('features.support.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('features.support.description')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('features.multilingual.title')}</h3>
                <p className="text-body-sm text-gray-600">
                  {t('features.multilingual.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Book Your Appointment?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who have simplified their healthcare journey with MedlyGo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
