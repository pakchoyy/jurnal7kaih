export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Role = 'super_admin' | 'school_admin' | 'teacher' | 'parent'

export type School = {
  id: string
  name: string
  code: string
  logo_url: string | null
  address: string | null
  phone: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type User = {
  id: string
  school_id: string | null
  name: string
  email: string | null
  phone: string | null
  role: Role
  avatar_url: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type AcademicYear = {
  id: string
  school_id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export type Class = {
  id: string
  school_id: string
  academic_year_id: string
  name: string
  grade: number
  homeroom_teacher_id: string | null
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  school_id: string
  class_id: string | null
  student_number: string | null
  nisn: string | null
  name: string
  gender: 'L' | 'P' | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type StudentParent = {
  id: string
  student_id: string
  user_id: string
  relationship: 'Ayah' | 'Ibu' | 'Wali'
  is_primary: boolean
  created_at: string
}

export type ParentActivationCode = {
  id: string
  school_id: string
  student_id: string
  code: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_by: string | null
  created_at: string
}

export type Habit = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Journal = {
  id: string
  school_id: string
  student_id: string
  journal_date: string
  status: 'draft' | 'submitted' | 'reviewed'
  parent_note: string | null
  created_by: string
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export type JournalEntry = {
  id: string
  journal_id: string
  habit_id: string
  status: 'done' | 'not_done'
  note: string | null
  created_at: string
  updated_at: string
}

export type TeacherNote = {
  id: string
  school_id: string
  student_id: string
  journal_id: string | null
  teacher_id: string
  note: string
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: School
        Insert: Partial<School> & { name: string; code: string }
        Update: Partial<School>
        Relationships: []
      }
      users: {
        Row: User
        Insert: Partial<User> & { id: string; name: string; role: Role }
        Update: Partial<User>
        Relationships: []
      }
      academic_years: {
        Row: AcademicYear
        Insert: Partial<AcademicYear> & {
          school_id: string
          name: string
          start_date: string
          end_date: string
        }
        Update: Partial<AcademicYear>
        Relationships: []
      }
      classes: {
        Row: Class
        Insert: Partial<Class> & {
          school_id: string
          academic_year_id: string
          name: string
          grade: number
        }
        Update: Partial<Class>
        Relationships: []
      }
      students: {
        Row: Student
        Insert: Partial<Student> & { school_id: string; name: string }
        Update: Partial<Student>
        Relationships: []
      }
      student_parents: {
        Row: StudentParent
        Insert: Partial<StudentParent> & {
          student_id: string
          user_id: string
          relationship: 'Ayah' | 'Ibu' | 'Wali'
        }
        Update: Partial<StudentParent>
        Relationships: []
      }
      parent_activation_codes: {
        Row: ParentActivationCode
        Insert: Partial<ParentActivationCode> & {
          school_id: string
          student_id: string
          code: string
        }
        Update: Partial<ParentActivationCode>
        Relationships: []
      }
      habits: {
        Row: Habit
        Insert: Partial<Habit> & { name: string; slug: string; sort_order: number }
        Update: Partial<Habit>
        Relationships: []
      }
      journals: {
        Row: Journal
        Insert: Partial<Journal> & {
          school_id: string
          student_id: string
          journal_date: string
          created_by: string
        }
        Update: Partial<Journal>
        Relationships: []
      }
      journal_entries: {
        Row: JournalEntry
        Insert: Partial<JournalEntry> & {
          journal_id: string
          habit_id: string
        }
        Update: Partial<JournalEntry>
        Relationships: []
      }
      teacher_notes: {
        Row: TeacherNote
        Insert: Partial<TeacherNote> & {
          school_id: string
          student_id: string
          teacher_id: string
          note: string
        }
        Update: Partial<TeacherNote>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      auth_school_id: {
        Args: Record<string, never>
        Returns: string
      }
      auth_role: {
        Args: Record<string, never>
        Returns: string
      }
      auth_accessible_student_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      link_child_by_code: {
        Args: {
          p_code: string
          p_relationship: string
        }
        Returns: string
      }
    }
  }
}
