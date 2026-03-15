import { db } from '@/db'
import type { AttendanceLog, AttendanceStatus, ExternalStaff, LeaveBalance, LeaveRequest, LeaveStatus, StaffType } from '@/types'

// ── External Staff ──────────────────────────────────────────────────────────

export async function getExternalStaff(): Promise<ExternalStaff[]> {
  return db.staff_external.orderBy('name').toArray()
}

export async function getActiveExternalStaff(): Promise<ExternalStaff[]> {
  return db.staff_external.where('isActive').equals(1).sortBy('name')
}

export async function upsertExternalStaff(staff: ExternalStaff): Promise<void> {
  if (staff.id) {
    await db.staff_external.update(staff.id, { name: staff.name, designation: staff.designation, isActive: staff.isActive })
  } else {
    await db.staff_external.add({ ...staff, createdAt: new Date() })
  }
}

export async function toggleExternalStaffActive(id: number): Promise<void> {
  const staff = await db.staff_external.get(id)
  if (staff) await db.staff_external.update(id, { isActive: !staff.isActive })
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

/** Create or update the attendance log for a given staff member on a given date. */
export async function upsertAttendanceLog(
  staffId: number,
  staffType: StaffType,
  date: string,
  status: AttendanceStatus,
  loggedBy: number,
  extra?: { checkIn?: Date; checkOut?: Date; notes?: string }
): Promise<void> {
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === date)
    .first()

  if (existing?.id) {
    await db.attendance_logs.update(existing.id, { status, ...extra })
  } else {
    await db.attendance_logs.add({
      staffId, staffType, date, status, loggedBy,
      checkIn: extra?.checkIn,
      checkOut: extra?.checkOut,
      notes: extra?.notes,
      createdAt: new Date(),
    })
  }
}

/** Clock in: set checkIn time + status = present for today. */
export async function clockIn(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === today)
    .first()

  if (existing?.id) {
    await db.attendance_logs.update(existing.id, { checkIn: now, status: 'present' })
  } else {
    await db.attendance_logs.add({
      staffId, staffType, date: today, status: 'present',
      checkIn: now, loggedBy, createdAt: now,
    })
  }
}

/** Clock out: update checkOut time on today's existing log. */
export async function clockOut(staffId: number, staffType: StaffType, loggedBy: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const existing = await db.attendance_logs
    .filter(l => l.staffId === staffId && l.staffType === staffType && l.date === today)
    .first()

  if (existing?.id) {
    await db.attendance_logs.update(existing.id, { checkOut: new Date() })
  } else {
    // Edge case: clocking out without clocking in — still record it
    await db.attendance_logs.add({
      staffId, staffType, date: today, status: 'present',
      checkOut: new Date(), loggedBy, createdAt: new Date(),
    })
  }
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
  request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>
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

  await db.leave_requests.add({
    ...request,
    status: 'pending',
    createdAt: now,
  })
}

/** Approve a leave request and auto-create attendance_log rows for each leave date. */
export async function approveLeave(id: number, approvedBy: number): Promise<void> {
  const req = await db.leave_requests.get(id)
  if (!req) return

  await db.leave_requests.update(id, {
    status: 'approved',
    approvedBy,
    approvedAt: new Date(),
  })

  // Write an attendance_log row for each date in the range
  const start = new Date(req.startDate)
  const end = new Date(req.endDate)
  const status: AttendanceStatus = req.leaveType === 'full' ? 'leave' : 'half_day'

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    await upsertAttendanceLog(req.employeeId, 'employee', dateStr, status, approvedBy, {
      notes: `Leave: ${req.leaveType === 'full' ? 'Full Day' : req.leaveType === 'half_am' ? 'Half Day AM' : 'Half Day PM'}`,
    })
  }
}

/** Reject a leave request with a reason. */
export async function rejectLeave(id: number, approvedBy: number, reason: string): Promise<void> {
  await db.leave_requests.update(id, {
    status: 'rejected',
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: reason,
  })
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
