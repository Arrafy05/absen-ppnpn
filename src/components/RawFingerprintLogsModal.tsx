import React, { useState } from 'react';
import { FingerprintRawLog, Employee } from '../types';
import { X, Fingerprint, Clock, Plus, Search, Filter, CheckCircle2 } from 'lucide-react';

interface RawFingerprintLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: FingerprintRawLog[];
  employees: Employee[];
  onAddLog: (log: FingerprintRawLog) => void;
}

export const RawFingerprintLogsModal: React.FC<RawFingerprintLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  employees,
  onAddLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSimulateForm, setShowSimulateForm] = useState(false);
  const [simulatedPin, setSimulatedPin] = useState(employees[0]?.fingerprint_id || '4');
  const [simulatedType, setSimulatedType] = useState<'IN' | 'OUT'>('IN');

  if (!isOpen) return null;

  // Build lookup map for employee name by PIN
  const empMap = new Map<string, Employee>();
  employees.forEach((emp) => {
    empMap.set(String(emp.fingerprint_id).trim(), emp);
  });

  const filteredLogs = logs.filter((l) => {
    const pinStr = String(l.fingerprint_id);
    const matched = empMap.get(pinStr);
    const empName = matched ? matched.nama.toLowerCase() : '';
    return (
      pinStr.includes(searchTerm) ||
      empName.includes(searchTerm.toLowerCase()) ||
      l.timestamp.includes(searchTerm)
    );
  });

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: FingerprintRawLog = {
      id: `sim-${Date.now()}`,
      fingerprint_id: simulatedPin,
      timestamp: timeStr,
      type: simulatedType,
      device_name: 'MESIN-SIMULATOR-01',
    };

    onAddLog(newLog);
    setShowSimulateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Log Mentah Mesin Fingerprint (Hardware Events)
              </h2>
              <p className="text-xs text-slate-500">
                Data mentah scan sidik jari yang diterima dari API Apps Script / Software Mesin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari PIN, nama pegawai, waktu..."
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={() => setShowSimulateForm(!showSimulateForm)}
            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulasi Scan Sidik Jari</span>
          </button>
        </div>

        {/* Simulate form toggle */}
        {showSimulateForm && (
          <form
            onSubmit={handleSimulateSubmit}
            className="p-3 bg-purple-50/50 border-b border-purple-100 flex flex-wrap items-end gap-3 text-xs"
          >
            <div>
              <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                Pilih Pegawai (PIN):
              </label>
              <select
                value={simulatedPin}
                onChange={(e) => setSimulatedPin(e.target.value)}
                className="px-2 py-1 bg-white border border-purple-200 rounded-lg text-xs"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.fingerprint_id}>
                    PIN {e.fingerprint_id} - {e.nama} ({e.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                Tipe Scan:
              </label>
              <select
                value={simulatedType}
                onChange={(e) => setSimulatedType(e.target.value as any)}
                className="px-2 py-1 bg-white border border-purple-200 rounded-lg text-xs"
              >
                <option value="IN">IN (Masuk)</option>
                <option value="OUT">OUT (Pulang)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Kirim Scan Baru
            </button>
          </form>
        )}

        {/* Log table */}
        <div className="overflow-y-auto flex-1 p-2">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-2.5">Waktu Scan</th>
                <th className="p-2.5">PIN Mesin</th>
                <th className="p-2.5">Pegawai Terhubung</th>
                <th className="p-2.5 text-center">Tipe</th>
                <th className="p-2.5">Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada data log yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const emp = empMap.get(String(log.fingerprint_id).trim());
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-mono text-[11px] text-slate-800">
                        {log.timestamp}
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {log.fingerprint_id}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {emp ? (
                          <div>
                            <span className="font-semibold text-slate-900">{emp.nama}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                              ({emp.id} - {emp.jabatan})
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 italic">PIN tidak dikenal di Master</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            log.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-500 font-mono">
                        {log.device_name || 'MESIN-01'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Total {filteredLogs.length} event log tersimpan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
