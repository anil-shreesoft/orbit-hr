'use client'

import { useState, type FormEvent } from 'react'
import { Check, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { daysBetween, formatDate, TODAY, type LeaveStatus, type LeaveType } from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Avatar, Badge, Card, CardHeader, EmptyRow, Field, inputClass, SearchInput, tdClass, thClass, type BadgeTone } from './ui'

const LEAVE_TYPES: LeaveType[] = ['Paid', 'Casual', 'Sick']
const STATUS_TONE: Record<LeaveStatus, BadgeTone> = { Pending: 'amber', Approved: 'green', Rejected: 'red' }
const TYPE_TONE: Record<LeaveType, BadgeTone> = { Paid: 'blue', Casual: 'violet', Sick: 'gray' }
const BALANCE: Record<LeaveType, number> = { Paid: 18, Casual: 8, Sick: 10 }

export function LeaveView() {
  const { employees, leaves, applyLeave, setLeaveStatus, employeeById } = useHRMS()
  const active = employees.filter((e) => e.status === 'Active')

  const [form, setForm] = useState({
    employeeId: active[0]?.id ?? '',
    type: 'Casual' as LeaveType,
    startDate: TODAY,
    endDate: TODAY,
    reason: '',
  })
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | LeaveStatus>('All')
  const [typeFilter, setTypeFilter] = useState<'All' | LeaveType>('All')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (form.endDate < form.startDate) {
      setError('End date cannot be before start date.')
      return
    }
    setError('')
    applyLeave({ ...form, reason: form.reason.trim() })
    setForm((f) => ({ ...f, reason: '' }))
  }

  const q = query.trim().toLowerCase()
  const filtered = leaves.filter((l) => {
    const emp = employeeById(l.employeeId)
    return (
      (statusFilter === 'All' || l.status === statusFilter) &&
      (typeFilter === 'All' || l.type === typeFilter) &&
      (!q || (emp?.name.toLowerCase().includes(q) ?? false) || l.reason.toLowerCase().includes(q))
    )
  })

  const statusCounts = leaves.reduce<Record<LeaveStatus, number>>(
    (acc, l) => {
      acc[l.status]++
      return acc
    },
    { Pending: 0, Approved: 0, Rejected: 0 },
  )

  const used = (type: LeaveType) =>
    leaves
      .filter((l) => l.employeeId === form.employeeId && l.type === type && l.status === 'Approved')
      .reduce((s, l) => s + daysBetween(l.startDate, l.endDate), 0)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="h-fit">
        <CardHeader title="Apply Leave" description="Submit a request on behalf of an employee" />
        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          <Field label="Employee name" htmlFor="leave-emp">
            <select id="leave-emp" className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              {active.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium">Leave type</legend>
            <div className="grid grid-cols-3 gap-2">
              {LEAVE_TYPES.map((t) => {
                const remaining = BALANCE[t] - used(t)
                return (
                  <label
                    key={t}
                    className={cn(
                      'cursor-pointer rounded-lg border p-2.5 text-center transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/25',
                      form.type === t ? 'border-primary bg-secondary text-secondary-foreground' : 'hover:border-primary/40',
                    )}
                  >
                    <input type="radio" name="leave-type" value={t} checked={form.type === t} onChange={() => setForm({ ...form, type: t })} className="sr-only" />
                    <span className="block text-sm font-medium">{t}</span>
                    <span className="block text-[11px] text-muted-foreground">{remaining} left</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="leave-start">
              <input id="leave-start" type="date" required className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date" htmlFor="leave-end">
              <input id="leave-end" type="date" required min={form.startDate} className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          {form.startDate && form.endDate && form.endDate >= form.startDate && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Duration: <span className="font-medium text-foreground">{daysBetween(form.startDate, form.endDate)} day(s)</span>
            </p>
          )}

          <Field label="Reason" htmlFor="leave-reason">
            <textarea
              id="leave-reason"
              required
              rows={3}
              className={cn(inputClass, 'h-auto py-2')}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Brief reason for leave"
            />
          </Field>
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="h-9">
            <Send /> Submit request
          </Button>
        </form>
      </Card>

      <Card className="xl:col-span-2">
        <div className="flex flex-col gap-3 border-b px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Leave Requests</h2>
              <p className="text-xs text-muted-foreground">{filtered.length} requests shown</p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Filter by status">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition',
                    statusFilter === s ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                  {s !== 'All' && <span className="ml-1 tabular-nums opacity-70">{statusCounts[s]}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by employee or reason…" label="Search leave requests" className="sm:w-72" />
            <select aria-label="Filter by leave type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className={cn(inputClass, 'sm:w-40')}>
              <option value="All">All types</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className={thClass}>Employee</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Dates</th>
                <th className={thClass}>Reason</th>
                <th className={thClass}>Status</th>
                <th className={cn(thClass, 'text-right')}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <EmptyRow colSpan={6} message="No leave requests match your filters." />}
              {filtered.map((l) => {
                const emp = employeeById(l.employeeId)
                return (
                  <tr key={l.id} className="transition hover:bg-muted/40">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp?.name ?? '?'} />
                        <div>
                          <p className="font-medium">{emp?.name ?? 'Former employee'}</p>
                          <p className="text-xs text-muted-foreground">Applied {formatDate(l.appliedOn)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={TYPE_TONE[l.type]}>{l.type}</Badge>
                    </td>
                    <td className={tdClass}>
                      <p>
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">{daysBetween(l.startDate, l.endDate)} day(s)</p>
                    </td>
                    <td className={cn(tdClass, 'max-w-56 truncate text-muted-foreground')} title={l.reason}>
                      {l.reason}
                    </td>
                    <td className={tdClass}>
                      <span key={l.status} className="inline-block animate-in zoom-in-90 fade-in">
                        <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                      </span>
                    </td>
                    <td className={cn(tdClass, 'text-right')}>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setLeaveStatus(l.id, 'Approved')}
                          disabled={l.status === 'Approved'}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Check /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLeaveStatus(l.id, 'Rejected')}
                          disabled={l.status === 'Rejected'}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
