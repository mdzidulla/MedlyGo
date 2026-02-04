import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const team = [
    {
      name: 'Dr. Kwame Asante',
      role: 'Founder & CEO',
      description: 'Former health administrator with 15 years of experience in Ghana\'s healthcare system.',
    },
    {
      name: 'Ama Serwaa',
      role: 'Chief Technology Officer',
      description: 'Tech entrepreneur passionate about using technology to solve healthcare challenges.',
    },
    {
      name: 'Kofi Mensah',
      role: 'Head of Operations',
      description: 'Operations expert with experience in scaling healthcare solutions across West Africa.',
    },
    {
      name: 'Akua Boateng',
      role: 'Head of Partnerships',
      description: 'Building relationships with hospitals and healthcare providers across Ghana.',
    },
  ]

  const stats = [
    { value: '50+', label: 'Partner Hospitals' },
    { value: '10,000+', label: 'Appointments Booked' },
    { value: '16', label: 'Regions Covered' },
    { value: '98%', label: 'Patient Satisfaction' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white py-16 lg:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About MedlyGo</h1>
              <p className="text-lg text-white/90">
                We&apos;re on a mission to transform healthcare accessibility in Ghana by eliminating
                long queues and making hospital appointments simple, fast, and stress-free.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-h1 text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-body text-gray-600">
                  <p>
                    MedlyGo was born out of a simple observation: Ghanaians spend countless hours
                    waiting in hospital queues, often arriving as early as 4 AM just to secure an
                    appointment. This affects productivity, family time, and overall well-being.
                  </p>
                  <p>
                    Founded in 2024, our team set out to create a solution that respects people&apos;s
                    time while ensuring everyone has equal access to healthcare services. We partner
                    with public hospitals across Ghana to digitize their appointment systems.
                  </p>
                  <p>
                    Today, MedlyGo serves thousands of patients across all 16 regions of Ghana,
                    helping them book appointments from the comfort of their homes or workplaces.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-primary-100 rounded-2xl flex items-center justify-center">
                  <div className="w-32 h-32 relative">
                    <Image
                      src="/logo_medlygo.PNG"
                      alt="MedlyGo Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-card">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-h2 text-gray-900 mb-4">Our Mission</h3>
                <p className="text-body text-gray-600">
                  To make healthcare accessible to every Ghanaian by providing a seamless,
                  digital-first appointment booking experience that saves time and reduces stress.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-card">
                <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-h2 text-gray-900 mb-4">Our Vision</h3>
                <p className="text-body text-gray-600">
                  A Ghana where no one has to wake up at dawn to secure a hospital appointment,
                  and where quality healthcare is just a few clicks away for everyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 lg:py-24 bg-primary">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-white/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-h1 text-center text-gray-900 mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">Patient First</h3>
                <p className="text-body-sm text-gray-600">
                  Every decision we make is guided by what&apos;s best for the patients we serve.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">Trust & Security</h3>
                <p className="text-body-sm text-gray-600">
                  We protect patient data with the highest security standards and transparent practices.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-accent-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-h3 text-gray-900 mb-2">Innovation</h3>
                <p className="text-body-sm text-gray-600">
                  We continuously improve our platform to deliver the best healthcare experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-h1 text-center text-gray-900 mb-4">Our Team</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              A passionate team dedicated to transforming healthcare in Ghana.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="bg-white p-6 rounded-xl shadow-card text-center">
                  <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-label text-gray-900">{member.name}</h3>
                  <p className="text-body-sm text-primary mb-2">{member.role}</p>
                  <p className="text-body-sm text-gray-600">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-h1 text-gray-900 mb-4">Ready to Skip the Queue?</h2>
            <p className="text-body text-gray-600 mb-8">
              Join thousands of Ghanaians who are already booking their hospital appointments with MedlyGo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">Contact Us</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
