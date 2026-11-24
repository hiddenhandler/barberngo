import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Contact, CreditCard, Layers, Plus, Search, User, ArrowRight } from 'lucide-react'
import { rpc } from '@/lib/supabase'
import { useWorkspace } from '@/lib/auth'
import { cx, KeyHint, Spinner } from './ui'

interface Result {
  type: 'client' | 'barber' | 'service' | 'appointment' | 'payment' | 'action'
  id: string
  title: string
  subtitle?: string
  appointment_id?: string
  to?: string
}

const ICONS = { client: User, barber: Contact, service: Layers, appointment: CalendarDays, payment: CreditCard, action: ArrowRight }

export function CommandPalette({ open, onClose, destinations }: { destinations: { to: string; label: string }[]; open: boolean; onClose: () => void }) {
  const { ws } = useWorkspace()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [idx, setIdx] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 160)
    return () => clearTimeout(t)
  }, [q])
  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setDebounced('')
      const element = dialog.current
      element?.showModal()
      input.current?.focus()
      return () => element?.close()
    }
  }, [open])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', ws.shop_id, debounced],
    enabled: open && debounced.trim().length >= 2,
    queryFn: () => rpc<Result[]>('global_search', { p_shop_id: ws.shop_id, p_query: debounced }),
  })

  const query = q.trim().toLowerCase()
  const shortcuts: Result[] = [
    { type: 'action', id: 'new-appt', title: 'New appointment', to: '/app/calendar?new=1' },
    ...(destinations.some((item) => item.to === '/app/walk-ins')
      ? [{ type: 'action' as const, id: 'walkin', title: 'Add walk-in', to: '/app/walk-ins?add=1' }]
      : []),
    ...destinations.map(({ to, label }) => ({ type: 'action' as const, id: to, title: label, to })),
    { type: 'action', id: 'public', title: 'View public booking page', to: `/shop/${ws.shop_slug}` },
  ]
  const actions = shortcuts.filter((action) => action.title.toLowerCase().includes(query))
  const currentQuery = debounced.trim().toLowerCase() === query
  const results = [...(currentQuery && query.length >= 2 ? data ?? [] : []), ...actions]
  const searching = query.length >= 2 && (!currentQuery || isFetching)

  const go = (r: Result) => {
    onClose()
    if (r.to) return nav(r.to)
    switch (r.type) {
      case 'client':
        return nav(`/app/clients/${r.id}`)
      case 'barber':
        return nav(`/app/barbers/${r.id}`)
      case 'service':
        return nav('/app/services')
      case 'appointment':
        return nav(`/app/appointments/${r.id}`)
      case 'payment':
        return nav(r.appointment_id ? `/app/appointments/${r.appointment_id}` : '/app/payments')
    }
  }

  if (!open) return null
  return createPortal(
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose() }} className="fixed inset-0 m-0 flex h-dvh max-h-none w-full max-w-none items-start justify-center bg-transparent p-4 pt-[12vh] text-ink" aria-label="Search workspace">
      <div className="animate-fade absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-rise relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setIdx(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIdx((i) => Math.max(0, Math.min(results.length - 1, i + 1)))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIdx((i) => Math.max(0, i - 1))
              }
              if (e.key === 'Enter' && results[idx]) go(results[idx])
            }}
            aria-label="Search workspace"
            placeholder="Search pages, clients, phone, barbers, appointments…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          {isFetching ? <Spinner className="size-4" /> : <KeyHint>esc</KeyHint>}
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{searching ? 'Searching…' : isError && query.length >= 2 ? 'Could not search shop records. Try again.' : 'No matches'}</li>}
          {results.map((r, i) => {
            const Icon = r.type === 'action' && r.id === 'new-appt' ? Plus : ICONS[r.type]
            return (
              <li key={`${r.type}-${r.id}`}>
                <button
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(r)}
                  className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', i === idx && 'bg-surface-2')}
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-muted">{r.subtitle}</span>}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-faint">{r.type}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </dialog>,
    document.body,
  )
}
