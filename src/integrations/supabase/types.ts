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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          breakdown: Json
          created_at: string
          id: string
          kind: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          breakdown?: Json
          created_at?: string
          id?: string
          kind: string
          reason?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          breakdown?: Json
          created_at?: string
          id?: string
          kind?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          bonus_credits: number
          period_end: string | null
          plan: string
          subscription_credits: number
          topup_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_credits?: number
          period_end?: string | null
          plan?: string
          subscription_credits?: number
          topup_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_credits?: number
          period_end?: string | null
          plan?: string
          subscription_credits?: number
          topup_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string
          id: string
          incoming_email: string
          lead_id: string | null
          mode: string
          options: Json
          sender: string
          strategy: string
          tone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          incoming_email?: string
          lead_id?: string | null
          mode?: string
          options?: Json
          sender?: string
          strategy?: string
          tone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          incoming_email?: string
          lead_id?: string | null
          mode?: string
          options?: Json
          sender?: string
          strategy?: string
          tone?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string
          category: string
          city: string
          company: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          address?: string
          category?: string
          city?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          address?: string
          category?: string
          city?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      outbox: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          lead_id: string | null
          provider: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          provider?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          provider?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brand_voice: string
          created_at: string
          display_name: string | null
          id: string
          signature: string
          updated_at: string
        }
        Insert: {
          brand_voice?: string
          created_at?: string
          display_name?: string | null
          id: string
          signature?: string
          updated_at?: string
        }
        Update: {
          brand_voice?: string
          created_at?: string
          display_name?: string | null
          id?: string
          signature?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_topup: {
        Args: { _credits: number; _user_id: string }
        Returns: undefined
      }
      apply_subscription: {
        Args: {
          _credits: number
          _period_end: string
          _plan: string
          _user_id: string
        }
        Returns: undefined
      }
      refund_credits: {
        Args: { _ledger_id: string; _user_id: string }
        Returns: undefined
      }
      reserve_credits: {
        Args: { _amount: number; _reason: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
