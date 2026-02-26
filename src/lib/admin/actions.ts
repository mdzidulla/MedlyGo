'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { HospitalType } from '@prisma/client'

// Types
interface HospitalData {
  name: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website?: string
  type: 'public' | 'private'
  description?: string
  departments: string[] // Array of department IDs to associate
}

interface CreateHospitalResult {
  success: boolean
  error?: string
  hospitalId?: string
  credentials?: {
    email: string
    temporaryPassword: string
  }
}

interface UpdateHospitalResult {
  success: boolean
  error?: string
}

interface DeleteHospitalResult {
  success: boolean
  error?: string
}

// Helper: Generate temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper: Map 'public'/'private' to Prisma HospitalType enum
function mapHospitalType(type: 'public' | 'private'): HospitalType {
  return type === 'public' ? HospitalType.public_hospital : HospitalType.private_hospital
}

// Helper: Verify admin role
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { isAdmin: false, error: 'Not authenticated' }
  }
  if (session.user.role !== 'admin') {
    return { isAdmin: false, error: 'Unauthorized - Admin access required' }
  }
  return { isAdmin: true, userId: session.user.id }
}

/**
 * Create a new hospital with provider account
 */
export async function createHospital(data: HospitalData): Promise<CreateHospitalResult> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    // Generate temporary password for the hospital's admin account
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    // Create user record with hashed password
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.name,
        name: data.name,
        phone: data.phone,
        role: 'provider',
        emailVerified: new Date(),
      },
    })

    // Create hospital record
    const hospital = await prisma.hospital.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        region: data.region,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        type: mapHospitalType(data.type),
        description: data.description || null,
        isActive: true,
      },
    })

    // Create provider record linking user to hospital
    await prisma.provider.create({
      data: {
        userId: user.id,
        hospitalId: hospital.id,
        isActive: true,
      },
    })

    // Associate departments with hospital (if any selected)
    if (data.departments && data.departments.length > 0) {
      // Look up selected department names from existing records
      const existingDepts = await prisma.department.findMany({
        where: { id: { in: data.departments } },
        select: { name: true, description: true, icon: true },
      })

      if (existingDepts.length > 0) {
        await prisma.department.createMany({
          data: existingDepts.map((dept) => ({
            hospitalId: hospital.id,
            name: dept.name,
            description: dept.description,
            icon: dept.icon,
          })),
        })
      }
    }

    revalidatePath('/admin/hospitals')

    return {
      success: true,
      hospitalId: hospital.id,
      credentials: {
        email: data.email,
        temporaryPassword,
      },
    }
  } catch (error) {
    console.error('Unexpected error creating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing hospital
 */
export async function updateHospital(
  hospitalId: string,
  data: Partial<HospitalData>
): Promise<UpdateHospitalResult> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.address) updateData.address = data.address
    if (data.city) updateData.city = data.city
    if (data.region) updateData.region = data.region
    if (data.phone) updateData.phone = data.phone
    if (data.email) updateData.email = data.email
    if (data.website !== undefined) updateData.website = data.website
    if (data.type) updateData.type = mapHospitalType(data.type)
    if (data.description !== undefined) updateData.description = data.description

    await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData,
    })

    revalidatePath('/admin/hospitals')
    revalidatePath(`/admin/hospitals/${hospitalId}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete (deactivate) a hospital
 */
export async function deleteHospital(hospitalId: string): Promise<DeleteHospitalResult> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    // Soft delete - set isActive to false
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: { isActive: false },
    })

    // Also deactivate associated providers
    await prisma.provider.updateMany({
      where: { hospitalId },
      data: { isActive: false },
    })

    revalidatePath('/admin/hospitals')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reactivate a hospital
 */
export async function reactivateHospital(hospitalId: string): Promise<UpdateHospitalResult> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    await prisma.hospital.update({
      where: { id: hospitalId },
      data: { isActive: true },
    })

    revalidatePath('/admin/hospitals')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error reactivating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all available department types (for checkbox selection)
 */
export async function getDepartmentTypes() {
  try {
    const data = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch all stats in parallel
    const [
      totalPatients,
      totalHospitals,
      activeHospitals,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.hospital.count(),
      prisma.hospital.count({ where: { isActive: true } }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { appointmentDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.count({ where: { status: 'pending' } }),
    ])

    return {
      success: true,
      data: {
        totalPatients,
        totalHospitals,
        activeHospitals,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
      },
    }
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
