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
      topic_sessions: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          topic_name: string
          total_time_seconds: number | null
          last_accessed: string | null
          completed_subtopics: string[] | null
          is_active: boolean | null
          message_count: number | null
          created_at: string
          updated_at: string
          active_subtopic: string | null
          attempted_problems: number | null
          correct_problems: number | null
          hints_used: number | null
          exam_style_attempts: number | null
          exam_style_correct: number | null
          mastery_level: string | null
          common_mistakes: Json | null
          strength_areas: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          topic_name: string
          total_time_seconds?: number | null
          last_accessed?: string | null
          completed_subtopics?: string[] | null
          is_active?: boolean | null
          message_count?: number | null
          created_at?: string
          updated_at?: string
          active_subtopic?: string | null
          attempted_problems?: number | null
          correct_problems?: number | null
          hints_used?: number | null
          exam_style_attempts?: number | null
          exam_style_correct?: number | null
          mastery_level?: string | null
          common_mistakes?: Json | null
          strength_areas?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          topic_name?: string
          total_time_seconds?: number | null
          last_accessed?: string | null
          completed_subtopics?: string[] | null
          is_active?: boolean | null
          message_count?: number | null
          created_at?: string
          updated_at?: string
          active_subtopic?: string | null
          attempted_problems?: number | null
          correct_problems?: number | null
          hints_used?: number | null
          exam_style_attempts?: number | null
          exam_style_correct?: number | null
          mastery_level?: string | null
          common_mistakes?: Json | null
          strength_areas?: Json | null
        }
        Relationships: []
      }
      lesson_states: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          subtopic: string
          current_stage: string
          prior_knowledge_level: string | null
          mistakes_made: Json | null
          checks_completed: number | null
          checks_total: number | null
          time_spent_seconds: number | null
          completed: boolean | null
          started_at: string | null
          updated_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          subtopic: string
          current_stage: string
          prior_knowledge_level?: string | null
          mistakes_made?: Json | null
          checks_completed?: number | null
          checks_total?: number | null
          time_spent_seconds?: number | null
          completed?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          subtopic?: string
          current_stage?: string
          prior_knowledge_level?: string | null
          mistakes_made?: Json | null
          checks_completed?: number | null
          checks_total?: number | null
          time_spent_seconds?: number | null
          completed?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
