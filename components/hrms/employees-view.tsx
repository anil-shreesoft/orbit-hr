'use client'

import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEPARTMENTS, formatDate, formatINR, TODAY, type Department, type Employee } from '@/lib/hrms-data'
import { useHRMS } from './hrms-context'
import { Avatar, Badge, Card, EmptyRow, Field, inputClass, Modal, SearchInput, tdClass, thClass } from './ui'

type Draft = Omit<Employee, 'id' | 'code' | 'basic' | 'hra'> & { id?: string; basic: string; hra: string }

const emptyDraft: Draft = {
  name: '',
  email: '',
  role: '',
  department: 'Engineering',
  basic: '',
  hra: '',
  joiningDate: TODAY,
  status: 'Active',
}

export function EmployeesView() {
  const { employees, saveEmployee, toggleEmployeeStatus, deleteEmployee } = useHRMS()
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState<'All' | Department>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = employees.filter(
    (e) =>
      (dept === 'All' || e.department === dept) &&
      (statusFilter === 'All' || e.status === statusFilter) &&
      (!q || [e.name, e.email, e.code, e.role].some((v) => v.toLowerCase().includes(q))),
  )

  const openAdd = () => {
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  const openEdit = (e: Employee) => {
    setDraft({ ...e, basic: String(e.basic), hra: String(e.hra) })
    setModalOpen(true)
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    saveEmployee({
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      role: draft.role.trim(),
      basic: Number(draft.basic) || 0,
      hra: Number(draft.hra) || 0,
    })
    setModalOpen(false)
  }

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Employee Directory</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {employees.length} employees
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, ID…" label="Search employees" />
            <select
              aria-label="Filter by department"
              value={dept}
              onChange={(e) => setDept(e.target.value as typeof dept)}
              className={cn(inputClass, 'sm:w-44')}
            >
              <option value="All">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className={cn(inputClass, 'sm:w-32')}
            >
              <option value="All">All status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <Button className="h-9" onClick={openAdd}>
              <Plus /> Add New Employee
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className={thClass}>Employee</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Department</th>
                <th className={cn(thClass, 'text-right')}>Basic</th>
                <th className={cn(thClass, 'text-right')}>HRA</th>
                <th className={thClass}>Joined</th>
                <th className={thClass}>Status</th>
                <th className={cn(thClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <EmptyRow colSpan={8} message="No employees match your filters." />}
              {filtered.map((e) => (
                <tr key={e.id} className={cn('transition hover:bg-muted/40', e.status === 'Inactive' && 'opacity-60')}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} />
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{e.code}</span> · {e.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>{e.role}</td>
                  <td className={tdClass}>{e.department}</td>
                  <td className={cn(tdClass, 'text-right tabular-nums')}>{formatINR(e.basic)}</td>
                  <td className={cn(tdClass, 'text-right tabular-nums')}>{formatINR(e.hra)}</td>
                  <td className={cn(tdClass, 'text-muted-foreground')}>{formatDate(e.joiningDate)}</td>
                  <td className={tdClass}>
                    <Badge tone={e.status === 'Active' ? 'green' : 'gray'}>{e.status}</Badge>
                  </td>
                  <td className={cn(tdClass, 'text-right')}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)} title="Edit">
                        <Pencil />
                        <span className="sr-only">Edit {e.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleEmployeeStatus(e.id)}
                        title={e.status === 'Active' ? 'Deactivate' : 'Activate'}
                        className={e.status === 'Active' ? 'text-amber-600' : 'text-emerald-600'}
                      >
                        <Power />
                        <span className="sr-only">
                          {e.status === 'Active' ? 'Deactivate' : 'Activate'} {e.name}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmDelete(e)}
                        title="Delete"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 />
                        <span className="sr-only">Delete {e.name}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={draft.id ? 'Edit Employee' : 'Add New Employee'}
        description={draft.id ? 'Update profile and compensation details.' : 'Create a new employee record.'}
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="emp-name" className="sm:col-span-2">
            <input id="emp-name" required className={inputClass} value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Rahul Verma" />
          </Field>
          <Field label="Work email" htmlFor="emp-email" className="sm:col-span-2">
            <input id="emp-email" type="email" required className={inputClass} value={draft.email} onChange={(e) => update('email', e.target.value)} placeholder="rahul.verma@company.in" />
          </Field>
          <Field label="Role" htmlFor="emp-role">
            <input id="emp-role" required className={inputClass} value={draft.role} onChange={(e) => update('role', e.target.value)} placeholder="Software Engineer" />
          </Field>
          <Field label="Department" htmlFor="emp-dept">
            <select id="emp-dept" className={inputClass} value={draft.department} onChange={(e) => update('department', e.target.value as Department)}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Basic salary (₹ / month)" htmlFor="emp-basic">
            <input id="emp-basic" type="number" min={0} required inputMode="numeric" className={inputClass} value={draft.basic} onChange={(e) => update('basic', e.target.value)} placeholder="30000" />
          </Field>
          <Field label="HRA (₹ / month)" htmlFor="emp-hra">
            <input id="emp-hra" type="number" min={0} required inputMode="numeric" className={inputClass} value={draft.hra} onChange={(e) => update('hra', e.target.value)} placeholder="12000" />
          </Field>
          <Field label="Joining date" htmlFor="emp-join">
            <input id="emp-join" type="date" required className={inputClass} value={draft.joiningDate} onChange={(e) => update('joiningDate', e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="emp-status">
            <select id="emp-status" className={inputClass} value={draft.status} onChange={(e) => update('status', e.target.value as Employee['status'])}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <Button type="button" variant="outline" className="h-9" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9">
              {draft.id ? 'Save changes' : 'Add employee'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete employee?">
        <p className="text-sm text-muted-foreground">
          This permanently removes <span className="font-medium text-foreground">{confirmDelete?.name}</span> from the
          directory. Consider deactivating instead to retain payroll history.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            className="h-9"
            onClick={() => {
              if (confirmDelete && confirmDelete.status === 'Active') toggleEmployeeStatus(confirmDelete.id)
              setConfirmDelete(null)
            }}
          >
            Deactivate instead
          </Button>
          <Button
            className="h-9 bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              if (confirmDelete) deleteEmployee(confirmDelete.id)
              setConfirmDelete(null)
            }}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
