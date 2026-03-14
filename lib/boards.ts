import { Board } from './supabase'

export interface BoardConfig {
  id: Board
  label: string
  letter: string
  color: string
  bg: string
  lightBg: string
  tagline: string
  statuses: { value: string; label: string }[]
}

export const BOARDS: BoardConfig[] = [
  { id: "meal", label: "MealBoard", letter: "M", color: "#C0392B", bg: "#C0392B", lightBg: "#FDEDEC", tagline: "Meal planning, recipes & grocery prep", statuses: [{ value: "planned", label: "Planned" }, { value: "prepped", label: "Prepped" }, { value: "cooked", label: "Cooked" }, { value: "done", label: "Done" }] },
  { id: "event", label: "EventBoard", letter: "E", color: "#1B4F8A", bg: "#1B4F8A", lightBg: "#EBF3FB", tagline: "Milestone celebrations, invitations & RSVPs", statuses: [{ value: "rsvp-needed", label: "RSVP Needed" }, { value: "accepted", label: "Accepted" }, { value: "declined", label: "Declined" }, { value: "done", label: "Done" }] },
  { id: "study", label: "StudyBoard", letter: "S", color: "#2E9E8F", bg: "#2E9E8F", lightBg: "#E8F8F6", tagline: "Assignments, due dates & progress", statuses: [{ value: "todo", label: "Not Started" }, { value: "in-progress", label: "In Progress" }, { value: "submitted", label: "Submitted" }, { value: "done", label: "Done" }] },
  { id: "activity", label: "ActivityBoard", letter: "A", color: "#E67E22", bg: "#E67E22", lightBg: "#FEF3E8", tagline: "Kids sports, dance & activity logistics", statuses: [{ value: "todo", label: "To Do" }, { value: "in-progress", label: "In Progress" }, { value: "done", label: "Done" }] },
  { id: "career", label: "WorkBoard", letter: "C", color: "#8E44AD", bg: "#8E44AD", lightBg: "#F5EEF8", tagline: "Clients, projects, career & professional goals", statuses: [{ value: "todo", label: "To Do" }, { value: "in-progress", label: "In Progress" }, { value: "applied", label: "Applied" }, { value: "done", label: "Done" }] },
  { id: "task", label: "TaskBoard", letter: "T", color: "#27AE60", bg: "#27AE60", lightBg: "#EAFAF1", tagline: "Projects, to-dos & personal deadlines", statuses: [{ value: "todo", label: "To Do" }, { value: "in-progress", label: "In Progress" }, { value: "done", label: "Done" }] },
  { id: "travel", label: "TravelBoard", letter: "V", color: "#2C6E8A", bg: "#2C6E8A", lightBg: "#EAF4F8", tagline: "Trips, itineraries & places to discover", statuses: [{ value: "want-to-go", label: "Want to Go" }, { value: "planning", label: "Planning" }, { value: "booked", label: "Booked" }, { value: "done", label: "Done" }] },
  { id: "wishlist", label: "WishlistBoard", letter: "W", color: "#9B6B9E", bg: "#9B6B9E", lightBg: "#F5EDF6", tagline: "Birthday, registry & shopping wish lists", statuses: [{ value: "want", label: "Want" }, { value: "purchased", label: "Purchased" }, { value: "received", label: "Received" }] },
]

export const BOARD_MAP = Object.fromEntries(BOARDS.map(b => [b.id, b])) as Record<Board, BoardConfig>
