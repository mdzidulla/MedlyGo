import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-700 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 relative bg-white rounded-lg p-1">
            <Image
              src="/logo_medlygo.PNG"
              alt="MedlyGo Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="text-h2 font-bold text-white">MedlyGo</span>
        </Link>

        <div className="text-white">
          <h1 className="text-display mb-4">
            Healthcare Made Simple
          </h1>
          <p className="text-body text-primary-100 max-w-md">
            Book appointments at public hospitals across Ghana.
            Skip the queue and get the care you need, when you need it.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">50+</p>
            <p className="text-body-sm text-primary-200">Hospitals</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">200+</p>
            <p className="text-body-sm text-primary-200">Doctors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">10k+</p>
            <p className="text-body-sm text-primary-200">Appointments</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
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
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
