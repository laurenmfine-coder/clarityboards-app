'use client'
import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export type RecurRule = {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  interval_value: number
  day_of_week?: number | null
  end_date?: string | null
}

const FREQ_OPTIONS = [
  { value: 'none',      label: 'Does not repeat' },
  { value: 'daily',     label: 'Daily' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'yearly',    label: 'Yearly' },
  { value: 'custom',    label: 'Custom…' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  value: RecurRule | null
  onChange: (rule: RecurRule | null) => void
  color?: string
}

export default function RecurringPicker({ value, onChange, color = '#2874A6' }: Props) {
  const [open, setOpen] = useState(false)
  const freq = value?.frequency ?? 'none'

  const update = (changes: Partial<RecurRule>) => {
    if (!value) return
    onChange({ ...value, ...changes })
  }

  const handleFreqChange = (f: string) => {
    if (f === 'none') { onChange(null); return }
    onChange({
      frequency: f as RecurRule['frequency'],
      interval_value: 1,
      day_of_week: null,
      end_date: null,
    })
  }

  const label = freq === 'none' ? 'Does not repeat' : FREQ_OPTIONS.find(o => o.value === freq)?.label ?? freq

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all"
          style={value
            ? { background: color + '15', borderColor: color + '40', color }
            : { background: '#F5F2EC', borderColor: '#E8E2D9', color: '#7A6E62' }
          }
        >
          <RefreshCw size={11} />
          {label}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-[#9B8E7E] hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAFAF8] space-y-3">
          {/* Frequency */}
          <div>
            <label className="text-xs font-semibold text-[#9B8E7E] uppercase tracking-wide block mb-1.5">Repeat</label>
            <select
              value={freq}
              onChange={e => handleFreqChange(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#E8E2D9] bg-white focus:outline-none focus:border-[#2874A6] text-[#1A2B3C]"
            >
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Custom interval */}
          {freq === 'custom' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7A6E62] flex-shrink-0">Every</label>
              <input
                type="number" min={1} max={365}
                value={value?.interval_value ?? 1}
                onChange={e => update({ interval_value: parseInt(e.target.value) || 1 })}
                className="w-16 text-sm px-2 py-1.5 rounded-lg border border-[#E8E2D9] focus:outline-none focus:border-[#2874A6] text-center"
              />
              <span className="text-xs text-[#7A6E62]">days</span>
            </div>
          )}

          {/* Day of week for weekly */}
          {freq === 'weekly' && (
            <div>
              <label className="text-xs font-semibold text-[#9B8E7E] uppercase tracking-wide block mb-1.5">On</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d} type="button"
                    onClick={() => update({ day_of_week: i })}
                    className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
                    style={value?.day_of_week === i
                      ? { background: color, color: 'white' }
                      : { background: 'white', color: '#7A6E62', border: '1px solid #E8E2D9' }
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End date */}
          {freq !== 'none' && value && (
            <div>
              <label className="text-xs font-semibold text-[#9B8E7E] uppercase tracking-wide block mb-1.5">End date (optional)</label>
              <input
                type="date"
                value={value.end_date ?? ''}
                onChange={e => update({ end_date: e.target.value || null })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#E8E2D9] focus:outline-none focus:border-[#2874A6]"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: color }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
