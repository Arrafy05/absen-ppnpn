import React, { useState } from 'react';
import { Employee } from '../types';
import {
  UserCheck,
  Shield,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';

interface RoleSwitcherProps {
  employees: Employee[];
  currentMode: 'pegawai' | 'admin';
  loggedInEmployee: Employee | null;
  isAdminUnlocked: boolean;
  onSwitchMode: (mode: 'pegawai' | 'admin') => void;
  onUnlockAdmin: (pin: string) => boolean;
  onLockAdmin: () => void;
  onLogoutEmployee: () => void;
  onOpenChangePin: () => void;
  sharedEmail?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  employees,
  currentMode,
  loggedInEmployee,
  isAdminUnlocked,
  onSwitchMode,
  onUnlockAdmin,
  onLockAdmin,
  onLogoutEmployee,
  onOpenChangePin,
  sharedEmail = 'farelarraafi84@gmail.com',
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleAdminModeClick = () => {
    if (isAdminUnlocked) {
      onSwitchMode('admin');
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onUnlockAdmin(pinInput);
    if (success) {
      setShowPinModal(false);
      onSwitchMode('admin');
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Shared Email & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Shared Email Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 font-medium">Akun Bersama:</span>
            <span className="font-semibold text-slate-800 font-mono">{sharedEmail}</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSwitchMode('pegawai')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                currentMode === 'pegawai'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Pegawai</span>
            </button>

            <button
              onClick={handleAdminModeClick}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                currentMode === 'admin'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Pusat Kontrol Admin</span>
              {!isAdminUnlocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Right: Mode-Specific Status / Actions */}
        {currentMode === 'pegawai' ? (
          loggedInEmployee ? (
            /* Authenticated Employee Private Session Card */
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                  {loggedInEmployee.nama.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5 leading-tight">
                    <span>{loggedInEmployee.nama}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Privat</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono">
                    ID: {loggedInEmployee.id} • PIN Fingerprint: {loggedInEmployee.fingerprint_id}
                  </div>
                </div>
              </div>

              {/* Change PIN button */}
              <button
                type="button"
                onClick={onOpenChangePin}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Ganti PIN Keamanan Pribadi Anda"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Ganti PIN</span>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogoutEmployee}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Keluar dari sesi agar rekan kerja tidak dapat melihat data Anda"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated / Login Screen state */
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Silakan pilih akun & masukkan PIN Anda untuk masuk.</span>
            </div>
          )
        ) : (
          /* Mode Admin */
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              Hak Akses: Administrator
            </span>
            <button
              onClick={onLockAdmin}
              className="text-xs text-slate-500 hover:text-red-600 underline transition cursor-pointer"
            >
              Kunci Kembali
            </button>
          </div>
        )}
      </div>

      {/* Admin PIN Unlock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Autentikasi Admin</h3>
                <p className="text-xs text-slate-500">Karena akun email dipakai bersama, masukkan PIN Admin.</p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Administrator (Bawaan: <span className="font-mono text-emerald-600 font-bold">1234</span>)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Masukkan PIN (1234)"
                  className="w-full px-3 py-2 text-center tracking-widest text-lg font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-600 mt-1">PIN salah. Masukkan 1234 untuk akses admin.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Buka Akses Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
