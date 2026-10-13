import React, { useState } from 'react';
import { Employee } from '../types';
import { X, Download, Upload, FileText, AlertCircle, Check } from 'lucide-react';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onImportEmployees: (newEmployees: Employee[], mode: 'replace' | 'append') => void;
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  employees,
  onImportEmployees,
}) => {
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [previewData, setPreviewData] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export current table to CSV
  const handleExportCsv = () => {
    const headers = ['id', 'fingerprint_id', 'nama', 'jabatan', 'regu', 'role_app', 'status'];
    const rows = employees.map((e) => [
      e.id,
      e.fingerprint_id,
      `"${e.nama.replace(/"/g, '""')}"`,
      e.jabatan,
      e.regu,
      e.role_app,
      e.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_pegawai_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse text or file
  const parseCsvText = (text: string) => {
    setError(null);
    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('Format CSV minimal memiliki baris header dan satu baris data.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const idIdx = headers.indexOf('id');
      const fpIdx = headers.indexOf('fingerprint_id');
      const namaIdx = headers.indexOf('nama');
      const jabIdx = headers.indexOf('jabatan');
      const reguIdx = headers.indexOf('regu');
      const roleIdx = headers.indexOf('role_app');
      const statusIdx = headers.indexOf('status');

      if (idIdx === -1 || namaIdx === -1) {
        throw new Error("Header CSV wajib menyertakan kolom 'id' dan 'nama'.");
      }

      const parsed: Employee[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        parsed.push({
          id: cols[idIdx] || `P${String(i).padStart(3, '0')}`,
          fingerprint_id: fpIdx !== -1 ? cols[fpIdx] || '-' : '-',
          nama: cols[namaIdx] || 'Tanpa Nama',
          jabatan: jabIdx !== -1 ? cols[jabIdx] || 'STAFF' : 'STAFF',
          regu: reguIdx !== -1 ? cols[reguIdx] || '-' : '-',
          role_app: roleIdx !== -1 ? cols[roleIdx] || 'pegawai' : 'pegawai',
          status: statusIdx !== -1 ? cols[statusIdx] || 'Aktif' : 'Aktif',
          lastSyncedAt: new Date().toISOString(),
        });
      }

      setPreviewData(parsed);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses data CSV.');
      setPreviewData(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!previewData || previewData.length === 0) return;
    onImportEmployees(previewData, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Impor & Ekspor CSV
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Export Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Unduh Data Saat Ini ({employees.length} Baris)
              </p>
              <p className="text-[11px] text-slate-500">
                Ekspor data dalam format .csv yang kompatibel dengan Excel dan Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {/* Import Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Unggah Berkas CSV atau Tempel Data
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Berkas .csv</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">atau tempel teks di bawah:</span>
            </div>

            <textarea
              rows={4}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                parseCsvText(e.target.value);
              }}
              placeholder={`id,fingerprint_id,nama,jabatan,regu,role_app,status\nP001,4,DIKA,STAFF,-,pegawai,Aktif`}
              className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {previewData.length} baris data valid terbaca
                </span>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span>Ganti Semua</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span>Tambahkan</span>
                  </label>
                </div>
              </div>

              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 text-[11px] font-mono divide-y divide-slate-200">
                {previewData.slice(0, 5).map((d) => (
                  <div key={d.id} className="py-1 flex justify-between">
                    <span>{d.id} - {d.nama}</span>
                    <span className="text-slate-500">{d.jabatan} | {d.regu}</span>
                  </div>
                ))}
                {previewData.length > 5 && (
                  <p className="py-1 text-slate-400 italic">
                    ... dan {previewData.length - 5} baris lainnya
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!previewData || previewData.length === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition disabled:opacity-40 cursor-pointer"
          >
            Terapkan Impor ({previewData?.length || 0} Data)
          </button>
        </div>
      </div>
    </div>
  );
};
