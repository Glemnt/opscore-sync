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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          access_level: number
          auth_user_id: string | null
          created_at: string
          id: string
          login: string
          name: string
          role: Database["public"]["Enums"]["team_role"]
          squad_ids: string[]
        }
        Insert: {
          access_level?: number
          auth_user_id?: string | null
          created_at?: string
          id?: string
          login: string
          name: string
          role?: Database["public"]["Enums"]["team_role"]
          squad_ids?: string[]
        }
        Update: {
          access_level?: number
          auth_user_id?: string | null
          created_at?: string
          id?: string
          login?: string
          name?: string
          role?: Database["public"]["Enums"]["team_role"]
          squad_ids?: string[]
        }
        Relationships: []
      }
      client_change_logs: {
        Row: {
          changed_at: string
          changed_by: string
          client_id: string
          field: string
          id: string
          new_value: string
          old_value: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string
          client_id: string
          field: string
          id?: string
          new_value?: string
          old_value?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          client_id?: string
          field?: string
          id?: string
          new_value?: string
          old_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_change_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chat_notes: {
        Row: {
          author: string
          client_id: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          author?: string
          client_id: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          author?: string
          client_id?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_chat_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_flows: {
        Row: {
          client_id: string
          flow_id: string
          id: string
        }
        Insert: {
          client_id: string
          flow_id: string
          id?: string
        }
        Update: {
          client_id?: string
          flow_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_flows_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      client_platforms: {
        Row: {
          client_id: string
          created_at: string
          deadline: string | null
          health_color: string | null
          id: string
          notes: string
          phase: string
          platform_attributes: Json
          platform_slug: string
          quality_level: string | null
          responsible: string
          squad_id: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deadline?: string | null
          health_color?: string | null
          id?: string
          notes?: string
          phase?: string
          platform_attributes?: Json
          platform_slug: string
          quality_level?: string | null
          responsible?: string
          squad_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deadline?: string | null
          health_color?: string | null
          id?: string
          notes?: string
          phase?: string
          platform_attributes?: Json
          platform_slug?: string
          quality_level?: string | null
          responsible?: string
          squad_id?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_platforms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_platforms_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_statuses: {
        Row: {
          class_name: string
          created_at: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          class_name?: string
          created_at?: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          active_projects: number
          company_name: string
          contract_duration_months: number | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          health_color: Database["public"]["Enums"]["health_color"] | null
          id: string
          logo: string | null
          monthly_revenue: number | null
          name: string
          notes: string
          payment_day: number
          pending_tasks: number
          platforms: string[] | null
          responsible: string
          segment: string
          setup_fee: number | null
          squad_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          active_projects?: number
          company_name: string
          contract_duration_months?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          health_color?: Database["public"]["Enums"]["health_color"] | null
          id?: string
          logo?: string | null
          monthly_revenue?: number | null
          name: string
          notes?: string
          payment_day?: number
          pending_tasks?: number
          platforms?: string[] | null
          responsible?: string
          segment?: string
          setup_fee?: number | null
          squad_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_projects?: number
          company_name?: string
          contract_duration_months?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          health_color?: Database["public"]["Enums"]["health_color"] | null
          id?: string
          logo?: string | null
          monthly_revenue?: number | null
          name?: string
          notes?: string
          payment_day?: number
          pending_tasks?: number
          platforms?: string[] | null
          responsible?: string
          segment?: string
          setup_fee?: number | null
          squad_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          subtasks: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subtasks?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subtasks?: string[]
        }
        Relationships: []
      }
      flows: {
        Row: {
          created_at: string
          id: string
          name: string
          steps: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          steps?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          steps?: string[]
        }
        Relationships: []
      }
      phase_demand_templates: {
        Row: {
          created_at: string
          demand_owner: string
          id: string
          phase: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          demand_owner?: string
          id?: string
          phase: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          demand_owner?: string
          id?: string
          phase?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      project_checklist_items: {
        Row: {
          done: boolean
          id: string
          label: string
          project_id: string
          sort_order: number
        }
        Insert: {
          done?: boolean
          id?: string
          label: string
          project_id: string
          sort_order?: number
        }
        Update: {
          done?: boolean
          id?: string
          label?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          deadline: string
          id: string
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          progress: number
          responsible: string
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_name?: string
          created_at?: string
          deadline?: string
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          responsible?: string
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          deadline?: string
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          responsible?: string
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          id: string
          leader: string
          members: string[]
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader: string
          members?: string[]
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          leader?: string
          members?: string[]
          name?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          done: boolean
          id: string
          label: string
          task_id: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          done?: boolean
          id?: string
          label: string
          task_id: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          done?: boolean
          id?: string
          label?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_chat_notes: {
        Row: {
          author: string
          created_at: string
          id: string
          message: string
          task_id: string
        }
        Insert: {
          author?: string
          created_at?: string
          id?: string
          message: string
          task_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          message?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_chat_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          class_name: string
          created_at: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          class_name?: string
          created_at?: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      task_types: {
        Row: {
          color: string
          created_at: string
          id: string
          key: string
          label: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          key: string
          label: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string
          client_name: string
          comments: string
          created_at: string
          deadline: string
          estimated_time: number
          id: string
          platform: string[] | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          project_name: string | null
          real_time: number | null
          responsible: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_name?: string
          comments?: string
          created_at?: string
          deadline?: string
          estimated_time?: number
          id?: string
          platform?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          project_name?: string | null
          real_time?: number | null
          responsible?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_name?: string
          comments?: string
          created_at?: string
          deadline?: string
          estimated_time?: number
          id?: string
          platform?: string[] | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          project_name?: string | null
          real_time?: number | null
          responsible?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          avg_time: number
          completed_tasks: number
          current_load: number
          id: string
          late_tasks: number
          name: string
          on_time_pct: number
          role: Database["public"]["Enums"]["team_role"]
          squad_id: string | null
        }
        Insert: {
          avatar?: string | null
          avg_time?: number
          completed_tasks?: number
          current_load?: number
          id?: string
          late_tasks?: number
          name: string
          on_time_pct?: number
          role?: Database["public"]["Enums"]["team_role"]
          squad_id?: string | null
        }
        Update: {
          avatar?: string | null
          avg_time?: number
          completed_tasks?: number
          current_load?: number
          id?: string
          late_tasks?: number
          name?: string
          on_time_pct?: number
          role?: Database["public"]["Enums"]["team_role"]
          squad_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      client_status: "active" | "paused" | "churned" | "onboarding"
      contract_type: "mrr" | "tcv"
      health_color: "green" | "yellow" | "red" | "white"
      platform_type: "mercado_livre" | "shopee" | "shein"
      priority_level: "high" | "medium" | "low"
      project_status: "backlog" | "in_progress" | "waiting_client" | "done"
      task_status: "backlog" | "in_progress" | "waiting_client" | "done"
      team_role: "cs" | "operacional" | "design" | "copy" | "gestao"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      client_status: ["active", "paused", "churned", "onboarding"],
      contract_type: ["mrr", "tcv"],
      health_color: ["green", "yellow", "red", "white"],
      platform_type: ["mercado_livre", "shopee", "shein"],
      priority_level: ["high", "medium", "low"],
      project_status: ["backlog", "in_progress", "waiting_client", "done"],
      task_status: ["backlog", "in_progress", "waiting_client", "done"],
      team_role: ["cs", "operacional", "design", "copy", "gestao"],
    },
  },
} as const
