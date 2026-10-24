'use client'

import { cn } from '@/lib/utils'
import { calculatePayroll, DEPARTMENTS, formatINR, MONTHLY_PAYROLL_TREND, type LeaveType } from '@/lib/hrms-data'
import { getTodayStats } from './dashboard-view'
import { useHRMS } from './hrms-context'
import { Card, CardHeader } from './ui'

const LEAVE_COLORS: Record<LeaveType, string> = { Paid: 'bg-chart-1', Casual: 'bg-chart-2', Sick: 'bg-chart-4' }

export function AnalyticsView() {
  const { employees, attendance, leaves, settings } = useHRMS()
  const active = employees.filter((e) => e.status === 'Active')
  const stats = getTodayStats(employees, attendance)

  const byDept = DEPARTMENTS.map((d) => {
    const members = active.filter((e) => e.department === d)
    const cost = members.reduce((s, e) => s + calculatePayroll(e.basic, e.hra, settings).gross, 0)
    return { dept: d, count: members.length, cost }
  })
  const maxCount = Math.max(1, ...byDept.map((d) => d.count))
  const maxCost = Math.max(1, ...byDept.map((d) => d.cost))
  const totalCost = byDept.reduce((s, d) => s + d.cost, 0)

  const leaveByType = (['Paid', 'Casual', 'Sick'] as LeaveType[]).map((t) => ({
    type: t,
    count: leaves.filter((l) => l.type === t).length,
  }))
  const totalLeaves = Math.max(1, leaveByType.reduce((s, l) => s + l.count, 0))
  const approvalRate = leaves.length
    ? (leaves.filter((l) => l.status === 'Approved').length / Math.max(1, leaves.filter((l) => l.status !== 'Pending').length)) * 100
    : 0

  const trendMax = Math.max(...MONTHLY_PAYROLL_TREND.map((m) => m.amount))
  const avgSalary = active.length ? totalCost / active.length : 0

  const kpis = [
    { label: 'Avg. gross salary', value: formatINR(avgSalary) },
    { label: 'Monthly gross (directory)', value: formatINR(totalCost) },
    { label: 'Leave approval rate', value: `${approvalRate.toFixed(0)}%` },
    { label: 'Attendance rate today', value: `${stats.rate.toFixed(1)}%` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Headcount by Department" description="Active employees in directory" />
          <ul className="flex flex-col gap-4 p-5">
            {byDept.map((d) => (
              <li key={d.dept}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{d.dept}</span>
                  <span className="font-medium tabular-nums">{d.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Payroll Cost by Department" description="Monthly gross salary" />
          <ul className="flex flex-col gap-4 p-5">
            {byDept.map((d) => (
              <li key={d.dept}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{d.dept}</span>
                  <span className="font-medium tabular-nums">{formatINR(d.cost)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-chart-2 transition-all duration-700" style={{ width: `${(d.cost / maxCost) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Company Payroll Trend" description="Total monthly payout, ₹ lakh" />
          <div className="flex h-56 items-end gap-4 p-5" role="img" aria-label="Payroll trend bar chart">
            {MONTHLY_PAYROLL_TREND.map((m, i) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium tabular-nums">{m.amount}</span>
                <div
                  className={cn(
                    'w-full max-w-10 rounded-t-md transition-all duration-700',
                    i === MONTHLY_PAYROLL_TREND.length - 1 ? 'bg-primary' : 'bg-chart-2/60',
                  )}
                  style={{ height: `${(m.amount / trendMax) * 80}%` }}
                />
                <span className="text-xs text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Leave Mix" description="All requests by leave type" />
          <div className="p-5">
            <div className="flex h-4 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              {leaveByType.map((l) => (
                <div key={l.type} className={cn(LEAVE_COLORS[l.type], 'transition-all duration-700')} style={{ width: `${(l.count / totalLeaves) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {leaveByType.map((l) => (
                <li key={l.type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn('size-3 rounded-sm', LEAVE_COLORS[l.type])} aria-hidden="true" />
                    {l.type} leave
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {l.count} · {((l.count / totalLeaves) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
