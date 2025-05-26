export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description?: string
          schematic_data?: Json
          created_at: string
          updated_at: string
          status: 'active' | 'archived' | 'draft'
          component_count: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          schematic_data?: Json
          created_at?: string
          updated_at?: string
          status?: 'active' | 'archived' | 'draft'
          component_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          schematic_data?: Json
          created_at?: string
          updated_at?: string
          status?: 'active' | 'archived' | 'draft'
          component_count?: number
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
      [_ in never]: never
    }
  }
}
