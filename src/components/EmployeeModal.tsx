import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { X, UserCheck, AlertCircle } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  initialData?: Employee | null;
  existingIds: string[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingIds,
}) => {
  const [id, setId] = useState('');
  const [fingerprintId, setFingerprintId] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('STAFF');
  const [regu, setRegu] = useState('-');
  const [roleApp, setRoleApp] = useState('pegawai');
  const [status, setStatus] = useState<'Aktif' | 'Non-Aktif'>('Aktif');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setFingerprintId(String(initialData.fingerprint_id));
      setNama(initialData.nama);
      setJabatan(initialData.jabatan);
      setRegu(initialData.regu);
      setRoleApp(initialData.role_app);
      setStatus(initialData.status === 'Non-Aktif' ? 'Non-Aktif' : 'Aktif');
      setPin(initialData.pin || '');
    } else {
      // Auto-generate next ID
      const nextNum = existingIds.length + 1;
      setId(`P${String(nextNum).padStart(3, '0')}`);
      setFingerprintId('');
      setNama('');
      setJabatan('STAFF');
      setRegu('-');
      setRoleApp('pegawai');
      setStatus('Aktif');
      setPin('');
    }
    setError(null);
  }, [initialData, isOpen, existingIds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim()) {
      setError('ID pegawai tidak boleh kosong');
      return;
    }
    if (!nama.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }
    if (!initialData && existingIds.includes(id.trim().toUpperCase())) {
      setError(`ID ${id} sudah terdaftar. Gunakan ID lain.`);
      return;
    }

    onSave({
      id: id.trim().toUpperCase(),
      fingerprint_id: fingerprintId.trim() || '-',
      nama: nama.trim().toUpperCase(),
      jabatan: jabatan.trim().toUpperCase(),
      regu: regu.trim().toUpperCase(),
      role_app: roleApp.trim().toLowerCase(),
      status,
      pin: pin.trim() ? pin.trim() : undefined,
      lastSyncedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
          </h2>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Pegawai <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Contoh: P043"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fingerprint ID
              </label>
              <input
                type="text"
                value={fingerprintId}
                onChange={(e) => setFingerprintId(e.target.value)}
                placeholder="Contoh: 634"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: AHMAD FAUZI"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan
              </label>
              <select
                value={jabatan}
                onChange={(e) => {
                  const val = e.target.value;
                  setJabatan(val);
                  if (val === 'STAFF') setRegu('-');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="STAFF">STAFF</option>
                <option value="SECURITY">SECURITY</option>
                <option value="DRIVER">DRIVER</option>
                <option value="CLEANING SERVICE">CLEANING SERVICE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Regu / Penugasan
              </label>
              <select
                value={regu}
                onChange={(e) => setRegu(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="-">- (Non-Regu)</option>
                <option value="ALPHA">ALPHA</option>
                <option value="BRAVO">BRAVO</option>
                <option value="CHARLIE">CHARLIE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Aplikasi
              </label>
              <select
                value={roleApp}
                onChange={(e) => setRoleApp(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="pegawai">pegawai</option>
                <option value="admin">admin</option>
                <option value="supervisor">supervisor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pegawai
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Non-Aktif')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PIN Keamanan Login Pegawai
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={`Bawaan: ${fingerprintId || 'PIN Fingerprint'} atau 1234`}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Kosongkan jika ingin memakai PIN bawaan mesin sidik jari atau 1234. Pegawai juga dapat mengganti PIN sendiri di portalnya.
            </p>
          </div>

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
              <UserCheck className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Pegawai'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
