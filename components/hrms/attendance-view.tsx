'use client'

import { useEffect, useState } from 'react'
import { CheckCheck, Clock, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate, nowHHMM, TODAY, type AttendanceStatus } from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Avatar, Badge, Card, CardHeader, EmptyRow, Field, inputClass, SearchInput, tdClass, thClass, type BadgeTone } from './ui'

const MARK_OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: 'present', label: 'Present', active: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'absent', label: 'Absent', active: 'bg-red-600 text-white border-red-600' },
  { value: 'half-day', label: 'Half-Day', active: 'bg-indigo-600 text-white border-indigo-600' },
  { value: 'late', label: 'Late', active: 'bg-amber-500 text-white border-amber-500' },
]

export const STATUS_META: Record<AttendanceStatus, { label: string; tone: BadgeTone }> = {
  present: { label: 'Present', tone: 'green' },
  absent: { label: 'Absent', tone: 'red' },
  'half-day': { label: 'Half-Day', tone: 'violet' },
  late: { label: 'Late', tone: 'amber' },
  leave: { label: 'On Leave', tone: 'blue' },
  unmarked: { label: 'Unmarked', tone: 'gray' },
}

export function AttendanceView() {
  const { employees, attendance, setAttendance, settings, notify } = useHRMS()
  const [date, setDate] = useState(TODAY)
  const [query, setQuery] = useState('')
  const activeEmployees = employees.filter((e) => e.status === 'Active')
  const day = attendance[date] ?? {}
  const q = query.trim().toLowerCase()
  const rows = activeEmployees.filter((e) => !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))

  const counts = activeEmployees.reduce<Record<AttendanceStatus, number>>(
    (acc, e) => {
      acc[day[e.id]?.status ?? 'unmarked']++
      return acc
    },
    { present: 0, absent: 0, 'half-day': 0, late: 0, leave: 0, unmarked: 0 },
  )

  const markAllPresent = () => {
    let changed = 0
    for (const e of activeEmployees) {
      const s = day[e.id]?.status ?? 'unmarked'
      if (s === 'unmarked') {
        setAttendance(date, e.id, { status: 'present' })
        changed++
      }
    }
    notify(changed ? `Marked ${changed} unmarked employees present` : 'Everyone is already marked', changed ? 'success' : 'info')
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-6 xl:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(STATUS_META) as AttendanceStatus[]).map((s) => (
            <Card key={s} className="px-4 py-3">
              <p className="text-xs text-muted-foreground">{STATUS_META[s].label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{counts[s]}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Daily Attendance</h2>
              <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput value={query} onChange={setQuery} placeholder="Search employee…" label="Search employee" className="sm:w-52" />
              <input
                type="date"
                aria-label="Attendance date"
                value={date}
                max={TODAY}
                onChange={(e) => setDate(e.target.value || TODAY)}
                className={cn(inputClass, 'sm:w-40')}
              />
              <Button variant="outline" className="h-9" onClick={markAllPresent}>
                <CheckCheck /> Mark unmarked present
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className={thClass}>Employee</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>In / Out</th>
                  <th className={cn(thClass, 'text-right')}>Mark attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 && <EmptyRow colSpan={4} message="No employees found." />}
                {rows.map((e) => {
                  const entry = day[e.id] ?? { status: 'unmarked' as const }
                  const meta = STATUS_META[entry.status]
                  return (
                    <tr key={e.id} className="transition hover:bg-muted/40">
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <Avatar name={e.name} />
                          <div>
                            <p className="font-medium">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className={cn(tdClass, 'font-mono text-xs text-muted-foreground')}>
                        {entry.clockIn ?? '--:--'} / {entry.clockOut ?? '--:--'}
                      </td>
                      <td className={cn(tdClass, 'text-right')}>
                        <div className="inline-flex gap-1" role="group" aria-label={`Mark ${e.name}`}>
                          {MARK_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={entry.status === opt.value}
                              onClick={() => setAttendance(date, e.id, { status: opt.value })}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-xs font-medium transition active:scale-95',
                                entry.status === opt.value
                                  ? opt.active
                                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
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

      <ClockSimulator officeStart={settings.officeStart} />
    </div>
  )
}

function ClockSimulator({ officeStart }: { officeStart: string }) {
  const { employees, attendance, setAttendance, notify } = useHRMS()
  const active = employees.filter((e) => e.status === 'Active')
  const [employeeId, setEmployeeId] = useState(active[0]?.id ?? '')
  const [clock, setClock] = useState<string | null>(null)

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const emp = active.find((e) => e.id === employeeId)
  const entry = attendance[TODAY]?.[employeeId]
  const clockedIn = !!entry?.clockIn && !entry?.clockOut

  const clockIn = () => {
    if (!emp) return
    const time = nowHHMM()
    const status = time > officeStart ? 'late' : 'present'
    setAttendance(TODAY, emp.id, { status, clockIn: time, clockOut: undefined }, `${emp.name} clocked in at ${time}`)
    notify(`${emp.name} clocked in${status === 'late' ? ' (late)' : ''}`)
  }

  const clockOut = () => {
    if (!emp) return
    const time = nowHHMM()
    setAttendance(TODAY, emp.id, { clockOut: time }, `${emp.name} clocked out at ${time}`)
    notify(`${emp.name} clocked out at ${time}`)
  }

  return (
    <Card className="h-fit">
      <CardHeader title="Clock In / Clock Out" description="Simulate a biometric punch for today" />
      <div className="flex flex-col gap-5 p-5">
        <div className="rounded-xl bg-gradient-to-br from-primary to-blue-800 p-5 text-center text-primary-foreground">
          <Clock className="mx-auto size-6 opacity-80" aria-hidden="true" />
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums" aria-live="off">
            {clock ?? '--:--:--'}
          </p>
          <p className="mt-1 text-xs text-primary-foreground/75">
            {formatDate(TODAY)} · Shift starts {officeStart}
          </p>
        </div>

        <Field label="Employee" htmlFor="clock-emp">
          <select id="clock-emp" className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {active.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code})
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge tone={STATUS_META[entry?.status ?? 'unmarked'].tone}>{STATUS_META[entry?.status ?? 'unmarked'].label}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">Clock in</span>
            <span className="font-mono">{entry?.clockIn ?? '--:--'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Clock out</span>
            <span className="font-mono">{entry?.clockOut ?? '--:--'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button className="h-10" onClick={clockIn} disabled={!emp || clockedIn}>
            <LogIn /> Clock In
          </Button>
          <Button variant="outline" className="h-10" onClick={clockOut} disabled={!emp || !clockedIn}>
            <LogOut /> Clock Out
          </Button>
        </div>
      </div>
    </Card>
  )
}
