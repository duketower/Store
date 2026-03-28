import { db } from '@/db'
import type { AttendanceLog, AttendanceStatus, ExternalStaff, LeaveBalance, LeaveRequest, LeaveStatus, StaffType } from '@/types'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'
import {
  syncAttendanceLogToFirestore,
  syncExternalStaffToFirestore,
  syncLeaveRequestToFirestore,
} from '@/services/firebase/sync'

function serialiseExternalStaff(staff: ExternalStaff & { id: number; syncId: string }) {
  return {
    ...staff,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: (staff.updatedAt ?? staff.createdAt).toISOString(),
  }
}

async function queueExternalStaffSync(staff: ExternalStaff & { id: number; syncId: string }, queuedAt: Date): Promise<void> {
  await queueOutboxEntry({
    action: 'upsert_external_staff',
    entityType: 'external_staff',
    entityKey: staff.syncId,
    payload: JSON.stringify(serialiseExternalStaff(staff)),
    createdAt: queuedAt,
  })
}

function serialiseAttendanceLog(log: AttendanceLog & { syncId: string }) {
  return {
    ...log,
    ...(log.checkIn ? { checkIn: log.checkIn.toISOString() } : { checkIn: null }),
    ...(log.checkOut ? { checkOut: log.checkOut.toISOString() } : { checkOut: null }),
    createdAt: log.createdAt.toISOString(),
  }
}

async function queueAttendanceLogSync(log: AttendanceLog & { syncId: string }, queuedAt: Date): Promise<void> {
  await queueOutboxEntry({
    action: 'upsert_attendance_log',
    entityType: 'attendance_log',
    entityKey: log.syncId,
    payload: JSON.stringify(serialiseAttendanceLog(log)),
    createdAt: queuedAt,
  })
}

function serialiseLeaveRequest(request: LeaveRequest & { syncId: string }) {
  return {
    ...request,
    createdAt: request.createdAt.toISOString(),
    ...(request.approvedAt ? { approvedAt: request.approvedAt.toISOString() } : { approvedAt: null }),
  }
}

async function queueLeaveRequestSync(request: LeaveRequest & { syncId: string }, queuedAt: Date): Promise<void> {
  await queueOutboxEntry({
    action: 'upsert_leave_request',
    entityType: 'leave_request',
    entityKey: request.syncId,
    payload: JSON.stringify(serialiseLeaveRequest(request)),
    createdAt: queuedAt,
  })
}

// ── External Staff ──────────────────────────────────────────────────────────

export async function getExternalStaff(): Promise<ExternalStaff[]> {
  return db.staff_external.orderBy('name').toArray()
}

export async function getActiveExternalStaff(): Promise<ExternalStaff[]> {
  return db.staff_external.where('isActive').equals(1).sortBy('name')
}

export async function upsertExternalStaff(staff: ExternalStaff): Promise<void> {
  const now = new Date()
  const id = staff.id ?? createEntityId()
  const syncId = staff.syncId ?? `external-staff-${id}`
  const saved: ExternalStaff & { id: number; syncId: string } = staff.id
    ? {
        ...staff,
        id,
        syncId,
        updatedAt: now,
      }
    : {
        ...staff,
        id,
        syncId,
        createdAt: staff.createdAt ?? now,
        updatedAt: now,
      }

  await db.transaction('rw', [db.staff_external, db.outbox], async () => {
    await db.staff_external.put(saved)
    await queueExternalStaffSync(saved, now)
  })

  syncExternalStaffToFirestore(saved).catch((err: unknown) =>
    console.warn('[Firestore] external staff sync failed (will retry):', err)
  )
}

export async function toggleExternalStaffActive(id: number): Promise<void> {
  const staff = await db.staff_external.get(id)
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

  const logs = await db.attendance_logs
    .filter(l => l.date.startsWith(prefix))
    .toArray()

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
  return db.attendance_logs
    .filter(l => l.staffId === employeeId && l.staffType === 'employee' && l.date.startsWith(yearMonth))
    .sortBy('date')
}

async function saveAttendanceLog(log: AttendanceLog & { syncId: string }, queuedAt: Date): Promise<void> {
  await db.transaction('rw', [db.attendance_logs, db.outbox], async () => {
    await db.attendance_logs.put(log)
    await queueAttendanceLogSync(log, queuedAt)
  })

  syncAttendanceLogToFirestore(log).catch((err: unknown) =>
    console.warn('[Firestore] attendance log sync failed (will retry):', err)
  )
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
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === date)
    .first()

  const saved: AttendanceLog & { syncId: string } = existing?.id
    ? {
        ...existing,
        syncId: existing.syncId ?? createSyncId('attendance'),
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

  await saveAttendanceLog(saved, now)
}

/** Clock in: set checkIn time + status = present for today. */
export async function clockIn(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === today)
    .first()

  const saved: AttendanceLog & { syncId: string } = existing?.id
    ? {
        ...existing,
        syncId: existing.syncId ?? createSyncId('attendance'),
        checkIn: now,
        status: 'present',
        loggedBy,
      }
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

  await saveAttendanceLog(saved, now)
}

/** Clock out: update checkOut time on today's existing log. */
export async function clockOut(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === today)
    .first()

  const saved: AttendanceLog & { syncId: string } = existing?.id
    ? {
        ...existing,
        syncId: existing.syncId ?? createSyncId('attendance'),
        checkOut: now,
        loggedBy,
      }
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

  await saveAttendanceLog(saved, now)
}

/** Get today's attendance log for a specific employee (or undefined if none). */
export async function getTodayLog(staffId: number, staffType: StaffType): Promise<AttendanceLog | undefined> {
  const today = new Date().toISOString().slice(0, 10)
  return db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === today)
    .first()
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
  const employee = await db.employees.get(employeeId)
  const allotment = employee?.monthlyLeaveAllotment ?? 3

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthPrefix = `${year}-${pad(month)}`

  const approvedThisMonth = await db.leave_requests
    .filter(r =>
      r.employeeId === employeeId &&
      r.status === 'approved' &&
      r.startDate.startsWith(monthPrefix)
    )
    .toArray()

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

  await db.transaction('rw', [db.leave_requests, db.outbox], async () => {
    await db.leave_requests.put(leaveRequest)
    await queueLeaveRequestSync(leaveRequest, now)
  })

  syncLeaveRequestToFirestore(leaveRequest).catch((err: unknown) =>
    console.warn('[Firestore] leave request sync failed (will retry):', err)
  )
}

/** Approve a leave request and auto-create attendance_log rows for each leave date. */
export async function approveLeave(id: number, approvedBy: number): Promise<void> {
  const req = await db.leave_requests.get(id)
  if (!req) return

  const now = new Date()
  const savedRequest: LeaveRequest & { syncId: string } = {
    ...req,
    syncId: req.syncId ?? createSyncId('leave'),
    status: 'approved',
    approvedBy,
    approvedAt: now,
  }

  const logsToSync: Array<AttendanceLog & { syncId: string }> = []

  await db.transaction('rw', [db.leave_requests, db.attendance_logs, db.outbox], async () => {
    await db.leave_requests.put(savedRequest)
    await queueLeaveRequestSync(savedRequest, now)

    const start = new Date(req.startDate)
    const end = new Date(req.endDate)
    const status: AttendanceStatus = req.leaveType === 'full' ? 'leave' : 'half_day'
    const note = `Leave: ${req.leaveType === 'full' ? 'Full Day' : req.leaveType === 'half_am' ? 'Half Day AM' : 'Half Day PM'}`

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10)
      const existingLog = await db.attendance_logs
        .filter((log) => log.staffId === req.employeeId && log.staffType === 'employee' && log.date === dateStr)
        .first()

      const savedLog: AttendanceLog & { syncId: string } = existingLog?.id
        ? {
            ...existingLog,
            syncId: existingLog.syncId ?? createSyncId('attendance'),
            status,
            notes: note,
            loggedBy: approvedBy,
          }
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

      await db.attendance_logs.put(savedLog)
      await queueAttendanceLogSync(savedLog, now)
      logsToSync.push(savedLog)
    }
  })

  syncLeaveRequestToFirestore(savedRequest).catch((err: unknown) =>
    console.warn('[Firestore] leave request sync failed (will retry):', err)
  )
  for (const log of logsToSync) {
    syncAttendanceLogToFirestore(log).catch((err: unknown) =>
      console.warn('[Firestore] attendance log sync failed (will retry):', err)
    )
  }
}

/** Reject a leave request with a reason. */
export async function rejectLeave(id: number, approvedBy: number, reason: string): Promise<void> {
  const req = await db.leave_requests.get(id)
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

  await db.transaction('rw', [db.leave_requests, db.outbox], async () => {
    await db.leave_requests.put(savedRequest)
    await queueLeaveRequestSync(savedRequest, now)
  })

  syncLeaveRequestToFirestore(savedRequest).catch((err: unknown) =>
    console.warn('[Firestore] leave request sync failed (will retry):', err)
  )
}

/** Get all leave requests, optionally filtered by status. Newest first. */
export async function getLeaveRequests(status?: LeaveStatus): Promise<LeaveRequest[]> {
  const all = status
    ? await db.leave_requests.where('status').equals(status).toArray()
    : await db.leave_requests.orderBy('createdAt').toArray()
  return all.reverse()
}

/** Get all leave requests for a specific employee. Newest first. */
export async function getMyLeaveRequests(employeeId: number): Promise<LeaveRequest[]> {
  const all = await db.leave_requests.where('employeeId').equals(employeeId).toArray()
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/** Get last N leave requests (any final status) for an employee — shown in approval modal. */
export async function getLastNLeaves(employeeId: number, n: number): Promise<LeaveRequest[]> {
  const finalised = await db.leave_requests
    .filter(r => r.employeeId === employeeId && (r.status === 'approved' || r.status === 'rejected'))
    .toArray()
  return finalised
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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

  const [employees, externalStaff, allLogs, allLeaves] = await Promise.all([
    db.employees.where('isActive').equals(1).toArray(),
    db.staff_external.where('isActive').equals(1).toArray(),
    db.attendance_logs.filter(l => l.date.startsWith(monthPrefix)).toArray(),
    db.leave_requests.filter(r => r.startDate.startsWith(monthPrefix)).toArray(),
  ])

  const rows: LeaveExportRow[] = []

  for (const emp of employees) {
    if (!emp.id) continue
    const myLogs = allLogs.filter(l => l.staffId === emp.id && l.staffType === 'employee')
    const myLeaves = allLeaves.filter(r => r.employeeId === emp.id)
    const allotment = emp.monthlyLeaveAllotment ?? 3
    const approved = myLeaves.filter(r => r.status === 'approved')
    const leaveDaysUsed = approved.reduce((s, r) => s + countLeaveDays(r), 0)

    rows.push({
      name: emp.name,
      roleOrDesignation: emp.role,
      month: monthLabel,
      allotment,
      present: myLogs.filter(l => l.status === 'present').length,
      absent: myLogs.filter(l => l.status === 'absent').length,
      halfDay: myLogs.filter(l => l.status === 'half_day').length,
      leaveDaysUsed,
      remainingBalance: Math.max(0, allotment - leaveDaysUsed),
      pendingLeaves: myLeaves.filter(r => r.status === 'pending').length,
    })
  }

  for (const ext of externalStaff) {
    if (!ext.id) continue
    const myLogs = allLogs.filter(l => l.staffId === ext.id && l.staffType === 'external')
    rows.push({
      name: ext.name,
      roleOrDesignation: ext.designation,
      month: monthLabel,
      allotment: 0,
      present: myLogs.filter(l => l.status === 'present').length,
      absent: myLogs.filter(l => l.status === 'absent').length,
      halfDay: myLogs.filter(l => l.status === 'half_day').length,
      leaveDaysUsed: 0,
      remainingBalance: 0,
      pendingLeaves: 0,
    })
  }

  return rows
}
