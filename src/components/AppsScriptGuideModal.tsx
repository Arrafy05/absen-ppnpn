import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/appsScriptTemplate';
import { X, Copy, Check, Code2, Terminal, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptUrl: string;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideModalProps> = ({
  isOpen,
  onClose,
  scriptUrl,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBridge, setCopiedBridge] = useState(false);
  const [activeTab, setActiveTab] = useState<'appscript' | 'hardware_bridge'>('appscript');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const hardwareBridgeScript = `# =========================================================================
# SCRIPT PENARIK DATA MESIN FINGERPRINT KE GOOGLE APPS SCRIPT (PYTHON)
# Jalankan di PC/Server yang terhubung dengan software mesin (ZKTeco / Solution)
# =========================================================================
import requests
import json
import time
from datetime import datetime

# Masukkan URL Google Apps Script Web App Anda
APPS_SCRIPT_URL = "${scriptUrl}"

def push_attendance_to_cloud(logs):
    payload = {
        "action": "machine_push_log",
        "logs": logs
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(APPS_SCRIPT_URL, json=payload, timeout=15)
        print("Terkirim:", response.text)
    except Exception as e:
        print("Error koneksi:", e)

# Contoh format data yang dikirim otomatis saat pegawai menempelkan jari:
sample_logs = [
    {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "fingerprint_id": "4", # PIN Pegawai
        "type": "IN",
        "device_name": "MESIN-FP-LOBBY"
    }
]

if __name__ == "__main__":
    print("Mengirimkan log mesin ke Google Apps Script...")
    push_attendance_to_cloud(sample_logs)
`;

  const handleCopyBridge = () => {
    navigator.clipboard.writeText(hardwareBridgeScript);
    setCopiedBridge(true);
    setTimeout(() => setCopiedBridge(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Panduan Integrasi API Google Apps Script & Mesin Fingerprint
              </h2>
              <p className="text-xs text-slate-500">
                Menghubungkan software mesin fingerprint ke database Google Spreadsheet secara otomatis.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('appscript')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'appscript'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kode Google Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware_bridge')}
            className={`pb-2.5 px-2 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'hardware_bridge'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Script Penarik Mesin Fingerprint (Hardware Bridge)</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {activeTab === 'appscript' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Cara Pasang di Google Spreadsheet:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Buka Google Spreadsheet database Anda.</li>
                  <li>
                    Pilih menu <strong>Ekstensi (Extensions)</strong> &gt;{' '}
                    <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Hapus kode yang ada di <code>Code.gs</code>, lalu tempel kode lengkap di bawah ini.
                  </li>
                  <li>
                    Klik <strong>Terapkan (Deploy)</strong> &gt;{' '}
                    <strong>Penerapan baru (New deployment)</strong> &gt; pilih{' '}
                    <strong>Aplikasi Web (Web App)</strong>.
                  </li>
                  <li>
                    Atur <em>Execute as: "Me"</em> dan <em>Who has access: "Anyone"</em>.
                  </li>
                  <li>
                    Salin URL Web App yang dihasilkan ke pengaturan URL aplikasi ini.
                  </li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    Code.gs (Auto-creates Data_Pegawai, Log_Fingerprint, Rekap_Absensi, Data_Cuti)
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Script'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-purple-700" />
                  <span>Jembatan Software Mesin Fingerprint ke Apps Script:</span>
                </div>
                <p className="text-slate-700">
                  Sebagian besar software fingerprint desktop (seperti ZKTeco ZKTime, Attendance Management, Fingerspot Personnel) menyimpan data scan di database lokal (MS Access/MySQL/SQL Server).
                  Script bridge di bawah ini dapat dijalankan sebagai <em>task scheduler</em> atau daemon di PC operator untuk menarik scan baru dan mengirimkannya langsung ke Google Apps Script.
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    fingerprint_sync_bridge.py
                  </span>
                  <button
                    onClick={handleCopyBridge}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    {copiedBridge ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBridge ? 'Tersalin!' : 'Salin Script Bridge'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-purple-300 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {hardwareBridgeScript}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Endpoint aktif:{' '}
            <span className="font-mono text-emerald-700 font-semibold truncate max-w-xs inline-block align-bottom">
              {scriptUrl}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
