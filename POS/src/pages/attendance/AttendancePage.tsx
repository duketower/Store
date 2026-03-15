import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Download, Plus, Edit2, UserCheck, UserX,
  Clock, CheckCircle, XCircle, MinusCircle, Calendar,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/stores/uiStore'
import { db } from '@/db'
import {
  getAttendanceBoard,
  upsertAttendanceLog,
  clockIn,
  clockOut,
  getTodayLog,
  getMyAttendance,
  getLeaveBalance,
  submitLeaveRequest,
  getLeaveRequests,
  getMyLeaveRequests,
  getLastNLeaves,
  approveLeave,
  rejectLeave,
  getExternalStaff,
  getActiveExternalStaff,
  upsertExternalStaff,
  toggleExternalStaffActive,
  getLeaveExport,
} from '@/db/queries/attendance'
import type {
  AttendanceLog,
  AttendanceStatus,
  ExternalStaff,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  StaffType,
} from '@/types'
import type { Employee } from '@/types'

type AttendanceTab = 'board' | 'leaves' | 'my' | 'external'

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:  'bg-green-100 text-green-700',
  absent:   'bg-red-100 text-red-700',
  half_day: 'bg-yellow-100 text-yellow-700',
  leave:    'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present:  'P',
  absent:   'A',
  half_day: '½',
  leave:    'L',
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  full:    'Full Day',
  half_am: 'Half AM',
  half_pm: 'Half PM',
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 0 || dow === 6
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function AttendancePage() {
  const { role } = useAuth()
  const today = new Date()
  const [tab, setTab] = useState<AttendanceTab>(() => {
    if (role === 'admin' || role === 'manager') return 'board'
    return 'my'
  })

  const tabs: { id: AttendanceTab; label: string; roles: string[] }[] = [
    { id: 'board',    label: 'Board',          roles: ['admin', 'manager'] },
    { id: 'leaves',   label: 'Leave Requests', roles: ['admin', 'manager'] },
    { id: 'my',       label: 'My Attendance',  roles: ['admin', 'manager', 'cashier'] },
    { id: 'external', label: 'External Staff', roles: ['admin'] },
  ]

  const visibleTabs = tabs.filter(t => role && t.roles.includes(role))

  return (
    <PageContainer title="Attendance" subtitle="Track attendance and manage leaves">
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'board'    && <BoardTab today={today} />}
      {tab === 'leaves'   && <LeavesTab />}
      {tab === 'my'       && <MyAttendanceTab today={today} />}
      {tab === 'external' && <ExternalStaffTab today={today} />}
    </PageContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Board
// ─────────────────────────────────────────────────────────────────────────────

function BoardTab({ today }: { today: Date }) {
  const { addToast } = useUiStore()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [externalStaff, setExternalStaff] = useState<ExternalStaff[]>([])
  const [board, setBoard] = useState<Map<string, AttendanceLog[]>>(new Map())
  const [logModal, setLogModal] = useState<{ staffId: number; staffType: StaffType; name: string; date: string } | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    const [emps, ext, brd] = await Promise.all([
      db.employees.where('isActive').equals(1).sortBy('name'),
      getActiveExternalStaff(),
      getAttendanceBoard(year, month),
    ])
    setEmployees(emps)
    setExternalStaff(ext)
    setBoard(brd)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)

  const getLog = (staffId: number, staffType: StaffType, day: number) => {
    const key = dateStr(year, month, day)
    return board.get(key)?.find(l => l.staffId === staffId && l.staffType === staffType)
  }

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = await getLeaveExport(year, month)
      const header = ['Name', 'Role/Designation', 'Month', 'Allotment', 'Present', 'Absent', 'Half Day', 'Leave Days Used', 'Remaining Balance', 'Pending Leaves']
      const data = rows.map(r => [r.name, r.roleOrDesignation, r.month, r.allotment, r.present, r.absent, r.halfDay, r.leaveDaysUsed, r.remainingBalance, r.pendingLeaves])
      downloadCsv([header, ...data], `attendance-${year}-${pad(month)}.csv`)
      addToast('success', 'CSV downloaded')
    } catch {
      addToast('error', 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-gray-800 min-w-[130px] text-center">{formatMonthYear(year, month)}</span>
          <button onClick={nextMonth} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"><ChevronRight size={16} /></button>
        </div>
        <button onClick={goToday} className="text-xs text-blue-600 underline hover:no-underline">Today</button>
        <div className="ml-auto flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded px-1.5 py-0.5 bg-green-100 text-green-700">P</span>
            <span className="rounded px-1.5 py-0.5 bg-red-100 text-red-700">A</span>
            <span className="rounded px-1.5 py-0.5 bg-yellow-100 text-yellow-700">½</span>
            <span className="rounded px-1.5 py-0.5 bg-blue-100 text-blue-700">L</span>
          </div>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 min-w-[140px]">Staff</th>
              {days.map(d => (
                <th
                  key={d}
                  className={`px-1 py-2 text-center font-medium w-8 ${isWeekend(year, month, d) ? 'bg-gray-100 text-gray-400' : 'text-gray-600'}`}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp, i) => (
              <tr key={`emp-${emp.id}`} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-gray-800 whitespace-nowrap">
                  {emp.name}
                  <span className="ml-1 text-[10px] text-gray-400">{emp.role}</span>
                </td>
                {days.map(d => {
                  const log = getLog(emp.id!, 'employee', d)
                  const isFuture = new Date(year, month - 1, d) > today
                  return (
                    <td key={d} className={`px-0.5 py-1 text-center ${isWeekend(year, month, d) ? 'bg-gray-50' : ''}`}>
                      <button
                        disabled={isFuture}
                        onClick={() => setLogModal({ staffId: emp.id!, staffType: 'employee', name: emp.name, date: dateStr(year, month, d) })}
                        className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
                          log ? STATUS_COLORS[log.status] : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                        } ${isFuture ? 'cursor-default opacity-40' : 'cursor-pointer hover:opacity-80'}`}
                        title={log ? log.status : 'No record'}
                      >
                        {log ? STATUS_LABELS[log.status] : ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            {externalStaff.map((ext, i) => (
              <tr key={`ext-${ext.id}`} className={(employees.length + i) % 2 === 1 ? 'bg-gray-50/50' : ''}>
                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-gray-800 whitespace-nowrap">
                  {ext.name}
                  <span className="ml-1 text-[10px] text-gray-400">{ext.designation}</span>
                </td>
                {days.map(d => {
                  const log = getLog(ext.id!, 'external', d)
                  const isFuture = new Date(year, month - 1, d) > today
                  return (
                    <td key={d} className={`px-0.5 py-1 text-center ${isWeekend(year, month, d) ? 'bg-gray-50' : ''}`}>
                      <button
                        disabled={isFuture}
                        onClick={() => setLogModal({ staffId: ext.id!, staffType: 'external', name: ext.name, date: dateStr(year, month, d) })}
                        className={`w-7 h-6 rounded text-[10px] font-bold transition-colors ${
                          log ? STATUS_COLORS[log.status] : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                        } ${isFuture ? 'cursor-default opacity-40' : 'cursor-pointer hover:opacity-80'}`}
                        title={log ? log.status : 'No record'}
                      >
                        {log ? STATUS_LABELS[log.status] : ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            {employees.length === 0 && externalStaff.length === 0 && (
              <tr><td colSpan={days.length + 1} className="py-8 text-center text-sm text-gray-400">No active staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {logModal && (
        <LogAttendanceModal
          staffId={logModal.staffId}
          staffType={logModal.staffType}
          staffName={logModal.name}
          date={logModal.date}
          onClose={() => setLogModal(null)}
          onSaved={async () => { setLogModal(null); await load() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Attendance Modal (used in Board)
// ─────────────────────────────────────────────────────────────────────────────

function LogAttendanceModal({
  staffId, staffType, staffName, date,
  onClose, onSaved,
}: {
  staffId: number
  staffType: StaffType
  staffName: string
  date: string
  onClose: () => void
  onSaved: () => void
}) {
  const { employeeId, addToast } = { ...useAuth(), ...useUiStore() }
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertAttendanceLog(staffId, staffType, date, status, employeeId!, { notes: notes || undefined })
      addToast('success', 'Attendance logged')
      onSaved()
    } catch {
      addToast('error', 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: 'present',  label: 'Present',  color: 'bg-green-100 text-green-700 ring-green-400' },
    { value: 'absent',   label: 'Absent',   color: 'bg-red-100 text-red-700 ring-red-400' },
    { value: 'half_day', label: 'Half Day', color: 'bg-yellow-100 text-yellow-700 ring-yellow-400' },
    { value: 'leave',    label: 'On Leave', color: 'bg-blue-100 text-blue-700 ring-blue-400' },
  ]

  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Modal open onClose={onClose} title={`Log Attendance — ${staffName}`} size="sm">
      <div className="space-y-4">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${opt.color} ${
                status === opt.value ? 'ring-2' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Late arrival"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Leave Requests (admin/manager)
// ─────────────────────────────────────────────────────────────────────────────

function LeavesTab() {
  const { addToast } = useUiStore()
  const { employeeId } = useAuth()
  const [pending, setPending] = useState<(LeaveRequest & { employeeName: string })[]>([])
  const [history, setHistory] = useState<(LeaveRequest & { employeeName: string })[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [approveModal, setApproveModal] = useState<LeaveRequest & { employeeName: string } | null>(null)
  const [rejectModal, setRejectModal] = useState<LeaveRequest & { employeeName: string } | null>(null)

  const load = useCallback(async () => {
    const [pend, hist, allEmps] = await Promise.all([
      getLeaveRequests('pending'),
      getLeaveRequests('approved').then(async approved => {
        const rejected = await getLeaveRequests('rejected')
        return [...approved, ...rejected].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }),
      db.employees.toArray(),
    ])
    const empMap = new Map(allEmps.map(e => [e.id!, e.name]))
    const enrich = (r: LeaveRequest) => ({ ...r, employeeName: empMap.get(r.employeeId) ?? `#${r.employeeId}` })
    setPending(pend.map(enrich))
    setHistory(hist.map(enrich))
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: number) => {
    try {
      await approveLeave(id, employeeId!)
      addToast('success', 'Leave approved')
      setApproveModal(null)
      await load()
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleReject = async (id: number, reason: string) => {
    if (!reason.trim()) { addToast('error', 'Rejection reason required'); return }
    try {
      await rejectLeave(id, employeeId!, reason)
      addToast('success', 'Leave rejected')
      setRejectModal(null)
      await load()
    } catch {
      addToast('error', 'Failed')
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'pending')  return <span className="rounded-full px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700">Pending</span>
    if (status === 'approved') return <span className="rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700">Approved</span>
    return <span className="rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">Rejected</span>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Pending */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pending requests</p>
        ) : (
          <div className="space-y-2">
            {pending.map(req => (
              <div key={req.id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{req.employeeName}</span>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                    {' · '}{LEAVE_TYPE_LABELS[req.leaveType]}
                  </p>
                  <p className="text-xs text-gray-500 italic">"{req.reason}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setApproveModal(req)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(req)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3"
        >
          <ChevronRight size={14} className={`transition-transform ${historyOpen ? 'rotate-90' : ''}`} />
          History ({history.length})
        </button>
        {historyOpen && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No history</p>
            ) : history.map(req => (
              <div key={req.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 text-sm">{req.employeeName}</span>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-xs text-gray-400">
                    {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                    {' · '}{LEAVE_TYPE_LABELS[req.leaveType]}
                  </p>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-xs text-red-500 italic">Reason: {req.rejectionReason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <ApproveLeaveModal
          request={approveModal}
          onApprove={() => handleApprove(approveModal.id!)}
          onClose={() => setApproveModal(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <RejectLeaveModal
          request={rejectModal}
          onReject={reason => handleReject(rejectModal.id!, reason)}
          onClose={() => setRejectModal(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve Leave Modal
// ─────────────────────────────────────────────────────────────────────────────

function ApproveLeaveModal({
  request, onApprove, onClose,
}: {
  request: LeaveRequest & { employeeName: string }
  onApprove: () => void
  onClose: () => void
}) {
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [lastLeaves, setLastLeaves] = useState<LeaveRequest[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const [year, month] = request.startDate.split('-').map(Number)
    Promise.all([
      getLeaveBalance(request.employeeId, year, month),
      getLastNLeaves(request.employeeId, 3),
    ]).then(([bal, last]) => { setBalance(bal); setLastLeaves(last) })
  }, [request])

  const handleApprove = async () => {
    setSaving(true)
    try { await onApprove() } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Approve Leave — ${request.employeeName}`} size="md">
      <div className="space-y-4">
        {/* Request details */}
        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Dates</span>
            <span className="font-medium">{request.startDate === request.endDate ? request.startDate : `${request.startDate} → ${request.endDate}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="font-medium">{LEAVE_TYPE_LABELS[request.leaveType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reason</span>
            <span className="font-medium italic">"{request.reason}"</span>
          </div>
        </div>

        {/* Leave balance */}
        {balance && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">Leave Balance — {request.employeeName}</p>
            <p className="text-blue-700">{balance.used} of {balance.allotment} used · <strong>{balance.remaining} remaining</strong> this month</p>
          </div>
        )}

        {/* Last 3 leaves */}
        {lastLeaves.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Last {lastLeaves.length} Leave(s)</p>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-xs">
              {lastLeaves.map(l => (
                <div key={l.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-gray-600">{l.startDate === l.endDate ? l.startDate : `${l.startDate} → ${l.endDate}`}</span>
                  <span className="text-gray-500">{LEAVE_TYPE_LABELS[l.leaveType]}</span>
                  <span className={`rounded-full px-2 py-0.5 ${
                    l.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleApprove} disabled={saving} className="flex items-center gap-2 btn-primary bg-green-600 hover:bg-green-700">
            <CheckCircle size={14} />
            {saving ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject Leave Modal
// ─────────────────────────────────────────────────────────────────────────────

function RejectLeaveModal({
  request, onReject, onClose,
}: {
  request: LeaveRequest & { employeeName: string }
  onReject: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleReject = async () => {
    setSaving(true)
    try { await onReject(reason) } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Reject Leave — ${request.employeeName}`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {request.startDate === request.endDate ? request.startDate : `${request.startDate} → ${request.endDate}`}
          {' · '}{LEAVE_TYPE_LABELS[request.leaveType]}
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rejection Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Insufficient notice"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleReject} disabled={saving || !reason.trim()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
            <XCircle size={14} />
            {saving ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: My Attendance
// ─────────────────────────────────────────────────────────────────────────────

function MyAttendanceTab({ today }: { today: Date }) {
  const { employeeId, addToast } = { ...useAuth(), ...useUiStore() }
  const [todayLog, setTodayLog] = useState<AttendanceLog | undefined>()
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([])
  const [myLogs, setMyLogs] = useState<AttendanceLog[]>([])
  const [viewMonth, setViewMonth] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`)
  const [applyOpen, setApplyOpen] = useState(false)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)

  const load = useCallback(async () => {
    if (!employeeId) return
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const [log, bal, leaves] = await Promise.all([
      getTodayLog(employeeId, 'employee'),
      getLeaveBalance(employeeId, year, month),
      getMyLeaveRequests(employeeId),
    ])
    setTodayLog(log)
    setBalance(bal)
    setMyLeaves(leaves)
  }, [employeeId, today])

  const loadMonthLogs = useCallback(async () => {
    if (!employeeId) return
    const logs = await getMyAttendance(employeeId, viewMonth)
    setMyLogs(logs)
  }, [employeeId, viewMonth])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadMonthLogs() }, [loadMonthLogs])

  const handleClockIn = async () => {
    if (!employeeId) return
    setClockingIn(true)
    try {
      await clockIn(employeeId, 'employee', employeeId)
      addToast('success', 'Clocked in')
      await load()
    } catch { addToast('error', 'Failed to clock in') }
    finally { setClockingIn(false) }
  }

  const handleClockOut = async () => {
    if (!employeeId) return
    setClockingOut(true)
    try {
      await clockOut(employeeId, 'employee', employeeId)
      addToast('success', 'Clocked out')
      await load()
    } catch { addToast('error', 'Failed to clock out') }
    finally { setClockingOut(false) }
  }

  const formatTime = (d?: Date) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'

  return (
    <div className="max-w-xl space-y-5">
      {/* Today card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500">Today</p>
            <p className="font-semibold text-gray-900">{today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {todayLog ? (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[todayLog.status]}`}>
              {todayLog.status === 'half_day' ? 'Half Day' : todayLog.status.charAt(0).toUpperCase() + todayLog.status.slice(1)}
            </span>
          ) : (
            <span className="rounded-full px-3 py-1 text-sm bg-gray-100 text-gray-400">Not Logged</span>
          )}
        </div>

        <div className="flex gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            In: <span className="font-medium text-gray-800">{formatTime(todayLog?.checkIn)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            Out: <span className="font-medium text-gray-800">{formatTime(todayLog?.checkOut)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClockIn}
            disabled={clockingIn || !!todayLog?.checkIn}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <UserCheck size={15} />
            {clockingIn ? 'Clocking In…' : 'Clock In'}
          </button>
          <button
            onClick={handleClockOut}
            disabled={clockingOut || !todayLog?.checkIn || !!todayLog?.checkOut}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 text-white py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            <UserX size={15} />
            {clockingOut ? 'Clocking Out…' : 'Clock Out'}
          </button>
        </div>
      </div>

      {/* Leave balance + apply */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Leave Balance — {today.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
            {balance ? (
              <p className={`text-lg font-bold ${balance.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {balance.remaining} / {balance.allotment} remaining
              </p>
            ) : (
              <p className="text-gray-400 text-sm">Loading…</p>
            )}
          </div>
          <button
            onClick={() => setApplyOpen(true)}
            className="flex items-center gap-2 btn-primary text-sm"
          >
            <Plus size={14} />
            Apply for Leave
          </button>
        </div>

        {/* My leave requests */}
        {myLeaves.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">My Leave Requests</p>
            <div className="space-y-2">
              {myLeaves.map(req => (
                <div key={req.id} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">
                      {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                      {' · '}{LEAVE_TYPE_LABELS[req.leaveType]}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-gray-400 mt-0.5">Reason: {req.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly log */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calendar size={15} /> Monthly Log</p>
          <input
            type="month"
            value={viewMonth}
            onChange={e => setViewMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
          />
        </div>
        {myLogs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No logs for this month</p>
        ) : (
          <div className="space-y-1">
            {myLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs">
                <span className="text-gray-600">{log.date}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[log.status]}`}>
                  {log.status === 'half_day' ? 'Half Day' : log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </span>
                {log.checkIn && (
                  <span className="text-gray-400">
                    {formatTime(log.checkIn)} {log.checkOut ? `→ ${formatTime(log.checkOut)}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {applyOpen && employeeId && (
        <ApplyLeaveModal
          employeeId={employeeId}
          balance={balance}
          today={today}
          onClose={() => setApplyOpen(false)}
          onSaved={async () => { setApplyOpen(false); await load() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Leave Modal
// ─────────────────────────────────────────────────────────────────────────────

function ApplyLeaveModal({
  employeeId, balance, today, onClose, onSaved,
}: {
  employeeId: number
  balance: LeaveBalance | null
  today: Date
  onClose: () => void
  onSaved: () => void
}) {
  const { addToast } = useUiStore()
  const todayStr = today.toISOString().slice(0, 10)
  const [form, setForm] = useState({ startDate: todayStr, endDate: todayStr, leaveType: 'full' as LeaveType, reason: '' })
  const [saving, setSaving] = useState(false)

  const daysRequested = (() => {
    if (form.leaveType !== 'full') return 0.5
    const s = new Date(form.startDate), e = new Date(form.endDate)
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  })()

  const canSubmit = balance ? daysRequested <= balance.remaining : false

  const handleSubmit = async () => {
    if (!form.reason.trim()) { addToast('error', 'Reason is required'); return }
    setSaving(true)
    try {
      await submitLeaveRequest({ employeeId, ...form })
      addToast('success', 'Leave request submitted')
      onSaved()
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Apply for Leave" size="sm">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" value={form.startDate} min={todayStr}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value > f.endDate ? e.target.value : f.endDate }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input type="date" value={form.endDate} min={form.startDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
          <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value as LeaveType }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="full">Full Day</option>
            <option value="half_am">Half Day — Morning</option>
            <option value="half_pm">Half Day — Afternoon</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            rows={2} placeholder="Briefly describe the reason"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>

        {/* Balance info */}
        {balance && (
          <div className={`rounded-lg px-3 py-2 text-xs ${canSubmit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {canSubmit
              ? `You have ${balance.remaining} leave(s) remaining · Requesting ${daysRequested} day(s)`
              : `Insufficient balance — requesting ${daysRequested} day(s) but only ${balance.remaining} remaining`}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !canSubmit} className="btn-primary disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: External Staff (admin only)
// ─────────────────────────────────────────────────────────────────────────────

function ExternalStaffTab({ today }: { today: Date }) {
  const { employeeId, addToast } = { ...useAuth(), ...useUiStore() }
  const [staff, setStaff] = useState<ExternalStaff[]>([])
  const [todayLogs, setTodayLogs] = useState<Map<number, AttendanceLog>>(new Map())
  const [formOpen, setFormOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<ExternalStaff | null>(null)
  const [logging, setLogging] = useState<number | null>(null)
  const todayStr = today.toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const all = await getExternalStaff()
    setStaff(all)
    const [year, month] = [today.getFullYear(), today.getMonth() + 1]
    const board = await getAttendanceBoard(year, month)
    const dayLogs = board.get(todayStr) ?? []
    const map = new Map<number, AttendanceLog>()
    for (const l of dayLogs) {
      if (l.staffType === 'external') map.set(l.staffId, l)
    }
    setTodayLogs(map)
  }, [today, todayStr])

  useEffect(() => { load() }, [load])

  const logStatus = async (staffId: number, status: AttendanceStatus) => {
    setLogging(staffId)
    try {
      await upsertAttendanceLog(staffId, 'external', todayStr, status, employeeId!)
      addToast('success', 'Attendance logged')
      await load()
    } catch { addToast('error', 'Failed') }
    finally { setLogging(null) }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditStaff(null); setFormOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Add External Staff
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Designation</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Today</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map(s => {
              const log = s.id !== undefined ? todayLogs.get(s.id) : undefined
              return (
                <tr key={s.id} className={`hover:bg-gray-50 ${!s.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.designation}</td>
                  <td className="px-4 py-3">
                    {s.isActive
                      ? <span className="text-xs text-green-600 flex items-center gap-1"><UserCheck size={12} /> Active</span>
                      : <span className="text-xs text-gray-400 flex items-center gap-1"><UserX size={12} /> Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.isActive && s.id !== undefined && (
                      <div className="flex justify-center gap-1">
                        {(['present', 'absent', 'half_day'] as AttendanceStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => logStatus(s.id!, st)}
                            disabled={logging === s.id}
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                              log?.status === st ? STATUS_COLORS[st] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {STATUS_LABELS[st]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditStaff(s); setFormOpen(true) }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Edit2 size={13} /></button>
                      <button onClick={() => toggleExternalStaffActive(s.id!).then(load)}
                        className={`rounded p-1 ${s.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                        {s.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {staff.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No external staff added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ExternalStaffModal
          staff={editStaff}
          onClose={() => setFormOpen(false)}
          onSaved={async () => { setFormOpen(false); await load() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// External Staff Add/Edit Modal
// ─────────────────────────────────────────────────────────────────────────────

function ExternalStaffModal({
  staff, onClose, onSaved,
}: {
  staff: ExternalStaff | null
  onClose: () => void
  onSaved: () => void
}) {
  const { addToast } = useUiStore()
  const [form, setForm] = useState({ name: staff?.name ?? '', designation: staff?.designation ?? '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('error', 'Name is required'); return }
    if (!form.designation.trim()) { addToast('error', 'Designation is required'); return }
    setSaving(true)
    try {
      await upsertExternalStaff({
        ...staff,
        name: form.name.trim(),
        designation: form.designation.trim(),
        isActive: staff?.isActive ?? true,
        createdAt: staff?.createdAt ?? new Date(),
      })
      addToast('success', staff ? 'Updated' : 'Added')
      onSaved()
    } catch { addToast('error', 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={staff ? 'Edit External Staff' : 'Add External Staff'} size="sm">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus placeholder="e.g. Ramesh Kumar"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Designation *</label>
          <input type="text" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
            placeholder="e.g. Cleaning Staff, Security, Water Refill"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : staff ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
