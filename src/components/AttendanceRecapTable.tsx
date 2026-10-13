import React, { useState, useMemo } from 'react';
import { AttendanceRecord, AttendanceStatus, Employee } from '../types';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  UploadCloud,
} from 'lucide-react';

interface AttendanceRecapTableProps {
  recapRecords: AttendanceRecord[];
  targetDate: string;
  onTargetDateChange: (date: string) => void;
  onPullLogs: () => void;
  isPullingLogs: boolean;
  onSyncRecapToSheet: (records: AttendanceRecord[]) => void;
  isSyncingRecap: boolean;
  onAddSimulatedScan?: () => void;
}

export const AttendanceRecapTable: React.FC<AttendanceRecapTableProps> = ({
  recapRecords,
  targetDate,
  onTargetDateChange,
  onPullLogs,
  isPullingLogs,
  onSyncRecapToSheet,
  isSyncingRecap,
  onAddSimulatedScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJabatan, setFilterJabatan] = useState<string>('ALL');
  const [filterRegu, setFilterRegu] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Statistics calculation for the day
  const stats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let cuti = 0;
    let tidakHadir = 0;

    recapRecords.forEach((r) => {
      if (r.status === 'Hadir' || r.status === 'Pulang Cepat') hadir++;
      else if (r.status === 'Terlambat') terlambat++;
      else if (r.status === 'Cuti' || r.status === 'Izin') cuti++;
      else tidakHadir++;
    });

    return { hadir, terlambat, cuti, tidakHadir, total: recapRecords.length };
  }, [recapRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return recapRecords.filter((r) => {
      const matchSearch =
        r.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.fingerprint_id).includes(searchTerm);

      const matchJabatan =
        filterJabatan === 'ALL' || r.jabatan.toUpperCase() === filterJabatan;

      const matchRegu =
        filterRegu === 'ALL' || r.regu.toUpperCase() === filterRegu;

      const matchStatus =
        filterStatus === 'ALL' || r.status.toUpperCase() === filterStatus.toUpperCase();

      return matchSearch && matchJabatan && matchRegu && matchStatus;
    });
  }, [recapRecords, searchTerm, filterJabatan, filterRegu, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Tanggal',
      'ID Pegawai',
      'Fingerprint ID',
      'Nama',
      'Jabatan',
      'Regu',
      'Jam Masuk',
      'Jam Pulang',
      'Status',
      'Terlambat (Menit)',
      'Durasi Kerja',
      'Catatan',
    ];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.employeeId,
      r.fingerprint_id,
      `"${r.nama.replace(/"/g, '""')}"`,
      r.jabatan,
      r.regu,
      r.checkIn || '-',
      r.checkOut || '-',
      r.status,
      r.lateMinutes,
      r.workHours,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_absensi_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Daily Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hadir Tepat Waktu</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{stats.hadir}</span>
            <span className="text-[11px] text-slate-400">/ {stats.total} orang</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Terlambat</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              !
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700">{stats.terlambat}</span>
            <span className="text-[11px] text-slate-400">orang</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Izin / Cuti Disetujui</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              ✎
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-700">{stats.cuti}</span>
            <span className="text-[11px] text-slate-400">orang</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Belum Scan / Alpha</span>
            <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
              ✕
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-red-700">{stats.tidakHadir}</span>
            <span className="text-[11px] text-slate-400">orang</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Otomatisasi Rekap Absensi Mesin Fingerprint
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Otomatis Terkalkulasi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data ditarik dari software/mesin fingerprint via Google Apps Script & direkap ke Google Spreadsheet.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    onTargetDateChange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden font-mono"
                />
              </div>

              {/* Pull logs button */}
              <button
                id="btn-pull-fingerprint"
                onClick={onPullLogs}
                disabled={isPullingLogs}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                title="Tarik log terbaru dari mesin/software fingerprint"
              >
                <Clock className={`w-3.5 h-3.5 ${isPullingLogs ? 'animate-spin' : ''}`} />
                <span>{isPullingLogs ? 'Menarik Log...' : 'Tarik Data Mesin'}</span>
              </button>

              {/* Sync recap to sheets */}
              <button
                id="btn-sync-recap-sheet"
                onClick={() => onSyncRecapToSheet(recapRecords)}
                disabled={isSyncingRecap || recapRecords.length === 0}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isSyncingRecap ? 'Menyimpan...' : 'Simpan ke Rekap_Absensi'}</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                title="Ekspor Rekap CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, ID, PIN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <select
                value={filterJabatan}
                onChange={(e) => {
                  setFilterJabatan(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Jabatan</option>
                <option value="STAFF">STAFF</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>

            <div>
              <select
                value={filterRegu}
                onChange={(e) => {
                  setFilterRegu(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Regu</option>
                <option value="-">- (Non-Regu)</option>
                <option value="ALPHA">ALPHA</option>
                <option value="BRAVO">BRAVO</option>
                <option value="CHARLIE">CHARLIE</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Cuti">Cuti</option>
                <option value="Izin">Izin</option>
                <option value="Tidak Hadir">Tidak Hadir (Alpha)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Fingerprint PIN</th>
                <th className="p-3.5">Nama Pegawai</th>
                <th className="p-3.5">Jabatan / Regu</th>
                <th className="p-3.5 text-center">Jam Masuk</th>
                <th className="p-3.5 text-center">Jam Pulang</th>
                <th className="p-3.5 text-center">Durasi</th>
                <th className="p-3.5 text-center">Status Kehadiran</th>
                <th className="p-3.5">Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada data rekap yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {rec.employeeId}
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {rec.fingerprint_id}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {rec.nama}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] font-medium text-slate-700">
                        {rec.jabatan} {rec.regu !== '-' ? `(Regu ${rec.regu})` : ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                      {rec.checkIn || '-'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                      {rec.checkOut || '-'}
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-600">
                      {rec.workHours}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          rec.status === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.status === 'Terlambat'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : rec.status === 'Cuti' || rec.status === 'Izin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500">
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong>{paginatedRecords.length}</strong> dari <strong>{filteredRecords.length}</strong> data pegawai
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
