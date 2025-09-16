export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      batches: {
        Row: {
          class_representative_id: string | null
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          section: string | null
          semester: number
          student_count: number | null
          year: number
        }
        Insert: {
          class_representative_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          section?: string | null
          semester: number
          student_count?: number | null
          year: number
        }
        Update: {
          class_representative_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          section?: string | null
          semester?: number
          student_count?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_class_representative_id_fkey"
            columns: ["class_representative_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      constraints: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          academic_year: string
          batch_id: string
          course_id: string
          created_at: string
          faculty_id: string
          hours_per_week: number | null
          id: string
          semester: number
        }
        Insert: {
          academic_year: string
          batch_id: string
          course_id: string
          created_at?: string
          faculty_id: string
          hours_per_week?: number | null
          id?: string
          semester: number
        }
        Update: {
          academic_year?: string
          batch_id?: string
          course_id?: string
          created_at?: string
          faculty_id?: string
          hours_per_week?: number | null
          id?: string
          semester?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          course_type: string
          created_at: string
          credits: number
          department_id: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          prerequisites: string[] | null
          semester: number | null
        }
        Insert: {
          code: string
          course_type?: string
          created_at?: string
          credits?: number
          department_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          prerequisites?: string[] | null
          semester?: number | null
        }
        Update: {
          code?: string
          course_type?: string
          created_at?: string
          credits?: number
          department_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          prerequisites?: string[] | null
          semester?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          head_id: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          head_id?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          head_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty: {
        Row: {
          created_at: string
          department_id: string | null
          designation: string | null
          employee_id: string
          id: string
          is_active: boolean
          max_hours_per_week: number | null
          preferred_time_slots: Json | null
          profile_id: string
          specialization: string[] | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          employee_id: string
          id?: string
          is_active?: boolean
          max_hours_per_week?: number | null
          preferred_time_slots?: Json | null
          profile_id: string
          specialization?: string[] | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean
          max_hours_per_week?: number | null
          preferred_time_slots?: Json | null
          profile_id?: string
          specialization?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approved_by: string | null
          created_at: string
          end_date: string
          faculty_id: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          substitute_faculty_id: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          end_date: string
          faculty_id: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          substitute_faculty_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          end_date?: string
          faculty_id?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          substitute_faculty_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_substitute_faculty_id_fkey"
            columns: ["substitute_faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          code: string
          created_at: string
          department_id: string | null
          facilities: string[] | null
          id: string
          is_active: boolean
          name: string
          room_type: string
        }
        Insert: {
          capacity?: number
          code: string
          created_at?: string
          department_id?: string | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          room_type?: string
        }
        Update: {
          capacity?: number
          code?: string
          created_at?: string
          department_id?: string | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_runs: {
        Row: {
          academic_year: string
          completed_at: string | null
          created_at: string
          generated_by: string | null
          generation_config: Json | null
          generation_log: string | null
          id: string
          name: string
          published_at: string | null
          semester: number
          started_at: string | null
          status: string
        }
        Insert: {
          academic_year: string
          completed_at?: string | null
          created_at?: string
          generated_by?: string | null
          generation_config?: Json | null
          generation_log?: string | null
          id?: string
          name: string
          published_at?: string | null
          semester: number
          started_at?: string | null
          status?: string
        }
        Update: {
          academic_year?: string
          completed_at?: string | null
          created_at?: string
          generated_by?: string | null
          generation_config?: Json | null
          generation_log?: string | null
          id?: string
          name?: string
          published_at?: string | null
          semester?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_runs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          batch_id: string
          course_assignment_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room_id: string
          run_id: string
          start_time: string
        }
        Insert: {
          batch_id: string
          course_assignment_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room_id: string
          run_id: string
          start_time: string
        }
        Update: {
          batch_id?: string
          course_assignment_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room_id?: string
          run_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_course_assignment_id_fkey"
            columns: ["course_assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "timetable_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
