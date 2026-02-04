import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-white/90">Last updated: February 2026</p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-body text-gray-600 mb-8">
                At MedlyGo, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our platform.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Personal Information</h3>
              <p className="text-body text-gray-600 mb-4">
                When you create an account and use MedlyGo, we may collect:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Date of birth</li>
                <li>Gender</li>
                <li>Ghana Card or National ID number (for verification purposes)</li>
                <li>NHIS number (if applicable)</li>
                <li>Address and region</li>
              </ul>

              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Health Information</h3>
              <p className="text-body text-gray-600 mb-4">
                To facilitate your hospital appointments, we may collect:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Medical history relevant to your appointment</li>
                <li>Appointment preferences and history</li>
                <li>Department and service selections</li>
              </ul>

              <h3 className="text-h3 text-gray-900 mt-6 mb-3">Technical Information</h3>
              <p className="text-body text-gray-600 mb-4">
                We automatically collect certain information when you use our platform:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Device information (type, operating system)</li>
                <li>Browser type and version</li>
                <li>IP address</li>
                <li>Usage patterns and preferences</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="text-body text-gray-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Create and manage your account</li>
                <li>Process and manage your hospital appointments</li>
                <li>Send appointment confirmations and reminders via SMS and email</li>
                <li>Communicate with you about our services</li>
                <li>Improve our platform and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
              <p className="text-body text-gray-600 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li><strong>Partner Hospitals:</strong> We share necessary appointment and patient information with hospitals where you book appointments.</li>
                <li><strong>Service Providers:</strong> We work with trusted third parties for SMS delivery, email services, and hosting.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights.</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                We do NOT sell your personal information to third parties for marketing purposes.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">4. Data Security</h2>
              <p className="text-body text-gray-600 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments</li>
                <li>Access controls limiting who can view your data</li>
                <li>Employee training on data protection</li>
              </ul>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">5. Your Rights</h2>
              <p className="text-body text-gray-600 mb-4">
                Under Ghana&apos;s Data Protection Act, 2012 (Act 843), you have the right to:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Object to certain processing of your data</li>
                <li>Data portability</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                To exercise these rights, please contact us at privacy@medlygo.com.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">6. Data Retention</h2>
              <p className="text-body text-gray-600 mb-4">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-body text-gray-600 space-y-2 mb-4">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p className="text-body text-gray-600 mb-4">
                Medical appointment records may be retained for longer periods as required by healthcare regulations.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">7. Children&apos;s Privacy</h2>
              <p className="text-body text-gray-600 mb-4">
                MedlyGo is not intended for children under 18. Parents or guardians may create accounts to book
                appointments for their children. We do not knowingly collect personal information from children
                without parental consent.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
              <p className="text-body text-gray-600 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes
                by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you
                to review this policy periodically.
              </p>

              <h2 className="text-h2 text-gray-900 mt-8 mb-4">9. Contact Us</h2>
              <p className="text-body text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none text-body text-gray-600 space-y-2">
                <li><strong>Email:</strong> privacy@medlygo.com</li>
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
