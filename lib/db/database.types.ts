// Generated from the live Supabase schema (supabase gen types typescript).
// Regenerate after any migration:
//   supabase gen types typescript --project-id <id> > lib/db/database.types.ts
// Named enum aliases used across the app are appended at the bottom.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent: string
          at: string
          cost: number | null
          id: string
          model: string | null
          project_id: string
          prompt_hash: string | null
          status: string | null
          tokens_in: number | null
          tokens_out: number | null
          trace: Json
        }
        Insert: {
          agent: string
          at?: string
          cost?: number | null
          id?: string
          model?: string | null
          project_id: string
          prompt_hash?: string | null
          status?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          trace?: Json
        }
        Update: {
          agent?: string
          at?: string
          cost?: number | null
          id?: string
          model?: string | null
          project_id?: string
          prompt_hash?: string | null
          status?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          trace?: Json
        }
        Relationships: []
      }
      assets: {
        Row: {
          checksum: string | null
          created_at: string
          created_by_job: string | null
          height: number | null
          id: string
          mime: string | null
          project_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          created_by_job?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          project_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          checksum?: string | null
          created_at?: string
          created_by_job?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          project_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignee_id: string | null
          created_at: string
          done: boolean
          field_path: string
          id: string
          project_id: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          done?: boolean
          field_path: string
          id?: string
          project_id: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          done?: boolean
          field_path?: string
          id?: string
          project_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          from_state: string | null
          id: string
          meta: Json
          project_id: string | null
          to_state: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          project_id?: string | null
          to_state?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          project_id?: string | null
          to_state?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          code: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template: string | null
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template?: string | null
        }
        Relationships: []
      }
      brief_data: {
        Row: {
          data: Json
          id: string
          project_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          data?: Json
          id?: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          data?: Json
          id?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          project_id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          project_id: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      company_certs: {
        Row: {
          id: string
          kind: string | null
          name: string
          path: string | null
          valid_until: string | null
        }
        Insert: {
          id?: string
          kind?: string | null
          name: string
          path?: string | null
          valid_until?: string | null
        }
        Update: {
          id?: string
          kind?: string | null
          name?: string
          path?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      company_people: {
        Row: {
          cv_path: string | null
          id: string
          name: string
          title: string | null
          years_exp: number | null
        }
        Insert: {
          cv_path?: string | null
          id?: string
          name: string
          title?: string | null
          years_exp?: number | null
        }
        Update: {
          cv_path?: string | null
          id?: string
          name?: string
          title?: string | null
          years_exp?: number | null
        }
        Relationships: []
      }
      company_projects: {
        Row: {
          certificate_path: string | null
          client: string | null
          created_at: string
          id: string
          images: string[] | null
          name: string
          scope: string | null
          year: number | null
        }
        Insert: {
          certificate_path?: string | null
          client?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          name: string
          scope?: string | null
          year?: number | null
        }
        Update: {
          certificate_path?: string | null
          client?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          name?: string
          scope?: string | null
          year?: number | null
        }
        Relationships: []
      }
      company_suppliers: {
        Row: {
          category: string | null
          id: string
          name: string
          notes: string | null
          rating: number | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          notes?: string | null
          rating?: number | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          notes?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      creative_strategy: {
        Row: {
          data: Json
          id: string
          project_id: string
          status: Database["public"]["Enums"]["artifact_status"]
          updated_at: string
          version: number
        }
        Insert: {
          data?: Json
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["artifact_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          data?: Json
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["artifact_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      field_flags: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          field_path: string
          id: string
          project_id: string
          source_page: number | null
          status: Database["public"]["Enums"]["field_status"]
        }
        Insert: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          field_path: string
          id?: string
          project_id: string
          source_page?: number | null
          status?: Database["public"]["Enums"]["field_status"]
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          field_path?: string
          id?: string
          project_id?: string
          source_page?: number | null
          status?: Database["public"]["Enums"]["field_status"]
        }
        Relationships: []
      }
      gates: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          gate_key: string
          id: string
          note: string | null
          project_id: string
          status: Database["public"]["Enums"]["gate_status"]
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          gate_key: string
          id?: string
          note?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["gate_status"]
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          gate_key?: string
          id?: string
          note?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["gate_status"]
        }
        Relationships: []
      }
      generations: {
        Row: {
          asset_id: string | null
          created_at: string
          id: string
          kind: string
          model: string | null
          parent_generation_id: string | null
          project_id: string
          prompt: string | null
          provider: string | null
          qa: Json | null
          reference_asset_ids: string[] | null
          settings: Json
          space_id: string | null
          status: Database["public"]["Enums"]["artifact_status"]
          version: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          model?: string | null
          parent_generation_id?: string | null
          project_id: string
          prompt?: string | null
          provider?: string | null
          qa?: Json | null
          reference_asset_ids?: string[] | null
          settings?: Json
          space_id?: string | null
          status?: Database["public"]["Enums"]["artifact_status"]
          version?: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          model?: string | null
          parent_generation_id?: string | null
          project_id?: string
          prompt?: string | null
          provider?: string | null
          qa?: Json | null
          reference_asset_ids?: string[] | null
          settings?: Json
          space_id?: string | null
          status?: Database["public"]["Enums"]["artifact_status"]
          version?: number
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          payload: Json
          progress: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json
          progress?: number
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json
          progress?: number
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: Database["public"]["Enums"]["job_type"]
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          content: string
          embedding: string | null
          id: string
          kb_document_id: string
        }
        Insert: {
          content: string
          embedding?: string | null
          id?: string
          kb_document_id: string
        }
        Update: {
          content?: string
          embedding?: string | null
          id?: string
          kb_document_id?: string
        }
        Relationships: []
      }
      kb_documents: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          meta: Json
          project_ref: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          project_ref?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          project_ref?: string | null
          title?: string | null
        }
        Relationships: []
      }
      moodboard_items: {
        Row: {
          caption: string | null
          category: string | null
          id: string
          image_asset_id: string | null
          moodboard_id: string
          source: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          id?: string
          image_asset_id?: string | null
          moodboard_id: string
          source?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          id?: string
          image_asset_id?: string | null
          moodboard_id?: string
          source?: string | null
        }
        Relationships: []
      }
      moodboards: {
        Row: {
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["artifact_status"]
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["artifact_status"]
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["artifact_status"]
          version?: number
        }
        Relationships: []
      }
      presentation_slides: {
        Row: {
          asset_ids: string[] | null
          content: Json
          id: string
          presentation_id: string
          section: string
          sort_order: number
        }
        Insert: {
          asset_ids?: string[] | null
          content?: Json
          id?: string
          presentation_id: string
          section: string
          sort_order?: number
        }
        Update: {
          asset_ids?: string[] | null
          content?: Json
          id?: string
          presentation_id?: string
          section?: string
          sort_order?: number
        }
        Relationships: []
      }
      presentations: {
        Row: {
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["artifact_status"]
          structure: Json
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["artifact_status"]
          structure?: Json
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["artifact_status"]
          structure?: Json
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      project_blocks: {
        Row: {
          block_id: string | null
          created_at: string
          id: string
          output: Json | null
          project_id: string
          sort_order: number
          status: string
          target_pages: number | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          id?: string
          output?: Json | null
          project_id: string
          sort_order?: number
          status?: string
          target_pages?: number | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          id?: string
          output?: Json | null
          project_id?: string
          sort_order?: number
          status?: string
          target_pages?: number | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime: string | null
          path: string
          project_id: string
          size: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          mime?: string | null
          path: string
          project_id: string
          size?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          path?: string
          project_id?: string
          size?: number | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          contract_no: string | null
          created_at: string
          deadline: string | null
          id: string
          owner_id: string
          project_type: Database["public"]["Enums"]["project_type"]
          status: Database["public"]["Enums"]["project_status"]
          title: string
          tracks: string[]
          updated_at: string
        }
        Insert: {
          client?: string | null
          contract_no?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          owner_id: string
          project_type?: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          tracks?: string[]
          updated_at?: string
        }
        Update: {
          client?: string | null
          contract_no?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          owner_id?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          tracks?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      revisions: {
        Row: {
          created_at: string
          created_by: string | null
          generation_id: string
          id: string
          instruction: string
          mode: string
          result_generation_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          generation_id: string
          id?: string
          instruction: string
          mode: string
          result_generation_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          generation_id?: string
          id?: string
          instruction?: string
          mode?: string
          result_generation_id?: string | null
        }
        Relationships: []
      }
      spaces: {
        Row: {
          id: string
          name_ar: string | null
          name_en: string | null
          project_id: string
          requirements: Json
          sort_order: number
          status: Database["public"]["Enums"]["artifact_status"]
          type: string
        }
        Insert: {
          id?: string
          name_ar?: string | null
          name_en?: string | null
          project_id: string
          requirements?: Json
          sort_order?: number
          status?: Database["public"]["Enums"]["artifact_status"]
          type: string
        }
        Update: {
          id?: string
          name_ar?: string | null
          name_en?: string | null
          project_id?: string
          requirements?: Json
          sort_order?: number
          status?: Database["public"]["Enums"]["artifact_status"]
          type?: string
        }
        Relationships: []
      }
      visual_dna: {
        Row: {
          data: Json
          id: string
          project_id: string
          status: Database["public"]["Enums"]["artifact_status"]
          updated_at: string
          version: number
        }
        Insert: {
          data?: Json
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["artifact_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          data?: Json
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["artifact_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_has_project_role: {
        Args: {
          p_project: string
          p_roles: Database["public"]["Enums"]["project_role"][]
        }
        Returns: boolean
      }
      auth_is_admin: { Args: Record<string, never>; Returns: boolean }
      auth_is_project_member: { Args: { p_project: string }; Returns: boolean }
      auth_is_staff: { Args: Record<string, never>; Returns: boolean }
      auth_shares_project: { Args: { p_user: string }; Returns: boolean }
      claim_next_job: {
        Args: Record<string, never>
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "client"
      artifact_status:
        | "draft"
        | "internal_review"
        | "revision_required"
        | "approved"
        | "client_review"
        | "client_revision"
        | "final"
      confidence_level: "green" | "amber" | "red"
      field_status: "unconfirmed" | "confirmed" | "filled"
      gate_status: "pending" | "approved" | "rejected"
      job_status: "queued" | "running" | "succeeded" | "failed"
      job_type:
        | "extract"
        | "outline"
        | "block_generate"
        | "dossier_render"
        | "strategy"
        | "moodboard"
        | "visual_dna"
        | "space_plan"
        | "image_generate"
        | "image_revise"
        | "qa_check"
        | "presentation_build"
        | "presentation_render"
      project_role:
        | "creative_director"
        | "art_director"
        | "designer_3d"
        | "graphic_designer"
        | "project_manager"
        | "lead"
        | "approver"
        | "member"
        | "viewer"
        | "client_viewer"
      project_status:
        | "draft"
        | "extracting"
        | "awaiting_data"
        | "brief_approved"
        | "in_strategy"
        | "in_outline"
        | "in_moodboard"
        | "in_visual_dna"
        | "in_spatial"
        | "in_visualization"
        | "in_review"
        | "in_revision"
        | "approved"
        | "presentation_ready"
        | "delivered"
      project_type: "tender" | "pitch" | "hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Named enum aliases used across the app ─────────────────────────────────
export type AppRole = Database["public"]["Enums"]["app_role"]
export type ProjectType = Database["public"]["Enums"]["project_type"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]
export type ProjectRole = Database["public"]["Enums"]["project_role"]
export type ConfidenceLevel = Database["public"]["Enums"]["confidence_level"]
export type FieldStatus = Database["public"]["Enums"]["field_status"]
export type GateStatus = Database["public"]["Enums"]["gate_status"]
export type ArtifactStatus = Database["public"]["Enums"]["artifact_status"]
