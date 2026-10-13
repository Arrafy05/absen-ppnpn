import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { verifyEmployeePin, getDefaultPinHint, isCustomPinSet } from '../services/authHelpers';
import {
  Lock,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Fingerprint,
  Briefcase,
  KeyRound,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface EmployeeLoginViewProps {
  employees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
  onSwitchToAdmin: () => void;
  sharedEmail?: string;
}

export const EmployeeLoginView: React.FC<EmployeeLoginViewProps> = ({
  employees,
  onLoginSuccess,
  onSwitchToAdmin,
  sharedEmail = 'farelarraafi84@gmail.com',
}) => {
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDefaultHint, setShowDefaultHint] = useState(false);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'Non-Aktif'),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return activeEmployees.slice(0, 8);
    const query = searchQuery.toLowerCase().trim();
    return activeEmployees.filter(
      (e) =>
        e.nama.toLowerCase().includes(query) ||
        e.id.toLowerCase().includes(query) ||
        String(e.fingerprint_id).includes(query) ||
        e.jabatan.toLowerCase().includes(query)
    );
  }, [activeEmployees, searchQuery]);

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setPinInput('');
    setErrorMessage(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      setErrorMessage('Pilih nama pegawai terlebih dahulu.');
      return;
    }

    if (!pinInput.trim()) {
      setErrorMessage('Masukkan PIN Keamanan Anda.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      const isValid = verifyEmployeePin(selectedEmp, pinInput);
      if (isValid) {
        onLoginSuccess(selectedEmp);
      } else {
        const hint = isCustomPinSet(selectedEmp)
          ? 'PIN salah. Anda telah mengubah PIN sebelumnya. Silakan masukkan PIN khusus Anda atau hubungi Admin.'
          : `PIN salah. Untuk login awal, gunakan PIN Sidik Jari Anda (${selectedEmp.fingerprint_id}) atau 1234.`;
        setErrorMessage(hint);
      }
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="max-w-xl mx-auto my-4 sm:my-8 px-2">
      {/* Main Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Login Portal Pribadi Pegawai
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Akses data kehadiran & cuti khusus akun Anda secara terlindungi meskipun menggunakan 1 alamat email bersama.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Akun Email Bersama:</span>
            <span className="font-mono font-semibold text-slate-800">{sharedEmail}</span>
          </div>
        </div>

        {/* Card Body / Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* 1. Pilih Pegawai */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Pilih Identitas Pegawai
            </label>

            {!selectedEmp ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama, ID (P001), atau PIN Fingerprint..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ditemukan pegawai dengan kata kunci tersebut.
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full text-left p-3 hover:bg-emerald-50/70 transition flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-200 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center transition">
                            {emp.nama.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                              {emp.nama}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {emp.id} • PIN Sidik Jari: {emp.fingerprint_id} • {emp.jabatan}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold group-hover:underline">
                          Pilih &rarr;
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Selected Employee Card */
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {selectedEmp.nama.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{selectedEmp.nama}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold">
                        {selectedEmp.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>PIN Mesin: {selectedEmp.fingerprint_id}</span>
                      <span>•</span>
                      <span>{selectedEmp.jabatan} {selectedEmp.regu !== '-' ? `(${selectedEmp.regu})` : ''}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-medium transition cursor-pointer"
                >
                  Ganti Profil
                </button>
              </div>
            )}
          </div>

          {/* 2. Input PIN */}
          {selectedEmp && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Masukkan PIN Keamanan Pribadi
                </label>
                <button
                  type="button"
                  onClick={() => setShowDefaultHint(!showDefaultHint)}
                  className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Petunjuk PIN</span>
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Masukkan PIN pribadi..."
                  className="w-full pl-10 pr-12 py-2.5 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* PIN Info / Hint Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{getDefaultPinHint(selectedEmp)}</span>
                </div>
                <p className="text-slate-500">
                  Setelah berhasil masuk, Anda dapat membuat PIN rahasia baru melalui tombol <strong>Ganti PIN</strong> agar rekan kerja tidak dapat membuka akun Anda.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Portal Saya'}</span>
              </button>
            </div>
          )}
        </form>

        {/* Security & Privacy Banner Footer */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 space-y-2">
          <div className="flex items-start gap-2 text-slate-700">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold text-slate-800">
              Perlindungan Privasi Antar Pegawai Aktif
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Meskipun sistem beroperasi dengan 1 akun Google bersama (<span className="font-mono text-slate-700 font-semibold">{sharedEmail}</span>), setiap pegawai diwajibkan melakukan autentikasi PIN mandiri. Data jam keterlambatan, rekaman sidik jari, dan alasan cuti Anda tidak dapat diintip oleh rekan lain.
          </p>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Khusus Pengelola & Operator:</span>
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Buka Pusat Kontrol Admin</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
