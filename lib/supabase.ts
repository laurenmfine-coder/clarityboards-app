import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Board = 'event' | 'study' | 'activity' | 'career' | 'task'

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
