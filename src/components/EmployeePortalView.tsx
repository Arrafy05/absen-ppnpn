import React from 'react';
import { Employee, AttendanceRecord, LeaveRequest, FingerprintRawLog } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Fingerprint,
  FileCheck,
  Shield,
  Briefcase,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  KeyRound,
  LogOut,
} from 'lucide-react';

interface EmployeePortalViewProps {
  employee: Employee;
  todayRecord: AttendanceRecord | undefined;
  employeeLeaves: LeaveRequest[];
  todayLogs: FingerprintRawLog[];
  onOpenLeaveModal: () => void;
  onOpenChangePin?: () => void;
  onLogout?: () => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  employee,
  todayRecord,
  employeeLeaves,
  todayLogs,
  onOpenLeaveModal,
  onOpenChangePin,
  onLogout,
}) => {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingLeaves = employeeLeaves.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = employeeLeaves.filter((l) => l.status === 'Disetujui').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Privacy Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Sesi Privat Aktif:</strong> Anda sedang masuk sebagai <strong>{employee.nama}</strong>. Data absensi dan cuti ini dilindungi dan tidak dapat dibuka rekan kerja lain tanpa PIN Anda.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenChangePin && (
            <button
              onClick={onOpenChangePin}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-emerald-600" />
              <span>Ganti PIN</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 rounded-lg bg-red-100/70 hover:bg-red-200 text-red-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-red-600" />
              <span>Kunci / Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Greeting & Quick Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {employee.nama.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{employee.nama}</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {employee.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono font-semibold text-slate-700">ID: {employee.id}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-purple-700 font-semibold">
                <Fingerprint className="w-3.5 h-3.5" /> PIN: {employee.fingerprint_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                <Briefcase className="w-3.5 h-3.5" /> {employee.jabatan} {employee.regu !== '-' ? `(Regu ${employee.regu})` : ''}
              </span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={onOpenLeaveModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajukan Izin / Cuti Baru</span>
          </button>
        </div>
      </div>

      {/* Attendance Status Today & Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Live Status */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Kehadiran Hari Ini</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{todayStr}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Jam Masuk (Check-In)</span>
              <span className="text-base font-bold font-mono text-slate-800">
                {todayRecord?.checkIn || '--:--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Jam Pulang (Check-Out)</span>
              <span className="text-base font-bold font-mono text-slate-800">
                {todayRecord?.checkOut || '--:--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Status Kehadiran</span>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  todayRecord?.status === 'Hadir'
                    ? 'bg-emerald-100 text-emerald-800'
                    : todayRecord?.status === 'Terlambat'
                    ? 'bg-amber-100 text-amber-800'
                    : todayRecord?.status === 'Cuti' || todayRecord?.status === 'Izin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {todayRecord?.status || 'Belum Scan'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-600" />
              <span>
                {todayLogs.length > 0
                  ? `Terdeteksi ${todayLogs.length} kali penempelan jari pada mesin fingerprint hari ini.`
                  : 'Belum ada data scan sidik jari di mesin untuk PIN Anda hari ini.'}
              </span>
            </div>
            {todayRecord?.workHours && todayRecord.workHours !== '-' && (
              <span className="font-semibold text-slate-700">Durasi: {todayRecord.workHours}</span>
            )}
          </div>
        </div>

        {/* Leave Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">Ringkasan Pengajuan Cuti</span>
          </div>

          <div className="space-y-2.5 my-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600">Total Pengajuan Anda:</span>
              <span className="font-bold text-slate-900">{employeeLeaves.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
              <span>Menunggu Persetujuan:</span>
              <span className="font-bold">{pendingLeaves}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
              <span>Disetujui Admin:</span>
              <span className="font-bold">{approvedLeaves}</span>
            </div>
          </div>

          <button
            onClick={onOpenLeaveModal}
            className="w-full py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          >
            Formulir Izin / Cuti
          </button>
        </div>
      </div>

      {/* Leave Requests Table for this employee */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Pengajuan Izin & Cuti Anda
            </h3>
            <p className="text-xs text-slate-500">
              Status pengajuan cuti langsung disinkronkan dengan persetujuan Administrator dan Google Sheets.
            </p>
          </div>
        </div>

        {employeeLeaves.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium text-slate-600">
              Anda belum memiliki riwayat pengajuan cuti atau izin.
            </p>
            <button
              onClick={onOpenLeaveModal}
              className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
            >
              Ajukan permohonan pertama sekarang &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal Permohonan</th>
                  <th className="p-3.5">Jenis Cuti / Izin</th>
                  <th className="p-3.5">Rentang Tanggal</th>
                  <th className="p-3.5 text-center">Durasi</th>
                  <th className="p-3.5">Alasan</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Catatan Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 text-[11px] text-slate-500 font-mono">
                      {leave.submittedAt.slice(0, 10)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {leave.category}
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {leave.startDate} s/d {leave.endDate}
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      {leave.durationDays} hari
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-slate-700" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          leave.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : leave.status === 'Ditolak'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {leave.status === 'Disetujui' && <CheckCircle2 className="w-3 h-3" />}
                        {leave.status === 'Ditolak' && <AlertCircle className="w-3 h-3" />}
                        {leave.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {leave.status === 'Pending' ? 'Menunggu' : leave.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 italic text-[11px]">
                      {leave.adminNote ? (
                        <span>{leave.adminNote}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
