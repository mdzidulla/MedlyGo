'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getDashboardData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, email: true, phone: true },
  })

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!patient) return { user, upcomingAppointments: [], pastAppointments: [] }

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      appointmentDate: { gte: new Date(todayStr) },
      status: { not: 'cancelled' },
    },
    include: {
      hospital: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'asc' },
    take: 5,
  })

  const pastAppointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      appointmentDate: { lt: new Date(todayStr) },
    },
    include: {
      hospital: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'desc' },
    take: 3,
  })

  const formatAppointment = (apt: any) => ({
    id: apt.id,
    hospital: apt.hospital ? { name: apt.hospital.name } : null,
    department: apt.department ? { name: apt.department.name } : null,
    appointment_date: apt.appointmentDate instanceof Date
      ? apt.appointmentDate.toISOString().split('T')[0]
      : String(apt.appointmentDate),
    start_time: apt.startTime,
    status: apt.status,
    reference_number: apt.referenceNumber,
  })

  return {
    user: user ? { full_name: user.fullName, email: user.email, phone: user.phone } : null,
    upcomingAppointments: upcomingAppointments.map(formatAppointment),
    pastAppointments: pastAppointments.map(formatAppointment),
  }
}

export async function getPatientAppointments() {
  const session = await auth()
  if (!session?.user?.id) return []

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!patient) return []

  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      hospital: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'desc' },
  })

  return appointments.map((apt) => ({
    id: apt.id,
    hospital: apt.hospital ? { name: apt.hospital.name } : null,
    department: apt.department ? { name: apt.department.name } : null,
    appointment_date: apt.appointmentDate instanceof Date
      ? apt.appointmentDate.toISOString().split('T')[0]
      : String(apt.appointmentDate),
    start_time: apt.startTime,
    status: apt.status,
    reference_number: apt.referenceNumber,
    reason: apt.reason,
    rejection_reason: apt.rejectionReason,
    suggested_date: apt.suggestedDate
      ? (apt.suggestedDate instanceof Date ? apt.suggestedDate.toISOString().split('T')[0] : String(apt.suggestedDate))
      : null,
    suggested_time: apt.suggestedTime,
    original_appointment_id: apt.originalAppointmentId,
  }))
}

export async function getPatientProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, email: true, phone: true },
  })

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: {
      dateOfBirth: true,
      gender: true,
      address: true,
      ghanaCardId: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyContactRelationship: true,
    },
  })

  return {
    user: user ? { full_name: user.fullName, email: user.email, phone: user.phone } : null,
    patient: patient ? {
      date_of_birth: patient.dateOfBirth ? (patient.dateOfBirth instanceof Date ? patient.dateOfBirth.toISOString().split('T')[0] : String(patient.dateOfBirth)) : null,
      gender: patient.gender,
      address: patient.address,
      ghana_card_id: patient.ghanaCardId,
      emergency_contact_name: patient.emergencyContactName,
      emergency_contact_phone: patient.emergencyContactPhone,
      emergency_contact_relationship: patient.emergencyContactRelationship,
    } : null,
  }
}

export async function updatePatientProfile(userData: { phone?: string | null }, patientData: Record<string, any> | null) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  try {
    if (userData.phone !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: userData.phone },
      })
    }

    if (patientData) {
      await prisma.patient.update({
        where: { userId: session.user.id },
        data: {
          dateOfBirth: patientData.date_of_birth ? new Date(patientData.date_of_birth) : undefined,
          gender: patientData.gender || undefined,
          address: patientData.address || undefined,
          ghanaCardId: patientData.ghana_card_id || undefined,
          emergencyContactName: patientData.emergency_contact_name || undefined,
          emergencyContactPhone: patientData.emergency_contact_phone || undefined,
          emergencyContactRelationship: patientData.emergency_contact_relationship || undefined,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function saveOnboardingData(formData: {
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  region: string
  ghanaCardNumber: string
  nhisNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: formData.phone },
    })

    await prisma.patient.upsert({
      where: { userId: session.user.id },
      update: {
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        gender: formData.gender || null,
        address: formData.address || null,
        ghanaCardId: formData.ghanaCardNumber || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        emergencyContactRelationship: formData.emergencyContactRelationship || null,
      },
      create: {
        userId: session.user.id,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        gender: formData.gender || null,
        address: formData.address || null,
        ghanaCardId: formData.ghanaCardNumber || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        emergencyContactRelationship: formData.emergencyContactRelationship || null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return { success: false, error: 'Failed to save profile' }
  }
}

export async function getHospitals() {
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      region: true,
      isActive: true,
      imageUrl: true,
    },
    orderBy: { name: 'asc' },
  })

  return hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    city: h.city,
    region: h.region,
    is_active: h.isActive,
    image_url: h.imageUrl,
  }))
}

export async function getDepartments(hospitalId: string) {
  const departments = await prisma.department.findMany({
    where: { hospitalId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      hospitalId: true,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })

  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    hospital_id: d.hospitalId,
    is_active: d.isActive,
  }))
}
