import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { HospitalType } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/services/notifications/email'

// Helper: Generate temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function mapHospitalType(type: string): HospitalType {
  return type === 'private' ? HospitalType.private_hospital : HospitalType.public_hospital
}

// POST - Create a new hospital with provider account
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const data = await request.json()
    const { name, address, city, region, phone, email, website, type, description, departments } = data

    // Validate required fields
    if (!name || !address || !city || !region || !phone || !email || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Generate temporary password for the hospital's admin account
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    // Create user for hospital provider
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: name,
        name,
        phone,
        role: 'provider',
        emailVerified: new Date(),
      },
    })

    // Create hospital record
    let hospital
    try {
      hospital = await prisma.hospital.create({
        data: {
          name,
          address,
          city,
          region,
          phone,
          email,
          website: website || null,
          type: mapHospitalType(type),
          description: description || null,
          isActive: true,
        },
      })
    } catch (hospitalError) {
      console.error('Error creating hospital record:', hospitalError)
      // Clean up user if hospital creation fails
      await prisma.user.delete({ where: { id: newUser.id } })
      return NextResponse.json(
        { error: 'Failed to create hospital record' },
        { status: 500 }
      )
    }

    // Create provider record linking user to hospital
    try {
      await prisma.provider.create({
        data: {
          userId: newUser.id,
          hospitalId: hospital.id,
          isActive: true,
        },
      })
    } catch (providerError) {
      console.error('Error creating provider record:', providerError)
      // Don't fail completely, but log the error
    }

    // Create departments for this hospital (if any selected)
    if (departments && departments.length > 0) {
      try {
        const departmentInserts = departments.map((deptName: string) => ({
          hospitalId: hospital.id,
          name: deptName,
        }))

        await prisma.department.createMany({
          data: departmentInserts,
        })
      } catch (deptError) {
        console.error('Error creating departments:', deptError)
        // Don't fail the whole operation for this
      }
    }

    // Send credentials email to the hospital
    try {
      const emailContent = emailTemplates.hospitalCredentials({
        hospitalName: name,
        email: email,
        temporaryPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      })

      const emailResult = await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      if (!emailResult.success) {
        console.warn('Failed to send credentials email:', emailResult.error)
      }
    } catch (emailError) {
      console.error('Error sending credentials email:', emailError)
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      success: true,
      hospitalId: hospital.id,
      credentials: {
        email: email,
        temporaryPassword,
      },
      emailSent: true,
    })
  } catch (error) {
    console.error('Unexpected error creating hospital:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
