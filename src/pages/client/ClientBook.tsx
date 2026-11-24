import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight, Search } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from '@/components/ui'
import { useMyAppointments } from './data'

import { shopCode } from './shopLink'

export default function ClientBook() {
  const { data: appts, isLoading, error, refetch } = useMyAppointments()
  const nav = useNavigate()
  const [slug, setSlug] = useState('')
  const [invalid, setInvalid] = useState(false)
  const shops = [...new Map((appts ?? []).map((a) => [a.shop_id, a])).values()]
  return (
    <div className="space-y-5">
      <h1 className="display text-[40px] leading-none">Book a cut</h1>
      {isLoading ? <Skeleton className="h-24" /> : error ? <ErrorState error={error} retry={refetch} /> : shops.length ? (
        <div className="space-y-2">
          {shops.map((s) => (
            <Link key={s.shop_id} className="block" to={`/shop/${s.shop_slug}/book`}>
              <Card className="flex items-center gap-3 p-4 transition hover:border-accent">
                <span className="size-3 rounded-full" style={{ background: s.accent_color }} />
                <div className="flex-1 font-semibold">{s.shop_name}</div>
                <ChevronRight className="size-5 text-faint" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card><EmptyState title="Your shops appear here" body="After your first booking, your barbershop shows up here for one-tap booking." /></Card>
      )}
      <form className="space-y-2 rounded-xl border border-line bg-surface p-4" onSubmit={(event) => {
        event.preventDefault()
        const code = shopCode(slug)
        if (code) nav(`/shop/${code}`)
        else setInvalid(true)
      }}>
        <label htmlFor="shop-link" className="text-sm font-semibold">Shop link or code</label>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-40 flex-1">
            <Input id="shop-link" leading={<Search className="size-4" />} placeholder="e.g. fade-factory" value={slug}
              aria-invalid={invalid} aria-describedby={invalid ? 'shop-link-error' : undefined}
              onChange={(event) => { setSlug(event.target.value); setInvalid(false) }} />
          </div>
          <Button type="submit" variant="secondary">Open shop</Button>
        </div>
        {invalid && <p id="shop-link-error" role="alert" className="text-sm text-danger">Paste your shop’s booking link or enter its code, such as fade-factory.</p>}
      </form>
    </div>
  )
}
