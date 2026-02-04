'use client'

import * as React from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState('')

  const categories = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Booking Appointments',
      description: 'Learn how to book, reschedule, or cancel appointments',
      articles: [
        'How to book an appointment',
        'Rescheduling your appointment',
        'Cancelling an appointment',
        'Choosing the right department',
      ],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Account & Profile',
      description: 'Manage your account settings and personal information',
      articles: [
        'Creating an account',
        'Updating your profile',
        'Changing your password',
        'Managing notifications',
      ],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Hospitals & Services',
      description: 'Information about partner hospitals and available services',
      articles: [
        'Finding a hospital near you',
        'Available departments and services',
        'Hospital visiting hours',
        'What to bring to your appointment',
      ],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Payments & Billing',
      description: 'Understanding fees, payments, and insurance',
      articles: [
        'Is MedlyGo free to use?',
        'Hospital fees and payments',
        'NHIS coverage information',
        'Payment methods accepted',
      ],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Mobile & SMS',
      description: 'Using MedlyGo via SMS and mobile devices',
      articles: [
        'Booking via SMS (USSD coming soon)',
        'Understanding SMS confirmations',
        'Managing SMS notifications',
        'Mobile browser tips',
      ],
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Privacy & Security',
      description: 'How we protect your data and privacy',
      articles: [
        'How we protect your data',
        'Your privacy rights',
        'Data sharing policies',
        'Account security tips',
      ],
    },
  ]

  const popularArticles = [
    { title: 'How to book your first appointment', views: '2.5k' },
    { title: 'What to do if you miss your appointment', views: '1.8k' },
    { title: 'Understanding SMS confirmation codes', views: '1.5k' },
    { title: 'How to prepare for your hospital visit', views: '1.2k' },
    { title: 'Updating your contact information', views: '980' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16 lg:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Help Center</h1>
              <p className="text-lg text-white/90 mb-8">
                Find answers to your questions and learn how to make the most of MedlyGo.
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-white/95 backdrop-blur text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-lg"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-h1 text-center text-gray-900 mb-12">Browse by Category</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Card key={category.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary mb-4">
                      {category.icon}
                    </div>
                    <h3 className="text-h3 text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-body-sm text-gray-600 mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article}>
                          <Link
                            href="#"
                            className="text-body-sm text-primary hover:text-primary-700 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {article}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-h1 text-center text-gray-900 mb-12">Popular Articles</h2>

            <Card>
              <CardContent className="p-0">
                {popularArticles.map((article, index) => (
                  <Link
                    key={article.title}
                    href="#"
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      index !== popularArticles.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-body text-gray-900">{article.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {article.views} views
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="bg-primary-50 rounded-2xl p-8 lg:p-12">
              <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-h1 text-gray-900 mb-4">Still Need Help?</h2>
              <p className="text-body text-gray-600 mb-8 max-w-xl mx-auto">
                Can&apos;t find what you&apos;re looking for? Our support team is ready to help you
                with any questions or issues you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg">Contact Support</Button>
                </Link>
                <Link href="/faq">
                  <Button variant="outline" size="lg">View FAQ</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
