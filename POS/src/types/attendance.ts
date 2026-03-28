// Types for the Leave & Attendance Management feature.
// External staff = non-app staff (cleaning, water refill, security, etc.) who have no POS login.

export interface ExternalStaff {
  id?: number
  syncId?: string
  name: string
  designation: string   // e.g. 'Cleaning Staff', 'Water Refill', 'Security'
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave'
export type StaffType = 'employee' | 'external'

export interface AttendanceLog {
  id?: number
  syncId?: string
  staffId: number       // employees.id or staff_external.id depending on staffType
  staffType: StaffType
  date: string          // YYYY-MM-DD
  checkIn?: Date
  checkOut?: Date
  status: AttendanceStatus
  notes?: string
  loggedBy: number      // employeeId of admin/manager who created this entry
  createdAt: Date
}

export type LeaveType = 'full' | 'half_am' | 'half_pm'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id?: number
  syncId?: string
  employeeId: number
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD (same as startDate for single-day requests)
  leaveType: LeaveType
  reason: string
  status: LeaveStatus
  approvedBy?: number   // employeeId of admin who acted on it
  approvedAt?: Date
  rejectionReason?: string
  createdAt: Date
}

// Computed on the fly — never stored in DB.
export interface LeaveBalance {
  allotment: number     // employee.monthlyLeaveAllotment (default 3)
  used: number          // approved leaves this month: full = 1, half = 0.5
  remaining: number     // allotment - used
}
