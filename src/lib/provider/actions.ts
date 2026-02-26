'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getProviderInfo() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Get provider record
  let hospitalId: string | null = null

  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { hospitalId: true },
  })

  if (provider) {
    hospitalId = provider.hospitalId
  } else if (session.user.email) {
    // Fallback: check if user email matches a hospital email
    const hospital = await prisma.hospital.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (hospital) hospitalId = hospital.id
  }

  if (!hospitalId) return null

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { id: true, name: true, type: true },
  })

  const pendingCount = await prisma.appointment.count({
    where: { hospitalId, status: 'pending' },
  })

  return {
    hospital: hospital ? { id: hospital.id, name: hospital.name, type: hospital.type === 'public_hospital' ? 'public' : 'private' } : null,
    pendingCount,
  }
}

export async function getProviderAppointments(hospitalId: string, statusFilter?: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const where: any = { hospitalId }
  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
        },
      },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'desc' },
  })

  return appointments.map((apt) => ({
    id: apt.id,
    appointment_date: apt.appointmentDate instanceof Date ? apt.appointmentDate.toISOString().split('T')[0] : String(apt.appointmentDate),
    start_time: apt.startTime,
    status: apt.status,
    reference_number: apt.referenceNumber,
    reason: apt.reason,
    rejection_reason: apt.rejectionReason,
    suggested_date: apt.suggestedDate ? (apt.suggestedDate instanceof Date ? apt.suggestedDate.toISOString().split('T')[0] : String(apt.suggestedDate)) : null,
    suggested_time: apt.suggestedTime,
    patient: apt.patient ? {
      user: {
        full_name: apt.patient.user.fullName,
        email: apt.patient.user.email,
        phone: apt.patient.user.phone,
      },
    } : null,
    department: apt.department ? { name: apt.department.name } : null,
  }))
}

export async function getProviderSchedules(hospitalId: string) {
  const schedules = await prisma.schedule.findMany({
    where: { provider: { hospitalId } },
    include: {
      provider: { select: { department: { select: { name: true } } } },
    },
    orderBy: { dayOfWeek: 'asc' },
  })

  return schedules.map((s) => ({
    id: s.id,
    department: s.provider?.department ? { name: s.provider.department.name } : null,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    max_appointments: s.maxPatientsPerSlot,
    is_active: s.isActive,
  }))
}

export async function getProviderPatients(hospitalId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { hospitalId },
    include: {
      patient: {
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
        },
      },
    },
    distinct: ['patientId'],
    orderBy: { createdAt: 'desc' },
  })

  return appointments
    .filter((a) => a.patient)
    .map((a) => ({
      id: a.patient!.id,
      user: {
        full_name: a.patient!.user.fullName,
        email: a.patient!.user.email,
        phone: a.patient!.user.phone,
      },
      last_appointment: a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : String(a.appointmentDate),
    }))
}

export async function getProviderDashboardStats(hospitalId: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const [totalAppointments, todayAppointments, pendingAppointments, totalPatients] = await Promise.all([
    prisma.appointment.count({ where: { hospitalId } }),
    prisma.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lt: todayEnd } } }),
    prisma.appointment.count({ where: { hospitalId, status: 'pending' } }),
    prisma.appointment.groupBy({ by: ['patientId'], where: { hospitalId } }).then(r => r.length),
  ])

  return { totalAppointments, todayAppointments, pendingAppointments, totalPatients }
}

export async function getProviderHospitalSettings(hospitalId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
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
    is_24_hours: hospital.is24Hours,
    opening_time: hospital.openingTime,
    closing_time: hospital.closingTime,
  }
}

export async function updateHospitalProfile(hospitalId: string, data: {
  name: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website: string
  type: 'public' | 'private'
  description: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        region: data.region,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        type: data.type === 'public' ? 'public_hospital' : 'private_hospital',
        description: data.description || null,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating hospital profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function updateHospitalHours(hospitalId: string, data: {
  is_24_hours: boolean
  opening_time: string
  closing_time: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        is24Hours: data.is_24_hours,
        openingTime: data.is_24_hours ? null : data.opening_time,
        closingTime: data.is_24_hours ? null : data.closing_time,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating hospital hours:', error)
    return { success: false, error: 'Failed to update hours' }
  }
}

export async function getProviderDepartments(hospitalId: string) {
  const departments = await prisma.department.findMany({
    where: { hospitalId },
    orderBy: { name: 'asc' },
  })

  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    is_active: d.isActive,
  }))
}

export async function addDepartment(hospitalId: string, name: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.department.create({
      data: {
        hospitalId,
        name: name.trim(),
        isActive: true,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding department:', error)
    return { success: false, error: 'Failed to add department' }
  }
}

export async function toggleDepartment(departmentId: string, isActive: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.department.update({
      where: { id: departmentId },
      data: { isActive },
    })
    return { success: true }
  } catch (error) {
    console.error('Error toggling department:', error)
    return { success: false, error: 'Failed to toggle department' }
  }
}

export async function saveSchedule(hospitalId: string, data: {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  max_patients_per_slot: number
  is_active: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    // Get a provider for this hospital
    let providerId: string | null = null

    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (provider) {
      providerId = provider.id
    } else {
      const anyProvider = await prisma.provider.findFirst({
        where: { hospitalId },
        select: { id: true },
      })
      if (anyProvider) providerId = anyProvider.id
    }

    if (!providerId) {
      return { success: false, error: 'No provider found for this hospital' }
    }

    if (data.id) {
      // Update existing
      await prisma.schedule.update({
        where: { id: data.id },
        data: {
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          maxPatientsPerSlot: data.max_patients_per_slot,
          isActive: data.is_active,
        },
      })
    } else {
      // Create new
      await prisma.schedule.create({
        data: {
          providerId,
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          maxPatientsPerSlot: data.max_patients_per_slot,
          isActive: data.is_active,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving schedule:', error)
    return { success: false, error: 'Failed to save schedule' }
  }
}

export async function deleteSchedule(scheduleId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.schedule.delete({
      where: { id: scheduleId },
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return { success: false, error: 'Failed to delete schedule' }
  }
}

export async function toggleSchedule(scheduleId: string, isActive: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isActive },
    })
    return { success: true }
  } catch (error) {
    console.error('Error toggling schedule:', error)
    return { success: false, error: 'Failed to toggle schedule' }
  }
}

export async function getProviderScheduleData(hospitalId: string) {
  const session = await auth()
  if (!session?.user?.id) return { schedules: [], departments: [] }

  const [schedules, departments] = await Promise.all([
    prisma.schedule.findMany({
      where: { provider: { hospitalId } },
      orderBy: { dayOfWeek: 'asc' },
    }),
    prisma.department.findMany({
      where: { hospitalId },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    schedules: schedules.map((s) => ({
      id: s.id,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      slot_duration: s.slotDuration,
      max_patients_per_slot: s.maxPatientsPerSlot,
      is_active: s.isActive,
    })),
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      is_active: d.isActive,
    })),
  }
}

export async function getProviderPatientsData(hospitalId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  // Get all unique patients who have appointments at this hospital
  const appointments = await prisma.appointment.findMany({
    where: { hospitalId },
    include: {
      patient: {
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Build unique patient list with stats
  const patientMap = new Map<string, {
    id: string
    user_id: string
    ghana_card_id: string | null
    date_of_birth: string | null
    gender: string | null
    address: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    users: {
      full_name: string | null
      email: string | null
      phone: string | null
    }
    appointment_count: number
    last_visit: string | null
  }>()

  for (const apt of appointments) {
    if (!apt.patient) continue
    const p = apt.patient

    if (!patientMap.has(p.id)) {
      patientMap.set(p.id, {
        id: p.id,
        user_id: p.userId,
        ghana_card_id: p.ghanaCardId || null,
        date_of_birth: p.dateOfBirth ? (p.dateOfBirth instanceof Date ? p.dateOfBirth.toISOString().split('T')[0] : String(p.dateOfBirth)) : null,
        gender: p.gender || null,
        address: p.address || null,
        emergency_contact_name: p.emergencyContactName || null,
        emergency_contact_phone: p.emergencyContactPhone || null,
        users: {
          full_name: p.user.fullName,
          email: p.user.email,
          phone: p.user.phone,
        },
        appointment_count: 0,
        last_visit: null,
      })
    }

    const existing = patientMap.get(p.id)!
    existing.appointment_count++

    if (apt.status === 'completed') {
      const dateStr = apt.appointmentDate instanceof Date
        ? apt.appointmentDate.toISOString().split('T')[0]
        : String(apt.appointmentDate)
      if (!existing.last_visit || dateStr > existing.last_visit) {
        existing.last_visit = dateStr
      }
    }
  }

  return Array.from(patientMap.values())
}

export async function getPatientAppointmentHistory(hospitalId: string, patientId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const appointments = await prisma.appointment.findMany({
    where: { hospitalId, patientId },
    include: {
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: 'desc' },
    take: 10,
  })

  return appointments.map((apt) => ({
    id: apt.id,
    appointment_date: apt.appointmentDate instanceof Date ? apt.appointmentDate.toISOString().split('T')[0] : String(apt.appointmentDate),
    start_time: apt.startTime,
    status: apt.status,
    reason: apt.reason,
    department: apt.department ? { name: apt.department.name } : null,
  }))
}

export async function getDashboardAppointments(hospitalId: string) {
  const session = await auth()
  if (!session?.user?.id) return { todayAppointments: [], queueData: [], upcomingData: [], recentAppointments: [] }

  const today = new Date().toISOString().split('T')[0]
  const todayStart = new Date(today)
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = new Date(todayEnd).toISOString().split('T')[0]

  const [todayAppointments, queueData, upcomingData, recentAppointments] = await Promise.all([
    // Today's appointments for stats
    prisma.appointment.findMany({
      where: { hospitalId, appointmentDate: { gte: todayStart, lt: todayEnd } },
      select: { id: true, status: true, appointmentDate: true },
    }),
    // Patient queue (today's confirmed/checked-in)
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: todayStart, lt: todayEnd },
        status: { in: ['confirmed', 'checked_in', 'in_progress'] },
      },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        department: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    // Upcoming appointments (future dates)
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: todayEnd },
        status: { in: ['confirmed', 'pending'] },
      },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        department: { select: { name: true } },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 5,
    }),
    // Recent activity
    prisma.appointment.findMany({
      where: { hospitalId },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  const formatApt = (apt: any) => ({
    id: apt.id,
    reference_number: apt.referenceNumber,
    start_time: apt.startTime,
    status: apt.status,
    reason: apt.reason || null,
    checked_in_at: apt.checkedInAt ? apt.checkedInAt.toISOString() : null,
    appointment_date: apt.appointmentDate instanceof Date ? apt.appointmentDate.toISOString().split('T')[0] : String(apt.appointmentDate),
    patient: apt.patient ? {
      id: apt.patient.id,
      user_id: apt.patient.userId,
      users: {
        full_name: apt.patient.user.fullName,
        phone: apt.patient.user.phone,
      },
    } : null,
    department: apt.department ? { name: apt.department.name } : null,
  })

  return {
    todayAppointments: todayAppointments.map((a) => ({
      id: a.id,
      status: a.status,
      appointment_date: a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : String(a.appointmentDate),
    })),
    queueData: queueData.map(formatApt),
    upcomingData: upcomingData.map(formatApt),
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      status: a.status,
      updated_at: a.updatedAt?.toISOString() || new Date().toISOString(),
      checked_in_at: (a as any).checkedInAt?.toISOString() || null,
      completed_at: (a as any).completedAt?.toISOString() || null,
      patient: a.patient ? {
        users: {
          full_name: a.patient.user.fullName,
        },
      } : null,
    })),
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string, extraData?: Record<string, any>) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const data: any = { status, ...extraData }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data,
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return { success: false, error: 'Failed to update appointment' }
  }
}
