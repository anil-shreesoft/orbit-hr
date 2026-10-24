'use client'

import { useState, type FormEvent } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { INITIAL_SETTINGS, type Settings } from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Card, CardHeader, Field, inputClass } from './ui'

const STATES = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat', 'Delhi']

export function SettingsView() {
  const { settings, updateSettings } = useHRMS()
  const [draft, setDraft] = useState<Settings>(settings)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    updateSettings(draft)
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader title="Company Profile" description="Appears on payslips and statutory reports" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Company name" htmlFor="s-name" className="sm:col-span-2">
            <input id="s-name" required className={inputClass} value={draft.companyName} onChange={(e) => set('companyName', e.target.value)} />
          </Field>
          <Field label="GSTIN" htmlFor="s-gst">
            <input id="s-gst" className={cn(inputClass, 'font-mono uppercase')} value={draft.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} maxLength={15} />
          </Field>
          <Field label="EPF establishment code" htmlFor="s-pf">
            <input id="s-pf" className={cn(inputClass, 'font-mono uppercase')} value={draft.pfRegNo} onChange={(e) => set('pfRegNo', e.target.value.toUpperCase())} />
          </Field>
          <Field label="State (for Professional Tax)" htmlFor="s-state">
            <select id="s-state" className={inputClass} value={draft.state} onChange={(e) => set('state', e.target.value)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Shift start time" htmlFor="s-start" hint="Clock-ins after this are marked Late">
            <input id="s-start" type="time" className={inputClass} value={draft.officeStart} onChange={(e) => set('officeStart', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Statutory Payroll Rules" description="Used by the payroll calculator" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Field label="PF rate (% of Basic)" htmlFor="s-pfrate">
            <input id="s-pfrate" type="number" min={0} max={100} step={0.5} className={inputClass} value={draft.pfRate} onChange={(e) => set('pfRate', Number(e.target.value))} />
          </Field>
          <Field label="Professional Tax (₹ / month)" htmlFor="s-pt">
            <input id="s-pt" type="number" min={0} className={inputClass} value={draft.ptAmount} onChange={(e) => set('ptAmount', Number(e.target.value))} />
          </Field>
          <Field label="PT applies when gross exceeds (₹)" htmlFor="s-ptth">
            <input id="s-ptth" type="number" min={0} className={inputClass} value={draft.ptThreshold} onChange={(e) => set('ptThreshold', Number(e.target.value))} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preferences" />
        <div className="flex flex-col divide-y">
          <Toggle
            label="Email notifications"
            description="Notify managers when a leave request is submitted"
            checked={draft.emailNotifications}
            onChange={(v) => set('emailNotifications', v)}
          />
          <Toggle
            label="Auto-approve sick leave"
            description="Sick leave requests are approved instantly"
            checked={draft.autoApproveSick}
            onChange={(v) => set('autoApproveSick', v)}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-9" onClick={() => setDraft(INITIAL_SETTINGS)}>
          <RotateCcw /> Reset defaults
        </Button>
        <Button type="submit" className="h-9" disabled={!dirty}>
          <Save /> Save settings
        </Button>
      </div>
    </form>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}
