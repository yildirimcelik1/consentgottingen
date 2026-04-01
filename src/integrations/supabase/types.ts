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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointment_drafts: {
        Row: {
          created_at: string
          created_by: string | null
          deposit_amount: string | null
          first_name: string
          id: string
          last_name: string
          linked_form_id: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deposit_amount?: string | null
          first_name: string
          id?: string
          last_name: string
          linked_form_id?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deposit_amount?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linked_form_id?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      completed_appointments: {
        Row: {
          approved_at: string | null
          artist_name: string
          assigned_artist_id: string | null
          body_area: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deposit_amount: string | null
          email: string | null
          first_name: string
          form_id: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          procedure_description: string | null
          rest_amount: string | null
          total_price: string | null
        }
        Insert: {
          approved_at?: string | null
          artist_name?: string
          assigned_artist_id?: string | null
          body_area?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deposit_amount?: string | null
          email?: string | null
          first_name?: string
          form_id: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          procedure_description?: string | null
          rest_amount?: string | null
          total_price?: string | null
        }
        Update: {
          approved_at?: string | null
          artist_name?: string
          assigned_artist_id?: string | null
          body_area?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deposit_amount?: string | null
          email?: string | null
          first_name?: string
          form_id?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          procedure_description?: string | null
          rest_amount?: string | null
          total_price?: string | null
        }
        Relationships: []
      }
      consent_forms: {
        Row: {
          accepted_aftercare: boolean
          accepted_terms: boolean
          address_line_1: string | null
          address_line_2: string | null
          allergies_details: string | null
          appointment_date: string | null
          approved_at: string | null
          assigned_artist_id: string | null
          blood_disorder: boolean | null
          blood_disorder_details: string | null
          body_area: string | null
          city: string | null
          client_signature: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          country: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deposit_amount: string | null
          designer_notes: string | null
          diabetes: boolean | null
          document_generated_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          epilepsy: boolean | null
          fainting_history: boolean | null
          first_name: string
          gender: string | null
          government_id_number: string | null
          government_id_type: string | null
          has_allergies: boolean
          has_medical_conditions: boolean
          has_skin_condition: boolean | null
          heart_condition: boolean | null
          hepatitis: boolean | null
          hiv: boolean | null
          id: string
          internal_notes: string | null
          last_name: string
          medical_conditions_details: string | null
          medication_details: string | null
          other_health_notes: string | null
          pdf_url: string | null
          phone: string | null
          photo_consent: boolean | null
          postal_code: string | null
          pregnant_or_breastfeeding: boolean | null
          price: string | null
          procedure_description: string | null
          reference_notes: string | null
          signature_date: string | null
          skin_condition_details: string | null
          status: Database["public"]["Enums"]["form_status"]
          takes_medication: boolean
          under_influence: boolean | null
          updated_at: string
        }
        Insert: {
          accepted_aftercare?: boolean
          accepted_terms?: boolean
          address_line_1?: string | null
          address_line_2?: string | null
          allergies_details?: string | null
          appointment_date?: string | null
          approved_at?: string | null
          assigned_artist_id?: string | null
          blood_disorder?: boolean | null
          blood_disorder_details?: string | null
          body_area?: string | null
          city?: string | null
          client_signature?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deposit_amount?: string | null
          designer_notes?: string | null
          diabetes?: boolean | null
          document_generated_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          epilepsy?: boolean | null
          fainting_history?: boolean | null
          first_name?: string
          gender?: string | null
          government_id_number?: string | null
          government_id_type?: string | null
          has_allergies?: boolean
          has_medical_conditions?: boolean
          has_skin_condition?: boolean | null
          heart_condition?: boolean | null
          hepatitis?: boolean | null
          hiv?: boolean | null
          id?: string
          internal_notes?: string | null
          last_name?: string
          medical_conditions_details?: string | null
          medication_details?: string | null
          other_health_notes?: string | null
          pdf_url?: string | null
          phone?: string | null
          photo_consent?: boolean | null
          postal_code?: string | null
          pregnant_or_breastfeeding?: boolean | null
          price?: string | null
          procedure_description?: string | null
          reference_notes?: string | null
          signature_date?: string | null
          skin_condition_details?: string | null
          status?: Database["public"]["Enums"]["form_status"]
          takes_medication?: boolean
          under_influence?: boolean | null
          updated_at?: string
        }
        Update: {
          accepted_aftercare?: boolean
          accepted_terms?: boolean
          address_line_1?: string | null
          address_line_2?: string | null
          allergies_details?: string | null
          appointment_date?: string | null
          approved_at?: string | null
          assigned_artist_id?: string | null
          blood_disorder?: boolean | null
          blood_disorder_details?: string | null
          body_area?: string | null
          city?: string | null
          client_signature?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deposit_amount?: string | null
          designer_notes?: string | null
          diabetes?: boolean | null
          document_generated_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          epilepsy?: boolean | null
          fainting_history?: boolean | null
          first_name?: string
          gender?: string | null
          government_id_number?: string | null
          government_id_type?: string | null
          has_allergies?: boolean
          has_medical_conditions?: boolean
          has_skin_condition?: boolean | null
          heart_condition?: boolean | null
          hepatitis?: boolean | null
          hiv?: boolean | null
          id?: string
          internal_notes?: string | null
          last_name?: string
          medical_conditions_details?: string | null
          medication_details?: string | null
          other_health_notes?: string | null
          pdf_url?: string | null
          phone?: string | null
          photo_consent?: boolean | null
          postal_code?: string | null
          pregnant_or_breastfeeding?: boolean | null
          price?: string | null
          procedure_description?: string | null
          reference_notes?: string | null
          signature_date?: string | null
          skin_condition_details?: string | null
          status?: Database["public"]["Enums"]["form_status"]
          takes_medication?: boolean
          under_influence?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      form_assignments: {
        Row: {
          artist_name: string
          assigned_artist_id: string
          assigned_by: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          form_id: string
          id: string
          price: string | null
        }
        Insert: {
          artist_name?: string
          assigned_artist_id: string
          assigned_by?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          form_id: string
          id?: string
          price?: string | null
        }
        Update: {
          artist_name?: string
          assigned_artist_id?: string
          assigned_by?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          form_id?: string
          id?: string
          price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_assignments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "consent_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
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
      all_approved_forms: {
        Row: {
          approved_at: string | null
          artist_name: string | null
          assigned_artist_id: string | null
          body_area: string | null
          consent_type: Database["public"]["Enums"]["consent_type"] | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deposit_amount: string | null
          email: string | null
          first_name: string | null
          form_id: string | null
          gender: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          procedure_description: string | null
          rest_amount: string | null
          source: string | null
          total_price: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "designer" | "piercer" | "tattoo_artist"
      consent_type: "tattoo" | "piercing"
      form_status: "draft" | "approved"
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
      app_role: ["admin", "designer", "piercer", "tattoo_artist"],
      consent_type: ["tattoo", "piercing"],
      form_status: ["draft", "approved"],
    },
  },
} as const
