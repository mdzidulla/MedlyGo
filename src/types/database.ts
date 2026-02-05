export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'patient' | 'provider' | 'admin'
export type AppointmentStatus =
  | 'pending'      // Patient booked, awaiting hospital approval
  | 'confirmed'    // Hospital approved
  | 'rejected'     // Hospital rejected
  | 'suggested'    // Hospital suggested alternative (linked to original)
  | 'scheduled'    // Legacy status
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
export type NotificationType = 'sms' | 'email'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string
          role: UserRole
          avatar_url: string | null
          preferred_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          full_name: string
          role?: UserRole
          avatar_url?: string | null
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          full_name?: string
          role?: UserRole
          avatar_url?: string | null
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          ghana_card_id: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          medical_history_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ghana_card_id?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_history_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ghana_card_id?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_history_ref?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      providers: {
        Row: {
          id: string
          user_id: string
          hospital_id: string
          department_id: string
          specialization: string
          credentials: string | null
          bio: string | null
          consultation_duration: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hospital_id: string
          department_id: string
          specialization: string
          credentials?: string | null
          bio?: string | null
          consultation_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hospital_id?: string
          department_id?: string
          specialization?: string
          credentials?: string | null
          bio?: string | null
          consultation_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          region: string
          phone: string | null
          email: string | null
          website: string | null
          type: 'public' | 'private'
          description: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          is_24_hours: boolean
          opening_time: string | null
          closing_time: string | null
          rating: number | null
          total_reviews: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          region: string
          phone?: string | null
          email?: string | null
          website?: string | null
          type?: 'public' | 'private'
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          is_24_hours?: boolean
          opening_time?: string | null
          closing_time?: string | null
          rating?: number | null
          total_reviews?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          region?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          type?: 'public' | 'private'
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          is_24_hours?: boolean
          opening_time?: string | null
          closing_time?: string | null
          rating?: number | null
          total_reviews?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          hospital_id: string
          name: string
          description: string | null
          icon: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          name: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          name?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          provider_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration: number
          max_patients_per_slot: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration?: number
          max_patients_per_slot?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_duration?: number
          max_patients_per_slot?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          provider_id: string | null
          hospital_id: string
          department_id: string
          appointment_date: string
          start_time: string
          end_time: string | null
          status: AppointmentStatus
          reason: string | null
          notes: string | null
          reference_number: string
          checked_in_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          // New fields for appointment workflow
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          original_appointment_id: string | null
          suggested_date: string | null
          suggested_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          provider_id?: string | null
          hospital_id: string
          department_id: string
          appointment_date: string
          start_time: string
          end_time?: string | null
          status?: AppointmentStatus
          reason?: string | null
          notes?: string | null
          reference_number: string
          checked_in_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          // New fields for appointment workflow
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          original_appointment_id?: string | null
          suggested_date?: string | null
          suggested_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          provider_id?: string | null
          hospital_id?: string
          department_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string | null
          status?: AppointmentStatus
          reason?: string | null
          notes?: string | null
          reference_number?: string
          checked_in_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          // New fields for appointment workflow
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          original_appointment_id?: string | null
          suggested_date?: string | null
          suggested_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          appointment_id: string
          type: NotificationType
          status: NotificationStatus
          recipient: string
          message: string
          scheduled_for: string
          sent_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          type: NotificationType
          status?: NotificationStatus
          recipient: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          type?: NotificationType
          status?: NotificationStatus
          recipient?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          appointment_id: string
          patient_id: string
          provider_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          patient_id: string
          provider_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          patient_id?: string
          provider_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      appointment_status: AppointmentStatus
      notification_type: NotificationType
      notification_status: NotificationStatus
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Patient = Tables<'patients'>
export type Provider = Tables<'providers'>
export type Hospital = Tables<'hospitals'>
export type Department = Tables<'departments'>
export type Schedule = Tables<'schedules'>
export type Appointment = Tables<'appointments'>
export type Notification = Tables<'notifications'>
export type Feedback = Tables<'feedback'>
