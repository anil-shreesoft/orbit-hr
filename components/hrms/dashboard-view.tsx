'use client'

import {
  ArrowRight,
  CalendarCheck,
  CalendarOff,
  IndianRupee,
  Settings,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  calculatePayroll,
  formatDate,
  formatINR,
  TODAY,
  UNLISTED_WORKFORCE,
  WEEKLY_ATTENDANCE,
  type Activity,
  type AttendanceLog,
  type Employee,
  type TabId,
} from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Avatar, Badge, Card, CardHeader } from './ui'

export function getTodayStats(employees: Employee[], attendance: AttendanceLog) {
  const active = employees.filter((e) => e.status === 'Active')
  const today = attendance[TODAY] ?? {}
  let present = 0
  let onLeave = 0
  let absent = 0
  for (const e of active) {
    const s = today[e.id]?.status
    if (s === 'present' || s === 'late' || s === 'half-day') present++
    else if (s === 'leave') onLeave++
    else if (s === 'absent') absent++
  }
  const total = UNLISTED_WORKFORCE.total + active.length
  const presentTotal = UNLISTED_WORKFORCE.present + present
  const leaveTotal = UNLISTED_WORKFORCE.onLeave + onLeave
  return {
    total,
    present: presentTotal,
    onLeave: leaveTotal,
    absent: Math.max(0, total - presentTotal - leaveTotal),
    rate: total ? (presentTotal / total) * 100 : 0,
    directoryAbsent: absent,
  }
}

const activityIcon: Record<Activity['kind'], typeof Users> = {
  employee: UserPlus,
  attendance: CalendarCheck,
  leave: CalendarOff,
  payroll: IndianRupee,
  settings: Settings,
}

const activityTone: Record<Activity['kind'], string> = {
  employee: 'bg-blue-50 text-blue-700',
  attendance: 'bg-emerald-50 text-emerald-700',
  leave: 'bg-amber-50 text-amber-700',
  payroll: 'bg-indigo-50 text-indigo-700',
  settings: 'bg-slate-100 text-slate-600',
}

export function DashboardView({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { employees, attendance, activities, leaves, settings, employeeById } = useHRMS()
  const stats = getTodayStats(employees, attendance)
  const pending = leaves.filter((l) => l.status === 'Pending')

  const chartData = [
    ...WEEKLY_ATTENDANCE,
    { day: 'Today', present: stats.present, absent: stats.absent, leave: stats.onLeave },
  ]
  const chartMax = Math.max(...chartData.map((d) => d.present + d.absent + d.leave))

  const monthlyNet = employees
    .filter((e) => e.status === 'Active')
    .reduce((sum, e) => sum + calculatePayroll(e.basic, e.hra, settings).net, 0)

  const metrics = [
    { label: 'Total Employees', value: stats.total.toString(), note: `${employees.length} in directory`, icon: Users, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Present Today', value: stats.present.toString(), note: `${stats.absent} absent`, icon: UserCheck, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'On Leave', value: stats.onLeave.toString(), note: `${pending.length} requests pending`, icon: CalendarOff, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Present Rate', value: `${stats.rate.toFixed(1)}%`, note: '+1.2% vs last week', icon: TrendingUp, tone: 'bg-indigo-50 text-indigo-700' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label} className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{m.value}</p>
                </div>
                <span className={cn('flex size-10 items-center justify-center rounded-lg', m.tone)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{m.note}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Attendance Overview"
            description="Last 7 working days across the company"
            action={
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Legend color="bg-chart-1" label="Present" />
                <Legend color="bg-chart-4" label="On leave" />
                <Legend color="bg-chart-5" label="Absent" />
              </div>
            }
          />
          <div className="px-5 pb-5 pt-6">
            <div className="flex h-64 items-end gap-3 sm:gap-5" role="img" aria-label="Stacked bar chart of daily attendance">
              {chartData.map((d) => {
                const total = d.present + d.absent + d.leave
                const isToday = d.day === 'Today'
                return (
                  <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-medium text-muted-foreground opacity-0 transition group-hover:opacity-100">
                      {d.present}
                    </span>
                    <div
                      className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-md transition-all duration-500"
                      style={{ height: `${(total / chartMax) * 85}%` }}
                    >
                      <div className={cn('bg-chart-1 transition', isToday && 'bg-primary')} style={{ flex: d.present }} />
                      <div className="bg-chart-4" style={{ flex: d.leave }} />
                      <div className="bg-chart-5" style={{ flex: d.absent }} />
                    </div>
                    <span className={cn('text-xs', isToday ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                      {d.day}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Recent Activities" description="Live feed of HR actions" />
          <ul className="max-h-[320px] flex-1 divide-y overflow-y-auto">
            {activities.slice(0, 8).map((a) => {
              const Icon = activityIcon[a.kind]
              return (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3 animate-in fade-in">
                  <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg', activityTone[a.kind])}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{a.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Pending Leave Approvals"
            description="Requests awaiting your action"
            action={
              <Button variant="outline" size="sm" onClick={() => onNavigate('leave')}>
                Review all <ArrowRight />
              </Button>
            }
          />
          <ul className="divide-y">
            {pending.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">All caught up — no pending requests.</li>
            )}
            {pending.slice(0, 4).map((l) => {
              const emp = employeeById(l.employeeId)
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={emp?.name ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{emp?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(l.startDate)} – {formatDate(l.endDate)}
                    </p>
                  </div>
                  <Badge tone="blue">{l.type}</Badge>
                  <Badge tone="amber">Pending</Badge>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="flex flex-col justify-between bg-primary p-5 text-primary-foreground">
          <div>
            <p className="text-sm text-primary-foreground/80">Estimated net payroll · Oct 2026</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{formatINR(monthlyNet)}</p>
            <p className="mt-1 text-xs text-primary-foreground/75">
              Directory employees, after PF ({settings.pfRate}%) and PT deductions
            </p>
          </div>
          <Button
            variant="secondary"
            className="mt-6 h-9 w-full bg-white text-primary hover:bg-white/90"
            onClick={() => onNavigate('payroll')}
          >
            Run payroll <ArrowRight />
          </Button>
        </Card>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-sm', color)} aria-hidden="true" />
      {label}
    </span>
  )
}
