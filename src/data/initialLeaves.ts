import { LeaveRequest } from '../types';

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-101',
    employeeId: 'P004',
    employeeName: '333',
    category: 'Cuti Tahunan',
    startDate: today,
    endDate: tomorrow,
    durationDays: 2,
    reason: 'Keperluan keluarga di luar kota',
    emergencyContact: '0812-3456-7890',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'Pending',
  },
  {
    id: 'leave-102',
    employeeId: 'P010',
    employeeName: 'RENI FAUZIAH',
    category: 'Izin Sakit',
    startDate: today,
    endDate: today,
    durationDays: 1,
    reason: 'Pemeriksaan kesehatan rutin di faskes',
    emergencyContact: '0857-9876-5432',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'Disetujui',
    approvedBy: 'Administrator',
    adminNote: 'Disetujui, lekas pulih dan istirahat.',
    approvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];
