import type { AttendanceLog, AttendanceStatus, ExternalStaff, LeaveBalance, LeaveRequest, LeaveStatus, StaffType } from '@/types'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import {
  syncAttendanceLogToFirestore,
  syncExternalStaffToFirestore,
  syncLeaveRequestToFirestore,
} from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

// ── External Staff ──────────────────────────────────────────────────────────

export async function getExternalStaff(): Promise<ExternalStaff[]> {
  const staff = useFirestoreDataStore.getState().staffExternal
  return [...staff].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getActiveExternalStaff(): Promise<ExternalStaff[]> {
  const staff = useFirestoreDataStore.getState().staffExternal
  return [...staff].filter((s) => s.isActive).sort((a, b) => a.name.localeCompare(b.name))
}

export async function upsertExternalStaff(staff: ExternalStaff): Promise<void> {
  const now = new Date()
  const id = staff.id ?? createEntityId()
  const syncId = staff.syncId ?? `external-staff-${id}`
  const saved: ExternalStaff & { id: number; syncId: string } = staff.id
    ? { ...staff, id, syncId, updatedAt: now }
    : { ...staff, id, syncId, createdAt: staff.createdAt ?? now, updatedAt: now }

  await syncExternalStaffToFirestore(saved)
}

export async function toggleExternalStaffActive(id: number): Promise<void> {
  const staff = useFirestoreDataStore.getState().staffExternal.find((s) => s.id === id)
  if (!staff) return
  await upsertExternalStaff({ ...staff, isActive: !staff.isActive })
}

// ── Attendance Logs ─────────────────────────────────────────────────────────

/** Fetch all attendance logs for a given month. Returns map: date → logs for that date. */
export async function getAttendanceBoard(
  year: number,
  month: number  // 1-based
): Promise<Map<string, AttendanceLog[]>> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const prefix = `${year}-${pad(month)}-`

  const logs = useFirestoreDataStore.getState().attendanceLogs.filter((l) => l.date.startsWith(prefix))

  const map = new Map<string, AttendanceLog[]>()
  for (const log of logs) {
    const arr = map.get(log.date) ?? []
    arr.push(log)
    map.set(log.date, arr)
  }
  return map
}

/** Get all attendance logs for a specific employee in a given month (YYYY-MM). */
export async function getMyAttendance(employeeId: number, yearMonth: string): Promise<AttendanceLog[]> {
  const logs = useFirestoreDataStore.getState().attendanceLogs
  return [...logs]
    .filter((l) => l.staffId === employeeId && l.staffType === 'employee' && l.date.startsWith(yearMonth))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function saveAttendanceLog(log: AttendanceLog & { syncId: string }): Promise<void> {
  await syncAttendanceLogToFirestore(log)
}

/** Create or update the attendance log for a given staff member on a given date. */
export async function upsertAttendanceLog(
  staffId: number,
  staffType: StaffType,
  date: string,
  status: AttendanceStatus,
  loggedBy: number,
  extra?: { checkIn?: Date; checkOut?: Date; notes?: string }
): Promise<void> {
  const now = new Date()
  const existing = useFirestoreDataStore.getState().attendanceLogs.find(
    (l) => l.staffId === staffId && l.staffType === staffType && l.date === date
  )

  const saved: AttendanceLog & { syncId: string } = existing?.syncId
    ? {
        ...existing,
        syncId: existing.syncId,
        status,
        loggedBy,
        ...(extra?.checkIn !== undefined ? { checkIn: extra.checkIn } : {}),
        ...(extra?.checkOut !== undefined ? { checkOut: extra.checkOut } : {}),
        ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
      }
    : {
        syncId: createSyncId('attendance'),
        staffId,
        staffType,
        date,
        status,
        loggedBy,
        ...(extra?.checkIn !== undefined ? { checkIn: extra.checkIn } : {}),
        ...(extra?.checkOut !== undefined ? { checkOut: extra.checkOut } : {}),
        ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
        createdAt: now,
      }

  await saveAttendanceLog(saved)
}

/** Clock in: set checkIn time + status = present for today. */
export async function clockIn(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const existing = useFirestoreDataStore.getState().attendanceLogs.find(
    (l) => l.staffId === staffId && l.staffType === staffType && l.date === today
  )

  const saved: AttendanceLog & { syncId: string } = existing?.syncId
    ? { ...existing, syncId: existing.syncId, checkIn: now, status: 'present', loggedBy }
    : {
        syncId: createSyncId('attendance'),
        staffId,
        staffType,
        date: today,
        status: 'present',
        checkIn: now,
        loggedBy,
        createdAt: now,
      }

  await saveAttendanceLog(saved)
}

/** Clock out: update checkOut time on today's existing log. */
export async function clockOut(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const existing = useFirestoreDataStore.getState().attendanceLogs.find(
    (l) => l.staffId === staffId && l.staffType === staffType && l.date === today
  )

  const saved: AttendanceLog & { syncId: string } = existing?.syncId
    ? { ...existing, syncId: existing.syncId, checkOut: now, loggedBy }
    : {
        syncId: createSyncId('attendance'),
        staffId,
        staffType,
        date: today,
        status: 'present',
        checkOut: now,
        loggedBy,
        createdAt: now,
      }

  await saveAttendanceLog(saved)
}

/** Get today's attendance log for a specific employee (or undefined if none). */
export async function getTodayLog(staffId: number, staffType: StaffType): Promise<AttendanceLog | undefined> {
  const today = new Date().toISOString().slice(0, 10)
  return useFirestoreDataStore.getState().attendanceLogs.find(
    (l) => l.staffId === staffId && l.staffType === staffType && l.date === today
  )
}

// ── Leave Requests ──────────────────────────────────────────────────────────

/** Count days in a leave request: multi-day full = N, any half = 0.5. */
function countLeaveDays(req: Pick<LeaveRequest, 'startDate' | 'endDate' | 'leaveType'>): number {
  if (req.leaveType === 'half_am' || req.leaveType === 'half_pm') return 0.5
  const start = new Date(req.startDate)
  const end = new Date(req.endDate)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1
}

/** Compute leave balance for a given employee in a given month. */
export async function getLeaveBalance(
  employeeId: number,
  year: number,
  month: number  // 1-based
): Promise<LeaveBalance> {
  const { employees, leaveRequests } = useFirestoreDataStore.getState()
  const employee = employees.find((e) => e.id === employeeId)
  const allotment = employee?.monthlyLeaveAllotment ?? 3

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthPrefix = `${year}-${pad(month)}`

  const approvedThisMonth = leaveRequests.filter(
    (r) =>
      r.employeeId === employeeId &&
      r.status === 'approved' &&
      r.startDate.startsWith(monthPrefix)
  )

  const used = approvedThisMonth.reduce((sum, r) => sum + countLeaveDays(r), 0)
  return { allotment, used, remaining: Math.max(0, allotment - used) }
}

/**
 * Submit a new leave request.
 * Throws if the employee has insufficient balance for this month.
 */
export async function submitLeaveRequest(
  request: Omit<LeaveRequest, 'id' | 'syncId' | 'status' | 'createdAt'>
): Promise<void> {
  const now = new Date()
  const [year, month] = request.startDate.split('-').map(Number)
  const balance = await getLeaveBalance(request.employeeId, year, month)
  const daysRequested = countLeaveDays(request as LeaveRequest)

  if (daysRequested > balance.remaining) {
    throw new Error(
      `Insufficient leave balance. Requested ${daysRequested} day(s), only ${balance.remaining} remaining this month.`
    )
  }

  const leaveRequest: LeaveRequest & { syncId: string } = {
    ...request,
    syncId: createSyncId('leave'),
    status: 'pending',
    createdAt: now,
  }

  await syncLeaveRequestToFirestore(leaveRequest)
}

/** Approve a leave request and auto-create attendance_log rows for each leave date. */
export async function approveLeave(syncId: string, approvedBy: number): Promise<void> {
  const { leaveRequests } = useFirestoreDataStore.getState()
  const req = leaveRequests.find((r) => r.syncId === syncId)
  if (!req) return

  const now = new Date()
  const savedRequest: LeaveRequest & { syncId: string } = {
    ...req,
    syncId: req.syncId ?? createSyncId('leave'),
    status: 'approved',
    approvedBy,
    approvedAt: now,
  }

  await syncLeaveRequestToFirestore(savedRequest)

  const start = new Date(req.startDate)
  const end = new Date(req.endDate)
  const status: AttendanceStatus = req.leaveType === 'full' ? 'leave' : 'half_day'
  const note = `Leave: ${req.leaveType === 'full' ? 'Full Day' : req.leaveType === 'half_am' ? 'Half Day AM' : 'Half Day PM'}`

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    const existing = useFirestoreDataStore.getState().attendanceLogs.find(
      (log) => log.staffId === req.employeeId && log.staffType === 'employee' && log.date === dateStr
    )

    const savedLog: AttendanceLog & { syncId: string } = existing?.syncId
      ? { ...existing, syncId: existing.syncId, status, notes: note, loggedBy: approvedBy }
      : {
          syncId: createSyncId('attendance'),
          staffId: req.employeeId,
          staffType: 'employee',
          date: dateStr,
          status,
          notes: note,
          loggedBy: approvedBy,
          createdAt: now,
        }

    await syncAttendanceLogToFirestore(savedLog)
  }
}

/** Reject a leave request with a reason. */
export async function rejectLeave(syncId: string, approvedBy: number, reason: string): Promise<void> {
  const { leaveRequests } = useFirestoreDataStore.getState()
  const req = leaveRequests.find((r) => r.syncId === syncId)
  if (!req) return

  const now = new Date()
  const savedRequest: LeaveRequest & { syncId: string } = {
    ...req,
    syncId: req.syncId ?? createSyncId('leave'),
    status: 'rejected',
    approvedBy,
    approvedAt: now,
    rejectionReason: reason,
  }

  await syncLeaveRequestToFirestore(savedRequest)
}

/** Get all leave requests, optionally filtered by status. Newest first. */
export async function getLeaveRequests(status?: LeaveStatus): Promise<LeaveRequest[]> {
  const all = useFirestoreDataStore.getState().leaveRequests
  const filtered = status ? all.filter((r) => r.status === status) : all
  return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Get all leave requests for a specific employee. Newest first. */
export async function getMyLeaveRequests(employeeId: number): Promise<LeaveRequest[]> {
  const all = useFirestoreDataStore.getState().leaveRequests
  return all
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Get last N leave requests (any final status) for an employee — shown in approval modal. */
export async function getLastNLeaves(employeeId: number, n: number): Promise<LeaveRequest[]> {
  const all = useFirestoreDataStore.getState().leaveRequests
  return all
    .filter((r) => r.employeeId === employeeId && (r.status === 'approved' || r.status === 'rejected'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, n)
}

// ── CSV Export ───────────────────────────────────────────────────────────────

export interface LeaveExportRow {
  name: string
  roleOrDesignation: string
  month: string
  allotment: number
  present: number
  absent: number
  halfDay: number
  leaveDaysUsed: number
  remainingBalance: number
  pendingLeaves: number
}

/** Generate per-employee leave summary for a full calendar year (for CSV export). */
export async function getLeaveExport(year: number, month: number): Promise<LeaveExportRow[]> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthPrefix = `${year}-${pad(month)}`
  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const { employees, staffExternal, attendanceLogs, leaveRequests } = useFirestoreDataStore.getState()

  const activeEmployees = employees.filter((e) => e.isActive)
  const activeExternal = staffExternal.filter((s) => s.isActive)
  const allLogs = attendanceLogs.filter((l) => l.date.startsWith(monthPrefix))
  const allLeaves = leaveRequests.filter((r) => r.startDate.startsWith(monthPrefix))

  const rows: LeaveExportRow[] = []

  for (const emp of activeEmployees) {
    if (!emp.id) continue
    const myLogs = allLogs.filter((l) => l.staffId === emp.id && l.staffType === 'employee')
    const myLeaves = allLeaves.filter((r) => r.employeeId === emp.id)
    const allotment = emp.monthlyLeaveAllotment ?? 3
    const approved = myLeaves.filter((r) => r.status === 'approved')
    const leaveDaysUsed = approved.reduce((s, r) => s + countLeaveDays(r), 0)

    rows.push({
      name: emp.name,
      roleOrDesignation: emp.role,
      month: monthLabel,
      allotment,
      present: myLogs.filter((l) => l.status === 'present').length,
      absent: myLogs.filter((l) => l.status === 'absent').length,
      halfDay: myLogs.filter((l) => l.status === 'half_day').length,
      leaveDaysUsed,
      remainingBalance: Math.max(0, allotment - leaveDaysUsed),
      pendingLeaves: myLeaves.filter((r) => r.status === 'pending').length,
    })
  }

  for (const ext of activeExternal) {
    if (!ext.id) continue
    const myLogs = allLogs.filter((l) => l.staffId === ext.id && l.staffType === 'external')
    rows.push({
      name: ext.name,
      roleOrDesignation: ext.designation,
      month: monthLabel,
      allotment: 0,
      present: myLogs.filter((l) => l.status === 'present').length,
      absent: myLogs.filter((l) => l.status === 'absent').length,
      halfDay: myLogs.filter((l) => l.status === 'half_day').length,
      leaveDaysUsed: 0,
      remainingBalance: 0,
      pendingLeaves: 0,
    })
  }

  return rows
}
