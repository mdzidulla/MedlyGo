'use client'

import * as React from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  faqs: FAQItem[]
}

export default function FAQPage() {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const faqCategories: FAQCategory[] = [
    {
      title: 'General Questions',
      faqs: [
        {
          question: 'What is MedlyGo?',
          answer: 'MedlyGo is a free online platform that allows you to book non-emergency hospital appointments at public hospitals across Ghana. We help you skip the long queues by letting you schedule your visit in advance.',
        },
        {
          question: 'Is MedlyGo free to use?',
          answer: 'Yes! MedlyGo is completely free to use. You can book, reschedule, or cancel appointments without any charges. However, please note that hospital fees and medical costs are separate and payable directly to the hospital.',
        },
        {
          question: 'Which hospitals are available on MedlyGo?',
          answer: 'We partner with major public hospitals across all 16 regions of Ghana, including Korle Bu Teaching Hospital, 37 Military Hospital, Komfo Anokye Teaching Hospital, and many regional and district hospitals. The list of available hospitals is constantly growing.',
        },
        {
          question: 'Do I need to create an account to book?',
          answer: 'Yes, you need to create a free account to book appointments. This helps us send you SMS reminders, allow you to manage your bookings, and keep your appointment history organized.',
        },
      ],
    },
    {
      title: 'Booking Appointments',
      faqs: [
        {
          question: 'How do I book an appointment?',
          answer: 'Booking is simple: 1) Log in to your MedlyGo account, 2) Select a hospital and department, 3) Choose an available date and time, 4) Confirm your booking. You\'ll receive an SMS confirmation with your appointment details.',
        },
        {
          question: 'How far in advance can I book?',
          answer: 'You can typically book appointments up to 30 days in advance, depending on the hospital\'s availability. Some specialized departments may have different booking windows.',
        },
        {
          question: 'Can I book for someone else?',
          answer: 'Yes, you can book appointments for family members or dependents. Make sure to provide their correct details (name, date of birth, phone number) when booking.',
        },
        {
          question: 'What if the time I want is not available?',
          answer: 'If your preferred time is not available, you can either choose an alternative time slot, try a different date, or check another nearby hospital. Popular times tend to fill up quickly, so we recommend booking early.',
        },
      ],
    },
    {
      title: 'Managing Appointments',
      faqs: [
        {
          question: 'How do I reschedule my appointment?',
          answer: 'Log in to your account, go to "My Appointments", find the appointment you want to change, and click "Reschedule". Select a new date and time, and confirm the change. You\'ll receive an SMS with your new appointment details.',
        },
        {
          question: 'Can I cancel my appointment?',
          answer: 'Yes, you can cancel your appointment at any time. Please try to cancel at least 24 hours in advance so the slot can be given to someone else. Go to "My Appointments" and click "Cancel" on the relevant booking.',
        },
        {
          question: 'What happens if I miss my appointment?',
          answer: 'If you miss your appointment without cancelling, you may need to book a new one. Repeated no-shows may affect your ability to book future appointments. Please try to cancel in advance if you can\'t make it.',
        },
        {
          question: 'Will I get a reminder before my appointment?',
          answer: 'Yes! We send SMS reminders 24 hours before your appointment and again on the morning of your visit. Make sure your phone number is correct in your profile.',
        },
      ],
    },
    {
      title: 'At the Hospital',
      faqs: [
        {
          question: 'What should I bring to my appointment?',
          answer: 'Please bring: 1) A valid ID (Ghana Card, Voter ID, or Passport), 2) Your NHIS card if applicable, 3) Any previous medical records or test results, 4) Your SMS confirmation or reference number.',
        },
        {
          question: 'Do I still need to wait at the hospital?',
          answer: 'With a MedlyGo appointment, you have a reserved time slot, which significantly reduces waiting time. However, some waiting may still occur due to emergencies or other factors beyond our control.',
        },
        {
          question: 'What if I arrive late to my appointment?',
          answer: 'If you\'re running late, try to arrive within 30 minutes of your scheduled time. If you\'ll be later than that, please call the hospital or reschedule through MedlyGo to avoid losing your slot.',
        },
        {
          question: 'Is my NHIS card accepted?',
          answer: 'Yes, MedlyGo appointments work with NHIS. Bring your valid NHIS card to your appointment. The hospital will process your visit according to NHIS guidelines.',
        },
      ],
    },
    {
      title: 'Account & Privacy',
      faqs: [
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a link to reset your password. The link expires after 24 hours.',
        },
        {
          question: 'Is my personal information safe?',
          answer: 'Yes, we take privacy seriously. Your personal and medical information is encrypted and stored securely. We never share your data with third parties without your consent. See our Privacy Policy for details.',
        },
        {
          question: 'How do I delete my account?',
          answer: 'You can request account deletion by contacting our support team at support@medlygo.com. Please note that we may need to retain some records for legal and medical purposes.',
        },
        {
          question: 'Can I change my phone number?',
          answer: 'Yes, go to Profile Settings in your account and update your phone number. You\'ll receive a verification SMS to confirm the change.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16 lg:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
              <p className="text-lg text-white/90">
                Find quick answers to common questions about using MedlyGo for your hospital appointments.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            {faqCategories.map((category, categoryIndex) => (
              <div key={category.title} className={categoryIndex > 0 ? 'mt-12' : ''}>
                <h2 className="text-h2 text-gray-900 mb-6">{category.title}</h2>
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const itemId = `${categoryIndex}-${faqIndex}`
                    const isOpen = openItems.has(itemId)

                    return (
                      <div
                        key={faq.question}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-label text-gray-900 pr-4">{faq.question}</span>
                          <svg
                            className={cn(
                              'w-5 h-5 text-gray-500 flex-shrink-0 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-body text-gray-600">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-h1 text-gray-900 mb-4">Still Have Questions?</h2>
            <p className="text-body text-gray-600 mb-8 max-w-xl mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg">Contact Support</Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" size="lg">Visit Help Center</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
