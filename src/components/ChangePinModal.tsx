import React, { useState } from 'react';
import { Employee } from '../types';
import { verifyEmployeePin } from '../services/authHelpers';
import { X, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSavePin: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSavePin,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify current PIN
    if (!verifyEmployeePin(employee, currentPin)) {
      setError('PIN lama tidak sesuai. Masukkan PIN yang benar atau PIN Fingerprint Anda.');
      return;
    }

    // Validate new PIN
    const cleanNewPin = newPin.trim();
    if (cleanNewPin.length < 4) {
      setError('PIN baru minimal harus 4 digit.');
      return;
    }

    if (cleanNewPin !== confirmPin.trim()) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    onSavePin(cleanNewPin);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ubah PIN Keamanan Pribadi</h3>
              <p className="text-[11px] text-slate-500">Pegawai: {employee.nama} ({employee.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSaved ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">PIN Berhasil Diperbarui!</h4>
            <p className="text-xs text-slate-500">
              Gunakan PIN baru ini saat Anda login di perangkat bersama berikutnya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Saat Ini / PIN Lama <span className="text-red-500">*</span>
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Masukkan PIN saat ini (atau PIN Fingerprint)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                required
                autoFocus
              />
            </div>

            {/* New PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Baru (Minimal 4 Digit) <span className="text-red-500">*</span>
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Contoh: 8520 atau 6 digit"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konfirmasi PIN Baru <span className="text-red-500">*</span>
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPins ? 'Sembunyikan Angka' : 'Perlihatkan Angka'}</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privat & Aman</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                Simpan PIN Baru
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
