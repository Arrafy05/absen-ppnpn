import React, { useState } from 'react';
import { Employee, LeaveCategory, LeaveRequest } from '../types';
import { X, Calendar, FileText, Phone, Send, AlertCircle } from 'lucide-react';

interface EmployeeLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSubmit: (leave: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>) => void;
}

export const EmployeeLeaveModal: React.FC<EmployeeLeaveModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [category, setCategory] = useState<LeaveCategory>('Cuti Tahunan');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Harap isi alasan pengajuan cuti/izin secara jelas.');
      return;
    }
    if (end < start) {
      setError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    onSubmit({
      employeeId: employee.id,
      employeeName: employee.nama,
      category,
      startDate,
      endDate,
      durationDays,
      reason: reason.trim(),
      emergencyContact: emergencyContact.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Formulir Pengajuan Izin & Cuti Pegawai
            </h2>
            <p className="text-xs text-slate-500">
              Pengajuan akan langsung masuk ke daftar persetujuan Administrator.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pegawai Info Info-card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Nama Pegawai:</span>
              <span className="font-bold text-slate-900">{employee.nama}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-500 block text-[11px]">ID & Regu:</span>
              <span className="font-semibold text-emerald-700">
                {employee.id} ({employee.jabatan} {employee.regu !== '-' ? `- ${employee.regu}` : ''})
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Permohonan <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LeaveCategory)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Cuti Tahunan">Cuti Tahunan</option>
              <option value="Izin Sakit">Izin Sakit (Disertai Keterangan / Resep)</option>
              <option value="Cuti Alasan Penting">Cuti Alasan Penting / Keluarga</option>
              <option value="Izin Keperluan Pribadi">Izin Keperluan Pribadi</option>
              <option value="Dinas Luar">Dinas Luar / Penugasan Luar Kantor</option>
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                required
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Durasi Cuti / Izin:</span>
            </div>
            <span className="font-bold">{durationDays} Hari Kerja</span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan / Keterangan Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Keperluan keluarga di luar kota / Sakit demam perlu istirahat 2 hari..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp yang dapat dihubungi
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirimkan Pengajuan Cuti</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
