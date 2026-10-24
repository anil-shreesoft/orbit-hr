'use client'

import { useState } from 'react'
import { Bell, CheckCircle2, Info, Menu, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, TODAY, type TabId } from '@/lib/hrms-data'
import { HRMSProvider, useHRMS } from './hrms-context'
import { NAV_ITEMS, Sidebar } from './sidebar'
import { Avatar } from './ui'
import { DashboardView } from './dashboard-view'
import { EmployeesView } from './employees-view'
import { AttendanceView } from './attendance-view'
import { LeaveView } from './leave-view'
import { PayrollView } from './payroll-view'
import { AnalyticsView } from './analytics-view'
import { SettingsView } from './settings-view'

const SUBTITLES: Record<TabId, string> = {
  dashboard: 'Snapshot of your workforce today',
  employees: 'Manage your employee directory and compensation',
  attendance: 'Mark daily attendance and track clock-ins',
  leave: 'Review and manage leave requests',
  payroll: 'Calculate statutory deductions and generate payslips',
  analytics: 'Workforce and payroll insights',
  settings: 'Company profile and payroll configuration',
}

export function AppShell() {
  return (
    <HRMSProvider>
      <Shell />
    </HRMSProvider>
  )
}

function Shell() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { leaves, settings } = useHRMS()
  const pending = leaves.filter((l) => l.status === 'Pending').length
  const current = NAV_ITEMS.find((n) => n.id === tab)!

  const selectTab = (next: TabId) => {
    setTab(next)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        active={tab}
        onSelect={selectTab}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        pendingLeaves={pending}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">{current.label}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{SUBTITLES[tab]}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline-block">
              {formatDate(TODAY)}
            </span>
            <button
              type="button"
              onClick={() => selectTab('leave')}
              className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-[18px]" />
              {pending > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500" />}
              <span className="sr-only">{pending} pending leave requests</span>
            </button>
            <div className="flex items-center gap-2 border-l pl-3">
              <Avatar name="Neha Kapoor" className="bg-primary text-primary-foreground" />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">Neha Kapoor</p>
                <p className="max-w-40 truncate text-xs text-muted-foreground">{settings.companyName}</p>
              </div>
            </div>
          </div>
        </header>

        <main key={tab} className="flex-1 p-4 animate-in fade-in slide-in-from-bottom-1 duration-300 sm:p-6">
          {tab === 'dashboard' && <DashboardView onNavigate={selectTab} />}
          {tab === 'employees' && <EmployeesView />}
          {tab === 'attendance' && <AttendanceView />}
          {tab === 'leave' && <LeaveView />}
          {tab === 'payroll' && <PayrollView />}
          {tab === 'analytics' && <AnalyticsView />}
          {tab === 'settings' && <SettingsView />}
        </main>
      </div>

      <Toaster />
    </div>
  )
}

function Toaster() {
  const { toasts, dismissToast } = useHRMS()
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? XCircle : Info
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <Icon
              className={cn(
                'size-5 shrink-0',
                t.tone === 'success' && 'text-emerald-600',
                t.tone === 'error' && 'text-red-600',
                t.tone === 'info' && 'text-primary',
              )}
            />
            <span className="flex-1">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}
