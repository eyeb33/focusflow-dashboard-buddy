/**
 * Strongly-typed database row interfaces for mapping Supabase responses
 * These match the schema in src/integrations/supabase/types.ts
 */

import { Tables } from '@/integrations/supabase/types';

// Re-export table row types for convenience
export type TaskRow = Tables<'tasks'>;
export type FocusSessionRow = Tables<'focus_sessions'>;
export type SessionsSummaryRow = Tables<'sessions_summary'>;
export type ProfileRow = Tables<'profiles'>;
export type CoachConversationRow = Tables<'coach_conversations'>;
export type CoachMessageRow = Tables<'coach_messages'>;
export type CurriculumTopicRow = Tables<'curriculum_topics'>;
export type TopicSessionRow = Tables<'topic_sessions'>;
export type DocumentRow = Tables<'documents'>;

// Streak calculation input type
export interface StreakDay {
  date: string;
  sessions: number;
}

// Timer action tracking data
export interface TimerActionData {
  mode?: string;
  timeRemaining?: number;
  isRunning?: boolean;
  previousMode?: string;
  reason?: string;
}

// Task update payload
export interface TaskUpdatePayload {
  name?: string;
  estimated_pomodoros?: number;
  completed?: boolean;
  completed_at?: string | null;
  is_active?: boolean;
  time_spent?: number;
  time_spent_seconds?: number;
  updated_at?: string;
}

// Auth error type
export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

// Generic Supabase error type for catch blocks
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  );
}

// Helper to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (isAuthError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
