'use client'

import {
  BarChart3,
  CalendarCheck,
  CalendarOff,
  ChevronsLeft,
  ChevronsRight,
  IndianRupee,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabId } from '@/lib/hrms-data'

export const NAV_ITEMS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employee Management', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'leave', label: 'Leave Management', icon: CalendarOff },
  { id: 'payroll', label: 'Payroll', icon: IndianRupee },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  active: TabId
  onSelect: (tab: TabId) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  pendingLeaves: number
}

export function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  pendingLeaves,
}: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-[72px]',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
            PD
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-semibold text-white">PeopleDesk</p>
            <p className="truncate text-xs text-sidebar-foreground/70">HRMS &amp; Payroll</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="size-5" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p
            className={cn(
              'mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50',
              collapsed && 'lg:sr-only',
            )}
          >
            Workspace
          </p>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      collapsed && 'lg:justify-center lg:px-0',
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                    <span className={cn('truncate', collapsed && 'lg:sr-only')}>{item.label}</span>
                    {item.id === 'leave' && pendingLeaves > 0 && (
                      <span
                        className={cn(
                          'ml-auto rounded-full bg-amber-400 px-1.5 text-[11px] font-semibold text-slate-900',
                          collapsed && 'lg:absolute lg:right-1.5 lg:top-1 lg:ml-0',
                        )}
                      >
                        {pendingLeaves}
                        <span className="sr-only"> pending</span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-white lg:flex',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
            <span className={cn(collapsed && 'sr-only')}>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
