'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SupportPage() {
  const t = useTranslations('support')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tFooter = useTranslations('footer')

  const [activeTab, setActiveTab] = React.useState<'help' | 'tickets' | 'new'>('help')
  const [ticketForm, setTicketForm] = React.useState({
    subject: '',
    category: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Empty tickets array - will be fetched from database when support_tickets table is created
  const tickets: {
    id: string
    subject: string
    category: string
    status: string
    createdAt: string
    lastUpdate: string
  }[] = []

  const quickHelp = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: t('quickHelp.booking.title'),
      description: t('quickHelp.booking.description'),
      link: '/help#booking',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: t('quickHelp.sms.title'),
      description: t('quickHelp.sms.description'),
      link: '/help#notifications',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: t('quickHelp.account.title'),
      description: t('quickHelp.account.description'),
      link: '/help#account',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: t('quickHelp.hospital.title'),
      description: t('quickHelp.hospital.description'),
      link: '/help#hospitals',
    },
  ]

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setActiveTab('tickets')
    setTicketForm({ subject: '', category: '', message: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'open':
        return 'info'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-gray-900">{t('title')}</h1>
        <p className="text-body text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Contact Methods */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-primary-50 border-primary-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm text-gray-600">{t('contact.call')}</p>
              <p className="text-label text-gray-900">+233 30 123 4567</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary-50 border-secondary-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center text-secondary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm text-gray-600">{t('contact.whatsapp')}</p>
              <p className="text-label text-gray-900">+233 54 123 4567</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent-50 border-accent-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center text-accent">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm text-gray-600">{t('contact.email')}</p>
              <p className="text-label text-gray-900">support@medlygo.com</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('help')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'help'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('tabs.quickHelp')}
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('tabs.myTickets')}
          {tickets.filter(ticket => ticket.status !== 'resolved').length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
              {tickets.filter(ticket => ticket.status !== 'resolved').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'new'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('tabs.newTicket')}
        </button>
      </div>

      {/* Quick Help Tab */}
      {activeTab === 'help' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {quickHelp.map((item) => (
              <Link key={item.title} href={item.link}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-label text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-body-sm text-gray-600">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('faq.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-100">
                  <span className="text-label text-gray-900">{t('faq.q1.question')}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-body text-gray-600 py-3">{t('faq.q1.answer')}</p>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-100">
                  <span className="text-label text-gray-900">{t('faq.q2.question')}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-body text-gray-600 py-3">{t('faq.q2.answer')}</p>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-100">
                  <span className="text-label text-gray-900">{t('faq.q3.question')}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-body text-gray-600 py-3">{t('faq.q3.answer')}</p>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3">
                  <span className="text-label text-gray-900">{t('faq.q4.question')}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-body text-gray-600 py-3">{t('faq.q4.answer')}</p>
              </details>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/faq">
              <Button variant="outline">{tFooter('faq')}</Button>
            </Link>
          </div>
        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">{t('tickets.noTickets')}</h3>
                <p className="text-body text-gray-600 mb-4">{t('tickets.noTicketsDesc')}</p>
                <Button onClick={() => setActiveTab('new')}>{t('tickets.createNew')}</Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-body-sm text-gray-500">{ticket.id}</span>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                      <h3 className="text-label text-gray-900 mb-1">{ticket.subject}</h3>
                      <p className="text-body-sm text-gray-500">{ticket.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-sm text-gray-500">{t('tickets.created')}</p>
                      <p className="text-body-sm text-gray-900">{ticket.createdAt}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-body-sm text-gray-500">
                      {t('tickets.lastUpdate')}: {ticket.lastUpdate}
                    </span>
                    <Button variant="outline" size="sm">{t('tickets.viewDetails')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* New Ticket Tab */}
      {activeTab === 'new' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('newTicket.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div>
                <label className="block text-label text-gray-700 mb-2">{t('newTicket.subject')} *</label>
                <input
                  type="text"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder={t('newTicket.subjectPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">{t('newTicket.category')} *</label>
                <select
                  required
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">{t('newTicket.selectCategory')}</option>
                  <option value="booking">{t('newTicket.categories.booking')}</option>
                  <option value="account">{t('newTicket.categories.account')}</option>
                  <option value="notifications">{t('newTicket.categories.notifications')}</option>
                  <option value="hospital">{t('newTicket.categories.hospital')}</option>
                  <option value="payment">{t('newTicket.categories.payment')}</option>
                  <option value="other">{t('newTicket.categories.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">{t('newTicket.message')} *</label>
                <textarea
                  required
                  rows={6}
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder={t('newTicket.messagePlaceholder')}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('newTicket.submitting')}
                    </>
                  ) : (
                    t('newTicket.submit')
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('help')}>
                  {tCommon('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
