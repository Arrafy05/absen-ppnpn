export interface Employee {
  id: string;
  fingerprint_id: string | number;
  nama: string;
  jabatan: string;
  regu: string;
  role_app: string;
  status: 'Aktif' | 'Non-Aktif' | string;
  pin?: string;
  lastLoginAt?: string;
  lastSyncedAt?: string;
}

export interface FingerprintRawLog {
  id: string;
  fingerprint_id: string | number;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  type: 'IN' | 'OUT' | 'CHECK';
  device_name?: string;
}

export type AttendanceStatus =
  | 'Hadir'
  | 'Terlambat'
  | 'Pulang Cepat'
  | 'Izin'
  | 'Cuti'
  | 'Tidak Hadir';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  employeeId: string;
  nama: string;
  fingerprint_id: string | number;
  jabatan: string;
  regu: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyMinutes: number;
  workHours: string;
  notes?: string;
  syncedToSheet?: boolean;
}

export type LeaveCategory =
  | 'Cuti Tahunan'
  | 'Izin Sakit'
  | 'Cuti Alasan Penting'
  | 'Izin Keperluan Pribadi'
  | 'Dinas Luar';

export type LeaveStatus = 'Pending' | 'Disetujui' | 'Ditolak';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  category: LeaveCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  reason: string;
  emergencyContact?: string;
  submittedAt: string;
  status: LeaveStatus;
  approvedAt?: string;
  approvedBy?: string;
  adminNote?: string;
  syncedToSheet?: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  method: 'Google Sheets API' | 'Apps Script Webhook' | 'Mesin Fingerprint API';
  target: string;
  rowCount: number;
  status: 'success' | 'error';
  message: string;
  details?: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: string[];
  selectedSheet: string;
}

export type FilterJabatan = 'ALL' | 'STAFF' | 'SECURITY';
export type FilterRegu = 'ALL' | '-' | 'ALPHA' | 'BRAVO' | 'CHARLIE';
export type FilterStatus = 'ALL' | 'Aktif' | 'Non-Aktif';

