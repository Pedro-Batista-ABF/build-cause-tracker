export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          created_by: string | null
          discipline: string | null
          id: string
          manager: string | null
          name: string
          project_id: string | null
          responsible: string | null
          total_qty: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discipline?: string | null
          id?: string
          manager?: string | null
          name: string
          project_id?: string | null
          responsible?: string | null
          total_qty?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discipline?: string | null
          id?: string
          manager?: string | null
          name?: string
          project_id?: string | null
          responsible?: string | null
          total_qty?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      causes: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cronograma_projeto: {
        Row: {
          atividade_lps_id: string | null
          created_at: string | null
          data_inicio: string | null
          data_termino: string | null
          duracao_dias: number | null
          id: string
          nivel_hierarquia: number | null
          nome: string
          percentual_previsto: number | null
          percentual_real: number | null
          predecessores: string | null
          projeto_id: string
          tarefa_id: string
          wbs: string | null
        }
        Insert: {
          atividade_lps_id?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          duracao_dias?: number | null
          id?: string
          nivel_hierarquia?: number | null
          nome: string
          percentual_previsto?: number | null
          percentual_real?: number | null
          predecessores?: string | null
          projeto_id: string
          tarefa_id: string
          wbs?: string | null
        }
        Update: {
          atividade_lps_id?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          duracao_dias?: number | null
          id?: string
          nivel_hierarquia?: number | null
          nome?: string
          percentual_previsto?: number | null
          percentual_real?: number | null
          predecessores?: string | null
          projeto_id?: string
          tarefa_id?: string
          wbs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_projeto_atividade_lps_id_fkey"
            columns: ["atividade_lps_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_progress: {
        Row: {
          activity_id: string | null
          actual_qty: number | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          planned_qty: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          actual_qty?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          planned_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          actual_qty?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          planned_qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_reports: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_current: boolean | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_current?: boolean | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_current?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      progress_causes: {
        Row: {
          cause_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          progress_id: string | null
        }
        Insert: {
          cause_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          progress_id?: string | null
        }
        Update: {
          cause_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          progress_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_causes_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_causes_progress_id_fkey"
            columns: ["progress_id"]
            isOneToOne: false
            referencedRelation: "daily_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client: string | null
          contract: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          ppc: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client?: string | null
          contract?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          ppc?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client?: string | null
          contract?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          ppc?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risco_atraso: {
        Row: {
          atividade_id: string | null
          classificacao: string
          created_at: string | null
          id: string
          risco_atraso_pct: number
          semana: string
        }
        Insert: {
          atividade_id?: string | null
          classificacao: string
          created_at?: string | null
          id?: string
          risco_atraso_pct: number
          semana: string
        }
        Update: {
          atividade_id?: string | null
          classificacao?: string
          created_at?: string | null
          id?: string
          risco_atraso_pct?: number
          semana?: string
        }
        Relationships: [
          {
            foreignKeyName: "risco_atraso_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_common_causes: {
        Args: { limit_count?: number }
        Returns: {
          name: string
          count: number
          percentage: number
        }[]
      }
      get_critical_disciplines: {
        Args: { limit_count?: number }
        Returns: {
          discipline: string
          count: number
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
