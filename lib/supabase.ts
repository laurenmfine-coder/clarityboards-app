import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Single shared browser client instance — avoids "Multiple GoTrueClient" warning
let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// Proxy so all existing `supabase.xxx` calls work unchanged
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export type Board = 'event' | 'study' | 'activity' | 'career' | 'task' | 'meal' | 'travel' | 'wishlist'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  due_date?: string | null
  attachments?: { name: string; url: string; type: string }[]
}

// Sprint 1: archived checklist items retain full history
export interface ArchivedChecklistItem {
  id: string
  text: string
  done: boolean          // always true at archive time
  archived_at: string    // ISO timestamp
}

export interface Item {
  id: string
  user_id: string
  board: Board
  title: string
  date: string | null
  notes: string | null
  status: string
  checklist: ChecklistItem[]
  checklist_archive: ArchivedChecklistItem[]   // Sprint 1
  created_at: string
}
