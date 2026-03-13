import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// Proxy object so existing `supabase.xxx` calls still work
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

export type Board = 'meal' | 'event' | 'study' | 'activity' | 'career' | 'task'

export interface Item {
  id: string
  user_id: string
  board: Board
  title: string
  date: string | null
  notes: string | null
  status: string
  checklist: ChecklistItem[]
  created_at: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}
