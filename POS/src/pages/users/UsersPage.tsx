import { useState, useEffect } from 'react'
import { Plus, Edit2, UserCheck, UserX, ShieldCheck } from 'lucide-react'
import bcrypt from 'bcryptjs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { db } from '@/db'
import { useUiStore } from '@/stores/uiStore'
import type { Employee, Role } from '@/types'
import { syncEmployeeToFirestore } from '@/services/firebase/sync'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-brand-100 text-brand-700',
  cashier: 'bg-green-100 text-green-700',
}

export function UsersPage() {
  const { addToast } = useUiStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const load = async () => {
    const all = await db.employees.toArray()
    setEmployees(all.sort((a, b) => a.name.localeCompare(b.name)))
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (emp: Employee) => {
    const newActive = !emp.isActive
    await db.employees.update(emp.id!, { isActive: newActive })
    syncEmployeeToFirestore({ ...emp, id: emp.id!, isActive: newActive })
    addToast('success', `${emp.name} ${emp.isActive ? 'deactivated' : 'reactivated'}`)
    await load()
  }

  return (
    <PageContainer title="Users & Permissions" subtitle="Manage staff accounts">
      <div className="max-w-3xl space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setEditEmployee(null); setFormOpen(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Staff
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Login Method</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className={`hover:bg-gray-50 ${!emp.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {emp.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[emp.role]}`}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {'4-digit PIN'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.isActive ? (
                      <span className="flex items-center justify-center gap-1 text-xs text-green-600">
                        <UserCheck size={14} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-xs text-gray-400">
                        <UserX size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditEmployee(emp); setFormOpen(true) }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggleActive(emp)}
                        className={`rounded p-1 ${emp.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                        title={emp.isActive ? 'Deactivate' : 'Reactivate'}>
                        {emp.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg bg-brand-50 border border-brand-100 px-4 py-3 flex items-start gap-3">
          <ShieldCheck size={18} className="text-brand-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-brand-700">
            <strong>Admin:</strong> Full access including user management and settings.<br />
            <strong>Manager:</strong> Billing, inventory, reports — no user management.<br />
            <strong>Cashier:</strong> Billing, stock receipt, and customer lookup only.
          </p>
        </div>
      </div>

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editEmployee={editEmployee}
        onSaved={async () => { await load(); setFormOpen(false) }}
      />
    </PageContainer>
  )
}

function EmployeeFormModal({
  open, onClose, editEmployee, onSaved,
}: {
  open: boolean
  onClose: () => void
  editEmployee: Employee | null
  onSaved: () => void
}) {
  const { addToast } = useUiStore()
  const [form, setForm] = useState({ name: '', role: 'cashier' as Role, credential: '', monthlyLeaveAllotment: 3 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(editEmployee
      ? { name: editEmployee.name, role: editEmployee.role, credential: '', monthlyLeaveAllotment: editEmployee.monthlyLeaveAllotment ?? 3 }
      : { name: '', role: 'cashier', credential: '', monthlyLeaveAllotment: 3 }
    )
  }, [editEmployee, open])

  const isCashier = true  // all roles now use PIN
  const credLabel = '4-digit PIN'

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('error', 'Name is required'); return }
    if (!editEmployee && !form.credential) { addToast('error', `${credLabel} is required`); return }
    if (isCashier && form.credential && form.credential.length !== 4) { addToast('error', 'PIN must be 4 digits'); return }
    

    setSaving(true)
    try {
      const patch: Partial<Employee> = { name: form.name, role: form.role, isActive: editEmployee?.isActive ?? true, monthlyLeaveAllotment: form.monthlyLeaveAllotment }
      if (form.credential) {
        const hash = await bcrypt.hash(form.credential, 10)
        patch.pinHash = hash
        // passwordHash no longer used for login
      }
      let empId: number
      if (editEmployee) {
        await db.employees.update(editEmployee.id!, patch)
        empId = editEmployee.id!
      } else {
        empId = await db.employees.add({ ...patch, createdAt: new Date() } as Employee)
      }
      const saved = await db.employees.get(empId)
      if (saved) syncEmployeeToFirestore({ ...saved, id: empId })
      addToast('success', editEmployee ? 'Staff updated' : `${form.name} added`)
      onSaved()
    } catch {
      addToast('error', 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editEmployee ? 'Edit Staff' : 'Add Staff'} size="sm">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role, credential: '' }))}
            disabled={!!editEmployee}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50">
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          {editEmployee && <p className="text-xs text-gray-400 mt-1">Role cannot be changed</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {editEmployee ? `New ${credLabel} (leave blank to keep)` : `${credLabel} *`}
          </label>
          <input type="tel" value={form.credential}
            onChange={(e) => setForm((f) => ({ ...f, credential: e.target.value }))}
            maxLength={4}
            placeholder="e.g. 1234"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Leave Allotment</label>
          <input type="number" value={form.monthlyLeaveAllotment} min={0} max={31}
            onChange={(e) => setForm((f) => ({ ...f, monthlyLeaveAllotment: Math.max(0, Math.min(31, Number(e.target.value))) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <p className="text-xs text-gray-400 mt-1">Number of paid leaves per month (default: 3)</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : editEmployee ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
