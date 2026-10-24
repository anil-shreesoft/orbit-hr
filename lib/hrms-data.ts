export type TabId =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'analytics'
  | 'settings'

export const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
] as const

export type Department = (typeof DEPARTMENTS)[number]

export interface Employee {
  id: string
  code: string
  name: string
  email: string
  role: string
  department: Department
  basic: number
  hra: number
  joiningDate: string
  status: 'Active' | 'Inactive'
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'late' | 'leave' | 'unmarked'

export interface AttendanceEntry {
  status: AttendanceStatus
  clockIn?: string
  clockOut?: string
}

export type AttendanceLog = Record<string, Record<string, AttendanceEntry>>

export type LeaveType = 'Paid' | 'Casual' | 'Sick'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  appliedOn: string
}

export interface Payslip {
  id: string
  employeeId: string
  month: string
  basic: number
  hra: number
  workingDays: number
  gross: number
  pf: number
  pt: number
  net: number
  generatedAt: string
}

export interface Activity {
  id: string
  message: string
  time: string
  kind: 'employee' | 'attendance' | 'leave' | 'payroll' | 'settings'
}

export interface Settings {
  companyName: string
  gstin: string
  pfRegNo: string
  state: string
  pfRate: number
  ptAmount: number
  ptThreshold: number
  officeStart: string
  emailNotifications: boolean
  autoApproveSick: boolean
}

export const TODAY = '2026-10-22'

/** Employees outside the seeded directory, so headline figures match the full company headcount. */
export const UNLISTED_WORKFORCE = { total: 112, present: 102, onLeave: 6 }

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', code: 'EMP-1001', name: 'Aarav Sharma', email: 'aarav.sharma@peopledesk.in', role: 'Senior Software Engineer', department: 'Engineering', basic: 62000, hra: 24800, joiningDate: '2021-04-12', status: 'Active' },
  { id: 'e2', code: 'EMP-1002', name: 'Priya Iyer', email: 'priya.iyer@peopledesk.in', role: 'HR Manager', department: 'Human Resources', basic: 55000, hra: 22000, joiningDate: '2020-07-01', status: 'Active' },
  { id: 'e3', code: 'EMP-1003', name: 'Rohan Mehta', email: 'rohan.mehta@peopledesk.in', role: 'Sales Executive', department: 'Sales', basic: 28000, hra: 11200, joiningDate: '2023-01-16', status: 'Active' },
  { id: 'e4', code: 'EMP-1004', name: 'Ananya Reddy', email: 'ananya.reddy@peopledesk.in', role: 'Product Designer', department: 'Engineering', basic: 48000, hra: 19200, joiningDate: '2022-03-21', status: 'Active' },
  { id: 'e5', code: 'EMP-1005', name: 'Vikram Singh', email: 'vikram.singh@peopledesk.in', role: 'Finance Analyst', department: 'Finance', basic: 42000, hra: 16800, joiningDate: '2022-09-05', status: 'Active' },
  { id: 'e6', code: 'EMP-1006', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@peopledesk.in', role: 'Marketing Lead', department: 'Marketing', basic: 52000, hra: 20800, joiningDate: '2021-11-08', status: 'Active' },
  { id: 'e7', code: 'EMP-1007', name: 'Karthik Nair', email: 'karthik.nair@peopledesk.in', role: 'DevOps Engineer', department: 'Engineering', basic: 58000, hra: 23200, joiningDate: '2022-06-13', status: 'Active' },
  { id: 'e8', code: 'EMP-1008', name: 'Meera Joshi', email: 'meera.joshi@peopledesk.in', role: 'Operations Associate', department: 'Operations', basic: 7500, hra: 2000, joiningDate: '2024-02-19', status: 'Active' },
  { id: 'e9', code: 'EMP-1009', name: 'Arjun Patel', email: 'arjun.patel@peopledesk.in', role: 'Regional Sales Manager', department: 'Sales', basic: 60000, hra: 24000, joiningDate: '2019-08-26', status: 'Active' },
  { id: 'e10', code: 'EMP-1010', name: 'Divya Menon', email: 'divya.menon@peopledesk.in', role: 'Accounts Executive', department: 'Finance', basic: 26000, hra: 10400, joiningDate: '2023-10-02', status: 'Active' },
  { id: 'e11', code: 'EMP-1011', name: 'Siddharth Rao', email: 'siddharth.rao@peopledesk.in', role: 'QA Engineer', department: 'Engineering', basic: 38000, hra: 15200, joiningDate: '2023-05-15', status: 'Active' },
  { id: 'e12', code: 'EMP-1012', name: 'Kavya Gupta', email: 'kavya.gupta@peopledesk.in', role: 'Content Strategist', department: 'Marketing', basic: 34000, hra: 13600, joiningDate: '2024-06-03', status: 'Active' },
]

export const INITIAL_ATTENDANCE: AttendanceLog = {
  [TODAY]: {
    e1: { status: 'present', clockIn: '09:04' },
    e2: { status: 'present', clockIn: '08:52' },
    e3: { status: 'late', clockIn: '10:12' },
    e4: { status: 'present', clockIn: '09:15' },
    e5: { status: 'leave' },
    e6: { status: 'present', clockIn: '09:01' },
    e7: { status: 'half-day', clockIn: '09:20', clockOut: '13:30' },
    e8: { status: 'present', clockIn: '08:45' },
    e9: { status: 'present', clockIn: '09:10' },
    e10: { status: 'leave' },
    e11: { status: 'late', clockIn: '09:48' },
    e12: { status: 'present', clockIn: '09:05' },
  },
}

export const INITIAL_LEAVES: LeaveRequest[] = [
  { id: 'l1', employeeId: 'e5', type: 'Sick', startDate: '2026-10-21', endDate: '2026-10-23', reason: 'Viral fever, doctor advised rest', status: 'Approved', appliedOn: '2026-10-20' },
  { id: 'l2', employeeId: 'e10', type: 'Paid', startDate: '2026-10-22', endDate: '2026-10-24', reason: 'Diwali travel to hometown', status: 'Approved', appliedOn: '2026-10-10' },
  { id: 'l3', employeeId: 'e3', type: 'Casual', startDate: '2026-10-28', endDate: '2026-10-28', reason: 'Personal work at bank', status: 'Pending', appliedOn: '2026-10-21' },
  { id: 'l4', employeeId: 'e12', type: 'Paid', startDate: '2026-11-02', endDate: '2026-11-06', reason: 'Family wedding in Jaipur', status: 'Pending', appliedOn: '2026-10-19' },
  { id: 'l5', employeeId: 'e7', type: 'Sick', startDate: '2026-10-14', endDate: '2026-10-14', reason: 'Migraine', status: 'Rejected', appliedOn: '2026-10-14' },
  { id: 'l6', employeeId: 'e1', type: 'Casual', startDate: '2026-10-30', endDate: '2026-10-31', reason: 'Moving to a new apartment', status: 'Pending', appliedOn: '2026-10-22' },
]

export const INITIAL_PAYSLIPS: Payslip[] = []

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'a1', message: 'Kavya Gupta clocked in at 09:05', time: '09:05 AM', kind: 'attendance' },
  { id: 'a2', message: 'Aarav Sharma applied for Casual leave (30–31 Oct)', time: '08:40 AM', kind: 'leave' },
  { id: 'a3', message: 'September payroll disbursed for 124 employees', time: 'Yesterday', kind: 'payroll' },
  { id: 'a4', message: 'Divya Menon’s Paid leave was approved', time: 'Yesterday', kind: 'leave' },
  { id: 'a5', message: 'New hire Kavya Gupta added to Marketing', time: '2 days ago', kind: 'employee' },
]

export const WEEKLY_ATTENDANCE = [
  { day: 'Thu', present: 110, absent: 6, leave: 8 },
  { day: 'Fri', present: 108, absent: 7, leave: 9 },
  { day: 'Sat', present: 96, absent: 12, leave: 16 },
  { day: 'Mon', present: 114, absent: 4, leave: 6 },
  { day: 'Tue', present: 111, absent: 6, leave: 7 },
  { day: 'Wed', present: 113, absent: 5, leave: 6 },
]

export const MONTHLY_PAYROLL_TREND = [
  { month: 'May', amount: 48.2 },
  { month: 'Jun', amount: 48.9 },
  { month: 'Jul', amount: 50.1 },
  { month: 'Aug', amount: 51.4 },
  { month: 'Sep', amount: 52.8 },
  { month: 'Oct', amount: 54.3 },
]

export const INITIAL_SETTINGS: Settings = {
  companyName: 'PeopleDesk Technologies Pvt. Ltd.',
  gstin: '27AABCP1234F1Z5',
  pfRegNo: 'MHBAN0012345000',
  state: 'Maharashtra',
  pfRate: 12,
  ptAmount: 200,
  ptThreshold: 10000,
  officeStart: '09:30',
  emailNotifications: true,
  autoApproveSick: false,
}

export function calculatePayroll(basic: number, hra: number, settings: Pick<Settings, 'pfRate' | 'ptAmount' | 'ptThreshold'>) {
  const gross = basic + hra
  const pf = Math.round((basic * settings.pfRate) / 100)
  const pt = gross > settings.ptThreshold ? settings.ptAmount : 0
  const net = gross - (pf + pt)
  return { gross, pf, pt, net }
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(value: number) {
  return inrFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`
}

export function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
}

export function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
