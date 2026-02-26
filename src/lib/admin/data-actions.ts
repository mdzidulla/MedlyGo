'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getAdminUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, email: true, role: true },
  })

  return user ? { full_name: user.fullName, email: user.email, role: user.role } : null
}

export async function getAdminHospitals() {
  const hospitals = await prisma.hospital.findMany({
    include: {
      departments: { select: { id: true, name: true } },
      providers: {
        include: { user: { select: { fullName: true, email: true } } },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    city: h.city,
    region: h.region,
    phone: h.phone,
    email: h.email,
    website: h.website,
    type: h.type === 'public_hospital' ? 'public' : 'private',
    description: h.description,
    is_active: h.isActive,
    image_url: h.imageUrl,
    departments: h.departments.map((d) => ({ id: d.id, name: d.name })),
    providers: h.providers.map((p) => ({
      user: { full_name: p.user.fullName, email: p.user.email },
    })),
    appointment_count: h._count.appointments,
    created_at: h.createdAt.toISOString(),
  }))
}

export async function getAdminHospitalById(id: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      departments: true,
      providers: {
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      },
      appointments: {
        include: {
          patient: { include: { user: { select: { fullName: true } } } },
          department: { select: { name: true } },
        },
        orderBy: { appointmentDate: 'desc' },
        take: 20,
      },
    },
  })

  if (!hospital) return null

  return {
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    city: hospital.city,
    region: hospital.region,
    phone: hospital.phone,
    email: hospital.email,
    website: hospital.website,
    type: hospital.type === 'public_hospital' ? 'public' : 'private',
    description: hospital.description,
    is_active: hospital.isActive,
    departments: hospital.departments.map((d) => ({ id: d.id, name: d.name, description: d.description, is_active: d.isActive })),
    providers: hospital.providers.map((p) => ({ user: { full_name: p.user.fullName, email: p.user.email, phone: p.user.phone } })),
    appointments: hospital.appointments.map((a) => ({
      id: a.id,
      appointment_date: a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : String(a.appointmentDate),
      start_time: a.startTime,
      status: a.status,
      reference_number: a.referenceNumber,
      patient: a.patient ? { user: { full_name: a.patient.user.fullName } } : null,
      department: a.department ? { name: a.department.name } : null,
    })),
  }
}

export async function getAdminPatients() {
  const patients = await prisma.patient.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true, createdAt: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return patients.map((p) => ({
    id: p.id,
    user: {
      full_name: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone,
      created_at: p.user.createdAt.toISOString(),
    },
    appointment_count: p._count.appointments,
    gender: p.gender,
    date_of_birth: p.dateOfBirth ? (p.dateOfBirth instanceof Date ? p.dateOfBirth.toISOString().split('T')[0] : String(p.dateOfBirth)) : null,
  }))
}

export async function getAdminAppointments() {
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: { select: { fullName: true } } } },
      hospital: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'desc' },
    take: 100,
  })

  return appointments.map((a) => ({
    id: a.id,
    appointment_date: a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : String(a.appointmentDate),
    start_time: a.startTime,
    status: a.status,
    reference_number: a.referenceNumber,
    reason: a.reason,
    patient: a.patient ? { user: { full_name: a.patient.user.fullName } } : null,
    hospital: a.hospital ? { name: a.hospital.name } : null,
    department: a.department ? { name: a.department.name } : null,
  }))
}
