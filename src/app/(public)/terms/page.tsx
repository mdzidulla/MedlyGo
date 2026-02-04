import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-white/90">Last updated: February 2026</p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-body text-gray-600 mb-8">
                Welcome to MedlyGo. These Terms of Service (&quot;Terms&quot;) govern your use of our website,
                mobile applications, and services (collectively, the &quot;Platform&quot;). By using MedlyGo,
                you agree to these Terms.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-body text-gray-600 mb-4">
                By creating an account or using MedlyGo, you agree to be bound by these Terms and our
                Privacy Policy. If you do not agree to these Terms, you may not use the Platform.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-body text-gray-600 mb-4">
                MedlyGo is a digital platform that enables users to:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Book non-emergency hospital appointments at partner hospitals in Ghana</li>
                <li>Manage and track their appointments</li>
                <li>Receive appointment reminders via SMS and email</li>
                <li>Access an AI-powered assistant for healthcare-related queries</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                MedlyGo is a booking facilitation service only. We do not provide medical advice,
                diagnosis, or treatment.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">3. User Accounts</h2>
              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Registration</h3>
              <p className="text-body text-gray-600 mb-4">
                To use our booking services, you must create an account by providing accurate and
                complete information. You must be at least 18 years old to create an account.
                Parents or guardians may create accounts to book appointments for minors.
              </p>

              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Account Security</h3>
              <p className="text-body text-gray-600 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">4. Appointment Booking</h2>
              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Booking Process</h3>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Appointments are subject to availability at partner hospitals</li>
                <li>You must provide accurate information when booking</li>
                <li>Confirmation is subject to hospital acceptance</li>
                <li>You will receive SMS confirmation with your appointment details</li>
              </ul>

              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Cancellations and Rescheduling</h3>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>You may cancel or reschedule appointments through the Platform</li>
                <li>We encourage cancellation at least 24 hours in advance</li>
                <li>Repeated no-shows may result in booking restrictions</li>
              </ul>

              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Hospital Visit</h3>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Arrive on time with required documents (ID, NHIS card if applicable)</li>
                <li>Hospital fees are separate from MedlyGo and payable directly to the hospital</li>
                <li>Medical treatment decisions are between you and your healthcare provider</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">5. User Conduct</h2>
              <p className="text-body text-gray-600 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Provide false or misleading information</li>
                <li>Book appointments with no intention of attending</li>
                <li>Use the Platform for any illegal purpose</li>
                <li>Attempt to interfere with the Platform&apos;s operation</li>
                <li>Share your account with others</li>
                <li>Use automated systems to access the Platform</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">6. Fees and Payments</h2>
              <p className="text-body text-gray-600 mb-4">
                MedlyGo&apos;s booking service is free for patients. However:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Hospital consultation fees, tests, and treatments are separate</li>
                <li>Payment for hospital services is made directly to the hospital</li>
                <li>We are not responsible for hospital billing disputes</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">7. AI Assistant Disclaimer</h2>
              <p className="text-body text-gray-600 mb-4">
                Our AI-powered chat assistant provides general health information only. It is NOT:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>A substitute for professional medical advice</li>
                <li>Qualified to diagnose conditions or prescribe treatments</li>
                <li>A replacement for consultation with healthcare professionals</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                Always consult a qualified healthcare provider for medical decisions.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-body text-gray-600 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>MedlyGo is provided &quot;as is&quot; without warranties of any kind</li>
                <li>We do not guarantee appointment availability or hospital services</li>
                <li>We are not liable for medical outcomes or hospital service quality</li>
                <li>We are not responsible for SMS delivery failures beyond our control</li>
                <li>Our liability is limited to the amount you paid us (if any)</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">9. Indemnification</h2>
              <p className="text-body text-gray-600 mb-4">
                You agree to indemnify and hold harmless MedlyGo, its officers, directors, employees,
                and partners from any claims arising from your use of the Platform or violation of
                these Terms.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">10. Intellectual Property</h2>
              <p className="text-body text-gray-600 mb-4">
                All content, features, and functionality on the Platform (including text, graphics,
                logos, and software) are owned by MedlyGo and protected by intellectual property laws.
                You may not copy, modify, or distribute our content without permission.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">11. Termination</h2>
              <p className="text-body text-gray-600 mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent activity</li>
                <li>Repeatedly miss appointments without cancellation</li>
                <li>Abuse our services or staff</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                You may delete your account at any time by contacting support.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
              <p className="text-body text-gray-600 mb-4">
                We may modify these Terms at any time. Material changes will be notified via email or
                Platform notification. Continued use after changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">13. Governing Law</h2>
              <p className="text-body text-gray-600 mb-4">
                These Terms are governed by the laws of the Republic of Ghana. Any disputes shall be
                resolved in the courts of Ghana.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">14. Contact Information</h2>
              <p className="text-body text-gray-600 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <ul className="list-none text-body text-gray-600 space-y-2">
                <li><strong>Email:</strong> legal@medlygo.com</li>
                <li><strong>Phone:</strong> +233 30 123 4567</li>
                <li><strong>Address:</strong> 123 Independence Avenue, Accra, Ghana</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
