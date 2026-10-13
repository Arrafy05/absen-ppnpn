import React, { useState } from 'react';
import { LeaveRequest, LeaveStatus } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  MessageSquare,
  FileCheck,
  Send,
  Calendar,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';

interface LeaveManagementTabProps {
  leaves: LeaveRequest[];
  onApprove: (id: string, adminNote?: string) => void;
  onReject: (id: string, adminNote?: string) => void;
  onSyncLeavesToSheet: (leaves: LeaveRequest[]) => void;
  isSyncingLeaves: boolean;
}

export const LeaveManagementTab: React.FC<LeaveManagementTabProps> = ({
  leaves,
  onApprove,
  onReject,
  onSyncLeavesToSheet,
  isSyncingLeaves,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | LeaveStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeaveForAction, setSelectedLeaveForAction] = useState<{
    leave: LeaveRequest;
    type: 'approve' | 'reject';
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const filteredLeaves = leaves.filter((l) => {
    const matchStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const matchSearch =
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Disetujui').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Ditolak').length;

  const handleOpenAction = (leave: LeaveRequest, type: 'approve' | 'reject') => {
    setSelectedLeaveForAction({ leave, type });
    setAdminNoteInput(type === 'approve' ? 'Disetujui, selamat beristirahat.' : 'Mohon maaf, permohonan belum dapat disetujui karena kebutuhan operasional.');
  };

  const handleConfirmAction = () => {
    if (!selectedLeaveForAction) return;
    if (selectedLeaveForAction.type === 'approve') {
      onApprove(selectedLeaveForAction.leave.id, adminNoteInput);
    } else {
      onReject(selectedLeaveForAction.leave.id, adminNoteInput);
    }
    setSelectedLeaveForAction(null);
  };

  return (
    <div className="space-y-4">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800">Menunggu Persetujuan Admin</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount} Pengajuan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800">Telah Disetujui</span>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{approvedCount} Pengajuan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-800">Ditolak</span>
            <div className="text-2xl font-bold text-red-900 mt-1">{rejectedCount} Pengajuan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Persetujuan & Manajemen Izin Cuti Pegawai
            </h2>
            <p className="text-xs text-slate-500">
              Setujui atau tolak permohonan izin cuti pegawai PPNPN. Data otomatis terhubung ke rekap absensi harian dan spreadsheet.
            </p>
          </div>

          <button
            onClick={() => onSyncLeavesToSheet(leaves)}
            disabled={isSyncingLeaves || leaves.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isSyncingLeaves ? 'Menyimpan...' : 'Sinkronkan ke Sheet Data_Cuti'}</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({leaves.length})
            </button>
            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'Pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('Disetujui')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'Disetujui' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disetujui ({approvedCount})
            </button>
            <button
              onClick={() => setFilterStatus('Ditolak')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'Ditolak' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ditolak ({rejectedCount})
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pegawai, alasan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Pegawai</th>
                <th className="p-3.5">Jenis Permohonan</th>
                <th className="p-3.5">Periode Tanggal</th>
                <th className="p-3.5 text-center">Durasi</th>
                <th className="p-3.5">Alasan / Kontak</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada pengajuan cuti yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{leave.employeeName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{leave.employeeId}</div>
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
                    <td className="p-3.5 max-w-xs">
                      <div className="text-slate-800 truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                      {leave.emergencyContact && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Kontak: {leave.emergencyContact}
                        </div>
                      )}
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
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {leave.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAction(leave, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleOpenAction(leave, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs transition cursor-pointer"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">
                          {leave.adminNote ? `"${leave.adminNote}"` : `Telah ${leave.status.toLowerCase()}`}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Admin Note Modal */}
      {selectedLeaveForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {selectedLeaveForAction.type === 'approve'
                ? 'Setujui Pengajuan Izin / Cuti'
                : 'Tolak Pengajuan Izin / Cuti'}
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <strong>Pegawai:</strong> {selectedLeaveForAction.leave.employeeName} ({selectedLeaveForAction.leave.employeeId})
              </div>
              <div>
                <strong>Permohonan:</strong> {selectedLeaveForAction.leave.category} ({selectedLeaveForAction.leave.durationDays} hari)
              </div>
              <div>
                <strong>Periode:</strong> {selectedLeaveForAction.leave.startDate} s/d {selectedLeaveForAction.leave.endDate}
              </div>
              <div>
                <strong>Alasan:</strong> {selectedLeaveForAction.leave.reason}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Keterangan dari Administrator:
              </label>
              <textarea
                rows={2}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLeaveForAction(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 text-xs text-white font-semibold rounded-lg shadow-xs transition ${
                  selectedLeaveForAction.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {selectedLeaveForAction.type === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
