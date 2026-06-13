export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      absence_requests: {
        Row: {
          comment: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["absence_status"]
          type_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["absence_status"]
          type_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["absence_status"]
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "absence_types"
            referencedColumns: ["id"]
          },
        ]
      }
      absence_types: {
        Row: {
          affects_counter: boolean
          annual_cap: number
          can_be_requested: boolean
          color: string
          created_at: string
          id: string
          is_active: boolean
          monthly_accrual: number
          name: string
          org_id: string
          paid_by: string
          period_start_month: number
          sort_order: number
        }
        Insert: {
          affects_counter?: boolean
          annual_cap?: number
          can_be_requested?: boolean
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_accrual?: number
          name: string
          org_id: string
          paid_by?: string
          period_start_month?: number
          sort_order?: number
        }
        Update: {
          affects_counter?: boolean
          annual_cap?: number
          can_be_requested?: boolean
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_accrual?: number
          name?: string
          org_id?: string
          paid_by?: string
          period_start_month?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "absence_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_settings: {
        Row: {
          alert_code: string
          blocking: boolean
          enabled: boolean
          id: string
          org_id: string
        }
        Insert: {
          alert_code: string
          blocking?: boolean
          enabled?: boolean
          id?: string
          org_id: string
        }
        Update: {
          alert_code?: string
          blocking?: boolean
          enabled?: boolean
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          hourly_rate: number | null
          id: string
          position_id: string | null
          start_date: string
          type: Database["public"]["Enums"]["contract_type"]
          updated_at: string
          weekly_hours: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          position_id?: string | null
          start_date: string
          type: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
          weekly_hours?: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          position_id?: string | null
          start_date?: string
          type?: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_locations: {
        Row: {
          employee_id: string
          location_id: string
          is_primary: boolean
        }
        Insert: {
          employee_id: string
          location_id: string
          is_primary?: boolean
        }
        Update: {
          employee_id?: string
          location_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "employee_locations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_positions: {
        Row: {
          employee_id: string
          position_id: string
        }
        Insert: {
          employee_id: string
          position_id: string
        }
        Update: {
          employee_id?: string
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_positions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_teams: {
        Row: {
          employee_id: string
          team_id: string
        }
        Insert: {
          employee_id: string
          team_id: string
        }
        Update: {
          employee_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_teams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          employee_number: string | null
          exit_date: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          org_id: string
          phone: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          employee_number?: string | null
          exit_date?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          org_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          employee_number?: string | null
          exit_date?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          org_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          employee_id: string
          expires_at: string
          id: string
          org_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          employee_id: string
          expires_at?: string
          id?: string
          org_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          employee_id?: string
          expires_at?: string
          id?: string
          org_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          acquired: number
          adjusted: number
          employee_id: string
          id: string
          taken: number
          type_id: string
          year: number
        }
        Insert: {
          acquired?: number
          adjusted?: number
          employee_id: string
          id?: string
          taken?: number
          type_id: string
          year: number
        }
        Update: {
          acquired?: number
          adjusted?: number
          employee_id?: string
          id?: string
          taken?: number
          type_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "absence_types"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          break_rules: Json
          city: string | null
          color: string
          country: string
          created_at: string
          day_start_hour: number
          id: string
          name: string
          org_id: string
          postal_code: string | null
          sector: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          break_rules?: Json
          city?: string | null
          color?: string
          country?: string
          created_at?: string
          day_start_hour?: number
          id?: string
          name: string
          org_id: string
          postal_code?: string | null
          sector?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          break_rules?: Json
          city?: string | null
          color?: string
          country?: string
          created_at?: string
          day_start_hour?: number
          id?: string
          name?: string
          org_id?: string
          postal_code?: string | null
          sector?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          collective_agreement: string | null
          created_at: string
          id: string
          meal_allowance_amount: number
          meal_allowance_enabled: boolean
          name: string
          payroll_charge_rate: number
          plan: Database["public"]["Enums"]["org_plan"]
          reference_days_per_week: number
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          collective_agreement?: string | null
          created_at?: string
          id?: string
          meal_allowance_amount?: number
          meal_allowance_enabled?: boolean
          name: string
          payroll_charge_rate?: number
          plan?: Database["public"]["Enums"]["org_plan"]
          reference_days_per_week?: number
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          collective_agreement?: string | null
          created_at?: string
          id?: string
          meal_allowance_amount?: number
          meal_allowance_enabled?: boolean
          name?: string
          payroll_charge_rate?: number
          plan?: Database["public"]["Enums"]["org_plan"]
          reference_days_per_week?: number
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          color: string
          created_at: string
          default_rate: number | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          default_rate?: number | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          color?: string
          created_at?: string
          default_rate?: number | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schedule_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          id: string
          location_id: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          color: string | null
          created_at: string
          employee_id: string | null
          end_time: string
          id: string
          note_employee: string | null
          note_manager: string | null
          position_id: string | null
          schedule_id: string
          shift_date: string
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          employee_id?: string | null
          end_time: string
          id?: string
          note_employee?: string | null
          note_manager?: string | null
          position_id?: string | null
          schedule_id: string
          shift_date: string
          start_time: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          employee_id?: string | null
          end_time?: string
          id?: string
          note_employee?: string | null
          note_manager?: string | null
          position_id?: string | null
          schedule_id?: string
          shift_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          id: string
          location_id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          location_id: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          location_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_shifts: {
        Row: {
          break_minutes: number
          day_of_week: number
          employee_id: string | null
          end_time: string
          id: string
          position_id: string | null
          start_time: string
          template_id: string
        }
        Insert: {
          break_minutes?: number
          day_of_week: number
          employee_id?: string | null
          end_time: string
          id?: string
          position_id?: string | null
          start_time: string
          template_id: string
        }
        Update: {
          break_minutes?: number
          day_of_week?: number
          employee_id?: string | null
          end_time?: string
          id?: string
          position_id?: string | null
          start_time?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      employee_org_id: { Args: { emp: string }; Returns: string }
      has_org_role: {
        Args: {
          roles: Database["public"]["Enums"]["app_role"][]
          target_org: string
        }
        Returns: boolean
      }
      is_org_manager: { Args: { target_org: string }; Returns: boolean }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      location_org_id: { Args: { loc: string }; Returns: string }
      schedule_org_id: { Args: { sched: string }; Returns: string }
      seed_default_absence_types: {
        Args: { target_org: string }
        Returns: undefined
      }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      absence_status: "pending" | "approved" | "rejected" | "cancelled"
      app_role:
        | "org_owner"
        | "org_admin"
        | "location_manager"
        | "team_manager"
        | "employee"
      contract_type:
        | "cdi"
        | "cdd"
        | "interim"
        | "extra"
        | "apprenticeship"
        | "internship"
      employee_status: "active" | "inactive" | "archived"
      org_plan: "trial" | "starter" | "growth" | "enterprise"
      schedule_status: "draft" | "published"
      shift_status: "draft" | "published" | "confirmed" | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      absence_status: ["pending", "approved", "rejected", "cancelled"],
      app_role: [
        "org_owner",
        "org_admin",
        "location_manager",
        "team_manager",
        "employee",
      ],
      contract_type: [
        "cdi",
        "cdd",
        "interim",
        "extra",
        "apprenticeship",
        "internship",
      ],
      employee_status: ["active", "inactive", "archived"],
      org_plan: ["trial", "starter", "growth", "enterprise"],
      schedule_status: ["draft", "published"],
      shift_status: ["draft", "published", "confirmed", "cancelled"],
    },
  },
} as const

