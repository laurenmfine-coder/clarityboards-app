import { Board, ChecklistItem } from './supabase'

export interface SeedItem {
  board: Board
  title: string
  date: string
  notes: string
  status: string
  checklist: ChecklistItem[]
}

// Generates seed items with dates relative to today
export function getSeedItems(): SeedItem[] {
  const d = (daysFromNow: number) => {
    const dt = new Date()
    dt.setDate(dt.getDate() + daysFromNow)
    return dt.toISOString().split('T')[0]
  }

  return [
    {
      board: 'event',
      title: "Emma's Bat Mitzvah",
      date: d(18),
      notes: 'Temple Beth Am, 123 Coral Way. Dinner reception to follow.',
      status: 'rsvp-needed',
      checklist: [
        { id: '1', text: 'RSVP by deadline', done: false },
        { id: '2', text: 'Order gift from registry', done: false },
        { id: '3', text: 'Arrange babysitter', done: false },
        { id: '4', text: 'Plan outfit', done: false },
      ],
    },
    {
      board: 'event',
      title: "Sofia's Quinceañera",
      date: d(31),
      notes: 'Weston Marriott ballroom. Black tie optional.',
      status: 'accepted',
      checklist: [
        { id: '1', text: 'RSVP confirmed', done: true },
        { id: '2', text: 'Purchase gift', done: true },
        { id: '3', text: 'Book hair appointment', done: false },
      ],
    },
    {
      board: 'event',
      title: "Jake's College Graduation",
      date: d(45),
      notes: 'University of Florida, O\'Connell Center. Parking in Lot 13.',
      status: 'rsvp-needed',
      checklist: [
        { id: '1', text: 'RSVP for tickets', done: false },
        { id: '2', text: 'Book hotel', done: false },
        { id: '3', text: 'Plan lunch reservation after', done: false },
      ],
    },
    {
      board: 'study',
      title: 'AP History Essay — WWI Causes',
      date: d(5),
      notes: '8–10 pages, Chicago citation style. Submit via Turnitin.',
      status: 'in-progress',
      checklist: [
        { id: '1', text: 'Gather sources (min 6)', done: true },
        { id: '2', text: 'Create outline', done: true },
        { id: '3', text: 'Draft introduction', done: true },
        { id: '4', text: 'Write body paragraphs', done: false },
        { id: '5', text: 'Write conclusion', done: false },
        { id: '6', text: 'Citations and bibliography', done: false },
        { id: '7', text: 'Proofread and submit', done: false },
      ],
    },
    {
      board: 'study',
      title: 'Chemistry Lab Report — Titration',
      date: d(9),
      notes: 'Lab partner: Alex Chen. Data from Thursday experiment.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Organize lab data', done: false },
        { id: '2', text: 'Create results graphs', done: false },
        { id: '3', text: 'Write analysis section', done: false },
        { id: '4', text: 'Complete error analysis', done: false },
      ],
    },
    {
      board: 'study',
      title: 'SAT Prep — Math Section',
      date: d(22),
      notes: 'Khan Academy modules 4–7. Practice test this weekend.',
      status: 'in-progress',
      checklist: [
        { id: '1', text: 'Complete Module 4', done: true },
        { id: '2', text: 'Complete Module 5', done: false },
        { id: '3', text: 'Take full practice test', done: false },
        { id: '4', text: 'Review missed questions', done: false },
      ],
    },
    {
      board: 'activity',
      title: 'Travel Soccer — Spring Tournament',
      date: d(12),
      notes: 'Weston Regional Park, Field 3. Two games: 9am and 12pm.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Pack uniform + cleats', done: false },
        { id: '2', text: 'Bring snacks for team (our turn)', done: false },
        { id: '3', text: 'Pay tournament registration fee', done: true },
        { id: '4', text: 'Confirm carpool with Johnson family', done: false },
      ],
    },
    {
      board: 'activity',
      title: 'Dance Recital — Spring Show',
      date: d(28),
      notes: 'Cypress Bay auditorium. Hair: high bun with hairnet. Arrive 1 hour early.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Purchase recital tickets (need 4)', done: false },
        { id: '2', text: 'Pick up costume from studio', done: true },
        { id: '3', text: 'Buy nude tights x3', done: false },
        { id: '4', text: 'Book hair appointment', done: false },
        { id: '5', text: 'Pack recital bag', done: false },
      ],
    },
    {
      board: 'activity',
      title: 'Swim Team — Championship Meet',
      date: d(20),
      notes: 'Aquatic Center, Coral Springs. All-day event. Parents may spectate.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Pack swim bag', done: false },
        { id: '2', text: 'Confirm ride with coach', done: false },
        { id: '3', text: 'Pay dues balance', done: false },
      ],
    },
    {
      board: 'career',
      title: 'Interview — Product Manager, Acme Corp',
      date: d(4),
      notes: 'Video call, 2pm EST. Contact: Sarah Mills, HR. Panel of 3.',
      status: 'in-progress',
      checklist: [
        { id: '1', text: 'Research company and recent news', done: true },
        { id: '2', text: 'Prepare 3 STAR stories', done: true },
        { id: '3', text: 'Review product metrics framework', done: false },
        { id: '4', text: 'Prepare questions for panel', done: false },
        { id: '5', text: 'Test video/audio setup', done: false },
        { id: '6', text: 'Send thank-you within 24 hours', done: false },
      ],
    },
    {
      board: 'career',
      title: 'Application — Senior PM, BrightPath',
      date: d(7),
      notes: 'Referral from David Kim. Requires cover letter and portfolio samples.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Tailor resume', done: false },
        { id: '2', text: 'Write cover letter', done: false },
        { id: '3', text: 'Select 2 portfolio samples', done: false },
        { id: '4', text: 'Submit via careers portal', done: false },
      ],
    },
    {
      board: 'task',
      title: 'Plan Summer Family Vacation',
      date: d(60),
      notes: 'Targeting last week of July. Budget: $5,000. Considering Costa Rica or Italy.',
      status: 'in-progress',
      checklist: [
        { id: '1', text: 'Narrow destination to 2 options', done: true },
        { id: '2', text: 'Research flights and costs', done: false },
        { id: '3', text: 'Check passport expiry for all family members', done: false },
        { id: '4', text: 'Book flights', done: false },
        { id: '5', text: 'Book hotels', done: false },
      ],
    },
    {
      board: 'task',
      title: 'HOA Annual Meeting Prep',
      date: d(14),
      notes: 'Weston Lakes clubhouse, 7pm. Need to submit agenda items by Friday.',
      status: 'todo',
      checklist: [
        { id: '1', text: 'Submit agenda items', done: false },
        { id: '2', text: 'Review last year\'s minutes', done: false },
        { id: '3', text: 'Prepare landscaping proposal', done: false },
      ],
    },
  ]
}
