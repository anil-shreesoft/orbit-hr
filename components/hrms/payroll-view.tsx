'use client'

import { useState, type FormEvent } from 'react'
import { Download, Eye, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calculatePayroll, formatINR, type Employee, type Payslip, type Settings } from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Card, CardHeader, EmptyRow, Field, inputClass, Modal, tdClass, thClass } from './ui'

const MONTHS = ['October 2026', 'September 2026', 'August 2026', 'July 2026']

export function PayrollView() {
  const { employees, payslips, addPayslip, settings, employeeById } = useHRMS()
  const active = employees.filter((e) => e.status === 'Active')
  const first = active[0]

  const [employeeId, setEmployeeId] = useState(first?.id ?? '')
  const [month, setMonth] = useState(MONTHS[0])
  const [basic, setBasic] = useState(String(first?.basic ?? ''))
  const [hra, setHra] = useState(String(first?.hra ?? ''))
  const [workingDays, setWorkingDays] = useState('26')
  const [preview, setPreview] = useState<Payslip | null>(null)

  const selectEmployee = (id: string) => {
    setEmployeeId(id)
    const emp = active.find((e) => e.id === id)
    if (emp) {
      setBasic(String(emp.basic))
      setHra(String(emp.hra))
    }
  }

  const basicNum = Math.max(0, Number(basic) || 0)
  const hraNum = Math.max(0, Number(hra) || 0)
  const { gross, pf, pt, net } = calculatePayroll(basicNum, hraNum, settings)
  const deductions = pf + pt

  const generate = (e: FormEvent) => {
    e.preventDefault()
    if (!employeeId) return
    const slip = addPayslip({
      employeeId,
      month,
      basic: basicNum,
      hra: hraNum,
      workingDays: Number(workingDays) || 0,
      gross,
      pf,
      pt,
      net,
    })
    setPreview(slip)
  }

  const lines = [
    { label: 'Basic salary', value: basicNum, kind: 'earning' },
    { label: 'House Rent Allowance (HRA)', value: hraNum, kind: 'earning' },
    { label: `Provident Fund (${settings.pfRate}% of Basic)`, value: pf, kind: 'deduction' },
    {
      label: `Professional Tax${gross > settings.ptThreshold ? '' : ` (exempt ≤ ${formatINR(settings.ptThreshold)})`}`,
      value: pt,
      kind: 'deduction',
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Salary Calculator" description="Values update the breakdown instantly" />
          <form onSubmit={generate} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Select employee" htmlFor="pay-emp" className="sm:col-span-2">
              <select id="pay-emp" className={inputClass} value={employeeId} onChange={(e) => selectEmployee(e.target.value)} required>
                {active.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pay period" htmlFor="pay-month">
              <select id="pay-month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Working days" htmlFor="pay-days">
              <input id="pay-days" type="number" min={0} max={31} required className={inputClass} value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} />
            </Field>
            <Field label="Monthly basic salary (₹)" htmlFor="pay-basic">
              <input id="pay-basic" type="number" min={0} required inputMode="numeric" className={inputClass} value={basic} onChange={(e) => setBasic(e.target.value)} />
            </Field>
            <Field label="HRA (₹)" htmlFor="pay-hra">
              <input id="pay-hra" type="number" min={0} required inputMode="numeric" className={inputClass} value={hra} onChange={(e) => setHra(e.target.value)} />
            </Field>
            <Button type="submit" className="h-10 sm:col-span-2" disabled={!employeeId}>
              <Sparkles /> Generate Payslip
            </Button>
          </form>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Salary Breakdown" description={`${employeeById(employeeId)?.name ?? '—'} · ${month}`} />
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            <Stat label="Gross salary" value={formatINR(gross)} hint="Basic + HRA" />
            <Stat label="Total deductions" value={formatINR(deductions)} hint="PF + PT" tone="text-red-600" />
            <Stat label="Net salary" value={formatINR(net)} hint="Gross − deductions" highlight />
          </div>
          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <tbody className="divide-y">
                  {lines.map((l) => (
                    <tr key={l.label}>
                      <td className="px-4 py-2.5 text-sm">{l.label}</td>
                      <td
                        className={cn(
                          'px-4 py-2.5 text-right text-sm font-medium tabular-nums',
                          l.kind === 'deduction' ? 'text-red-600' : 'text-foreground',
                        )}
                      >
                        {l.kind === 'deduction' ? '− ' : ''}
                        {formatINR(l.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary">
                    <td className="px-4 py-3 text-sm font-semibold text-secondary-foreground">Net payable</td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-secondary-foreground">
                      {formatINR(net)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {gross > 0 && (
              <div className="mt-4">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="bg-primary transition-all duration-500" style={{ width: `${(net / gross) * 100}%` }} />
                  <div className="bg-chart-2 transition-all duration-500" style={{ width: `${(pf / gross) * 100}%` }} />
                  <div className="bg-chart-4 transition-all duration-500" style={{ width: `${(pt / gross) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Take-home is {((net / gross) * 100).toFixed(1)}% of gross · Employer PF contribution:{' '}
                  {formatINR(pf)}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Payslip Summary" description="Generated payslips this session — view or download" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className={thClass}>Employee</th>
                <th className={thClass}>Period</th>
                <th className={cn(thClass, 'text-right')}>Days</th>
                <th className={cn(thClass, 'text-right')}>Gross</th>
                <th className={cn(thClass, 'text-right')}>PF</th>
                <th className={cn(thClass, 'text-right')}>PT</th>
                <th className={cn(thClass, 'text-right')}>Net</th>
                <th className={cn(thClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payslips.length === 0 && (
                <EmptyRow colSpan={8} message="No payslips yet. Use “Generate Payslip” above to create one." />
              )}
              {payslips.map((p) => {
                const emp = employeeById(p.employeeId)
                return (
                  <tr key={p.id} className="animate-in fade-in transition hover:bg-muted/40">
                    <td className={tdClass}>
                      <p className="font-medium">{emp?.name ?? 'Former employee'}</p>
                      <p className="text-xs text-muted-foreground">Generated {p.generatedAt}</p>
                    </td>
                    <td className={tdClass}>{p.month}</td>
                    <td className={cn(tdClass, 'text-right tabular-nums')}>{p.workingDays}</td>
                    <td className={cn(tdClass, 'text-right tabular-nums')}>{formatINR(p.gross)}</td>
                    <td className={cn(tdClass, 'text-right tabular-nums text-red-600')}>{formatINR(p.pf)}</td>
                    <td className={cn(tdClass, 'text-right tabular-nums text-red-600')}>{formatINR(p.pt)}</td>
                    <td className={cn(tdClass, 'text-right font-semibold tabular-nums')}>{formatINR(p.net)}</td>
                    <td className={cn(tdClass, 'text-right')}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setPreview(p)} title="View">
                          <Eye />
                          <span className="sr-only">View payslip</span>
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => emp && downloadPayslip(p, emp, settings)} title="Download">
                          <Download />
                          <span className="sr-only">Download payslip</span>
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

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Payslip" description={preview?.month}>
        {preview && (
          <PayslipDocument
            payslip={preview}
            employee={employeeById(preview.employeeId)}
            settings={settings}
            onDownload={(emp) => downloadPayslip(preview, emp, settings)}
          />
        )}
      </Modal>
    </div>
  )
}

function Stat({ label, value, hint, tone, highlight }: { label: string; value: string; hint: string; tone?: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-lg border p-4 transition', highlight && 'border-primary/30 bg-secondary')}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', tone, highlight && 'text-primary')}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function PayslipDocument({
  payslip,
  employee,
  settings,
  onDownload,
}: {
  payslip: Payslip
  employee?: Employee
  settings: Settings
  onDownload: (emp: Employee) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 rounded-lg bg-secondary p-4">
        <div>
          <p className="text-sm font-semibold text-secondary-foreground">{settings.companyName}</p>
          <p className="text-xs text-muted-foreground">PF Reg: {settings.pfRegNo}</p>
        </div>
        <FileText className="size-6 text-primary" aria-hidden="true" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Employee</dt>
        <dd className="text-right font-medium">{employee?.name ?? '—'}</dd>
        <dt className="text-muted-foreground">Employee ID</dt>
        <dd className="text-right font-mono text-xs">{employee?.code ?? '—'}</dd>
        <dt className="text-muted-foreground">Designation</dt>
        <dd className="text-right">{employee?.role ?? '—'}</dd>
        <dt className="text-muted-foreground">Working days</dt>
        <dd className="text-right">{payslip.workingDays}</dd>
      </dl>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Earnings</p>
          <Row label="Basic" value={payslip.basic} />
          <Row label="HRA" value={payslip.hra} />
          <Row label="Gross" value={payslip.gross} bold />
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deductions</p>
          <Row label="Provident Fund" value={payslip.pf} />
          <Row label="Professional Tax" value={payslip.pt} />
          <Row label="Total" value={payslip.pf + payslip.pt} bold />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground">
        <span className="text-sm">Net salary payable</span>
        <span className="text-lg font-semibold tabular-nums">{formatINR(payslip.net)}</span>
      </div>
      {employee && (
        <Button className="h-9" onClick={() => onDownload(employee)}>
          <Download /> Download payslip
        </Button>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between py-0.5', bold && 'mt-1 border-t pt-1.5 font-semibold')}>
      <span>{label}</span>
      <span className="tabular-nums">{formatINR(value)}</span>
    </div>
  )
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function downloadPayslip(p: Payslip, emp: Employee, settings: Settings) {
  const row = (label: string, value: number) =>
    `<tr><td>${escapeHtml(label)}</td><td style="text-align:right">${formatINR(value)}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip - ${escapeHtml(emp.name)} - ${escapeHtml(p.month)}</title>
<style>body{font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;margin:40px auto;padding:0 20px}h1{color:#1d4ed8;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:14px}th{text-align:left;background:#eff6ff}.net{background:#1d4ed8;color:#fff;font-weight:600}</style></head>
<body><h1>${escapeHtml(settings.companyName)}</h1><p>Payslip for <strong>${escapeHtml(p.month)}</strong> · PF Reg ${escapeHtml(settings.pfRegNo)}</p>
<table><tr><th>Employee</th><td>${escapeHtml(emp.name)} (${escapeHtml(emp.code)})</td></tr><tr><th>Designation</th><td>${escapeHtml(emp.role)}, ${escapeHtml(emp.department)}</td></tr><tr><th>Working days</th><td>${p.workingDays}</td></tr></table>
<table><tr><th>Earnings</th><th style="text-align:right">Amount</th></tr>${row('Basic', p.basic)}${row('HRA', p.hra)}${row('Gross salary', p.gross)}</table>
<table><tr><th>Deductions</th><th style="text-align:right">Amount</th></tr>${row('Provident Fund', p.pf)}${row('Professional Tax', p.pt)}<tr class="net"><td>Net salary</td><td style="text-align:right">${formatINR(p.net)}</td></tr></table>
<p style="color:#64748b;font-size:12px;margin-top:24px">This is a system-generated payslip and does not require a signature.</p></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `payslip-${emp.code}-${p.month.replace(/\s+/g, '-').toLowerCase()}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
