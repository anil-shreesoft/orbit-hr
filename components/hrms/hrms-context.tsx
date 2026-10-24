'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  INITIAL_ACTIVITIES,
  INITIAL_ATTENDANCE,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVES,
  INITIAL_PAYSLIPS,
  INITIAL_SETTINGS,
  makeId,
  nowTime,
  TODAY,
  type Activity,
  type AttendanceEntry,
  type AttendanceLog,
  type Employee,
  type LeaveRequest,
  type LeaveStatus,
  type Payslip,
  type Settings,
} from '@/lib/hrms-data'

interface Toast {
  id: string
  message: string
  tone: 'success' | 'error' | 'info'
}

interface HRMSContextValue {
  employees: Employee[]
  attendance: AttendanceLog
  leaves: LeaveRequest[]
  payslips: Payslip[]
  activities: Activity[]
  settings: Settings
  toasts: Toast[]
  employeeById: (id: string) => Employee | undefined
  saveEmployee: (employee: Omit<Employee, 'id' | 'code'> & { id?: string }) => void
  toggleEmployeeStatus: (id: string) => void
  deleteEmployee: (id: string) => void
  setAttendance: (date: string, employeeId: string, entry: Partial<AttendanceEntry>, activity?: string) => void
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) => void
  setLeaveStatus: (id: string, status: LeaveStatus) => void
  addPayslip: (payslip: Omit<Payslip, 'id' | 'generatedAt'>) => Payslip
  updateSettings: (settings: Settings) => void
  notify: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
}

const HRMSContext = createContext<HRMSContextValue | null>(null)

export function HRMSProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [attendance, setAttendanceLog] = useState(INITIAL_ATTENDANCE)
  const [leaves, setLeaves] = useState(INITIAL_LEAVES)
  const [payslips, setPayslips] = useState(INITIAL_PAYSLIPS)
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES)
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [toasts, setToasts] = useState<Toast[]>([])
  const codeCounter = useRef(1013)

  const employeeRef = useRef(employees)
  employeeRef.current = employees
  const leavesRef = useRef(leaves)
  leavesRef.current = leaves
  const employeeById = useCallback((id: string) => employees.find((e) => e.id === id), [employees])

  const log = useCallback((message: string, kind: Activity['kind']) => {
    setActivities((prev) => [{ id: makeId('a'), message, time: nowTime(), kind }, ...prev].slice(0, 30))
  }, [])

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = makeId('t')
      setToasts((prev) => [...prev, { id, message, tone }])
      setTimeout(() => dismissToast(id), 3200)
    },
    [dismissToast],
  )

  const saveEmployee: HRMSContextValue['saveEmployee'] = useCallback(
    (data) => {
      if (data.id) {
        setEmployees((prev) => prev.map((e) => (e.id === data.id ? { ...e, ...data, id: e.id } : e)))
        log(`${data.name}'s profile was updated`, 'employee')
        notify(`${data.name}'s details saved`)
      } else {
        const code = `EMP-${codeCounter.current++}`
        setEmployees((prev) => [{ ...data, id: makeId('e'), code }, ...prev])
        log(`New hire ${data.name} added to ${data.department}`, 'employee')
        notify(`${data.name} added as ${code}`)
      }
    },
    [log, notify],
  )

  const toggleEmployeeStatus = useCallback(
    (id: string) => {
      const emp = employeeRef.current.find((e) => e.id === id)
      if (!emp) return
      const next = emp.status === 'Active' ? 'Inactive' : 'Active'
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: next } : e)))
      log(`${emp.name} was ${next === 'Active' ? 'reactivated' : 'deactivated'}`, 'employee')
      notify(`${emp.name} marked ${next}`, next === 'Active' ? 'success' : 'info')
    },
    [log, notify],
  )

  const deleteEmployee = useCallback(
    (id: string) => {
      const emp = employeeRef.current.find((e) => e.id === id)
      if (!emp) return
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      log(`${emp.name} was removed from the directory`, 'employee')
      notify(`${emp.name} deleted`, 'error')
    },
    [log, notify],
  )

  const setAttendance: HRMSContextValue['setAttendance'] = useCallback(
    (date, employeeId, entry, activity) => {
      setAttendanceLog((prev) => {
        const day = prev[date] ?? {}
        const current = day[employeeId] ?? { status: 'unmarked' as const }
        return { ...prev, [date]: { ...day, [employeeId]: { ...current, ...entry } } }
      })
      if (activity) log(activity, 'attendance')
    },
    [log],
  )

  const applyLeave: HRMSContextValue['applyLeave'] = useCallback(
    (leave) => {
      const emp = employeeRef.current.find((e) => e.id === leave.employeeId)
      const autoApprove = settings.autoApproveSick && leave.type === 'Sick'
      setLeaves((prev) => [
        {
          ...leave,
          id: makeId('l'),
          status: autoApprove ? 'Approved' : 'Pending',
          appliedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      log(`${emp?.name ?? 'Employee'} applied for ${leave.type} leave`, 'leave')
      notify(autoApprove ? 'Sick leave auto-approved' : 'Leave request submitted for approval')
    },
    [log, notify, settings.autoApproveSick],
  )

  const setLeaveStatus = useCallback(
    (id: string, status: LeaveStatus) => {
      const target = leavesRef.current.find((l) => l.id === id)
      if (target) {
        const emp = employeeRef.current.find((e) => e.id === target.employeeId)
        log(`${emp?.name ?? 'Employee'}'s ${target.type} leave was ${status.toLowerCase()}`, 'leave')
        if (target.startDate <= TODAY && target.endDate >= TODAY) {
          setAttendanceLog((prev) => {
            const day = prev[TODAY] ?? {}
            const currentStatus = day[target.employeeId]?.status ?? 'unmarked'
            if (status === 'Approved') {
              return { ...prev, [TODAY]: { ...day, [target.employeeId]: { status: 'leave' } } }
            }
            if (currentStatus === 'leave') {
              return { ...prev, [TODAY]: { ...day, [target.employeeId]: { status: 'unmarked' } } }
            }
            return prev
          })
        }
      }
      setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
      notify(`Leave request ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'error')
    },
    [log, notify],
  )

  const addPayslip = useCallback(
    (data: Omit<Payslip, 'id' | 'generatedAt'>) => {
      const payslip: Payslip = { ...data, id: makeId('p'), generatedAt: nowTime() }
      setPayslips((prev) => [payslip, ...prev])
      const emp = employeeRef.current.find((e) => e.id === data.employeeId)
      log(`Payslip generated for ${emp?.name ?? 'employee'} (${data.month})`, 'payroll')
      notify(`Payslip ready for ${emp?.name ?? 'employee'}`)
      return payslip
    },
    [log, notify],
  )

  const updateSettings = useCallback(
    (next: Settings) => {
      setSettings(next)
      log('Company & payroll settings updated', 'settings')
      notify('Settings saved')
    },
    [log, notify],
  )

  const value = useMemo<HRMSContextValue>(
    () => ({
      employees,
      attendance,
      leaves,
      payslips,
      activities,
      settings,
      toasts,
      employeeById,
      saveEmployee,
      toggleEmployeeStatus,
      deleteEmployee,
      setAttendance,
      applyLeave,
      setLeaveStatus,
      addPayslip,
      updateSettings,
      notify,
      dismissToast,
    }),
    [
      employees,
      attendance,
      leaves,
      payslips,
      activities,
      settings,
      toasts,
      employeeById,
      saveEmployee,
      toggleEmployeeStatus,
      deleteEmployee,
      setAttendance,
      applyLeave,
      setLeaveStatus,
      addPayslip,
      updateSettings,
      notify,
      dismissToast,
    ],
  )

  return <HRMSContext.Provider value={value}>{children}</HRMSContext.Provider>
}

export function useHRMS() {
  const ctx = useContext(HRMSContext)
  if (!ctx) throw new Error('useHRMS must be used within HRMSProvider')
  return ctx
}
