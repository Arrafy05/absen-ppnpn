import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Employee, SyncLog } from '../types';
import {
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Download,
  UploadCloud,
  X,
  Link,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  testAppsScriptConnection,
  syncEmployeesToAppsScript,
  AppsScriptTestResult,
} from '../services/appsScriptSync';
import {
  createNewSpreadsheet,
  syncEmployeesToSheet,
  readEmployeesFromSheet,
  fetchSpreadsheetInfo,
  extractSpreadsheetId,
} from '../services/googleSheetsApi';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onEmployeesUpdated: (employees: Employee[]) => void;
  user: User | null;
  accessToken: string | null;
  onGoogleSignIn: () => void;
  scriptUrl: string;
  onScriptUrlChange: (url: string) => void;
  spreadsheetId: string;
  onSpreadsheetIdChange: (id: string) => void;
  selectedSheetName: string;
  onSelectedSheetNameChange: (sheet: string) => void;
  availableSheets: string[];
  onAvailableSheetsChange: (sheets: string[]) => void;
  onAddSyncLog: (log: Omit<SyncLog, 'id' | 'timestamp'>) => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  employees,
  onEmployeesUpdated,
  user,
  accessToken,
  onGoogleSignIn,
  scriptUrl,
  onScriptUrlChange,
  spreadsheetId,
  onSpreadsheetIdChange,
  selectedSheetName,
  onSelectedSheetNameChange,
  availableSheets,
  onAvailableSheetsChange,
  onAddSyncLog,
}) => {
  const [activeTab, setActiveTab] = useState<'appscript' | 'googlesheets'>('appscript');
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<AppsScriptTestResult | null>(null);

  const [isSyncingScript, setIsSyncingScript] = useState(false);
  const [scriptSyncStatus, setScriptSyncStatus] = useState<string | null>(null);

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isReadingSheet, setIsReadingSheet] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // 1. Test Apps Script Web App Connection
  const handleTestAppsScript = async () => {
    setIsTestingScript(true);
    setScriptTestResult(null);
    try {
      const res = await testAppsScriptConnection(scriptUrl);
      setScriptTestResult(res);
      if (res.success) {
        onAddSyncLog({
          method: 'Apps Script Webhook',
          target: scriptUrl,
          rowCount: 0,
          status: 'success',
          message: `Koneksi berhasil: ${res.message}`,
        });
      } else {
        onAddSyncLog({
          method: 'Apps Script Webhook',
          target: scriptUrl,
          rowCount: 0,
          status: 'error',
          message: `Koneksi gagal: ${res.message}`,
        });
      }
    } catch (err: any) {
      setScriptTestResult({
        success: false,
        message: err.message || 'Gagal mengetes endpoint Apps Script',
      });
    } finally {
      setIsTestingScript(false);
    }
  };

  // 2. Sync to Apps Script Endpoint
  const handleSyncToAppsScript = async () => {
    setIsSyncingScript(true);
    setScriptSyncStatus(null);
    try {
      const res = await syncEmployeesToAppsScript(scriptUrl, employees, 'sync_users');
      setScriptSyncStatus(res.message);
      onAddSyncLog({
        method: 'Apps Script Webhook',
        target: scriptUrl,
        rowCount: employees.length,
        status: 'success',
        message: res.message,
      });
    } catch (err: any) {
      setScriptSyncStatus(`Error: ${err.message}`);
      onAddSyncLog({
        method: 'Apps Script Webhook',
        target: scriptUrl,
        rowCount: employees.length,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsSyncingScript(false);
    }
  };

  // 3. Create New Google Spreadsheet via OAuth
  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }

    setIsCreatingSheet(true);
    setSheetStatus(null);
    try {
      const newSheet = await createNewSpreadsheet('Data Pegawai PPNPN - User Sync', accessToken);
      onSpreadsheetIdChange(newSheet.spreadsheetId);
      onSelectedSheetNameChange(newSheet.sheetName);
      onAvailableSheetsChange([newSheet.sheetName]);

      // Immediately write the records
      await syncEmployeesToSheet(newSheet.spreadsheetId, newSheet.sheetName, employees, accessToken);

      setSheetStatus({
        type: 'success',
        message: `Spreadsheet baru berhasil dibuat dan ${employees.length} data pegawai disinkronkan!`,
      });

      onAddSyncLog({
        method: 'Google Sheets API',
        target: newSheet.spreadsheetId,
        rowCount: employees.length,
        status: 'success',
        message: `Spreadsheet baru dibuat & ${employees.length} pegawai disinkronkan`,
      });
    } catch (err: any) {
      setSheetStatus({
        type: 'error',
        message: err.message || 'Gagal membuat Google Spreadsheet',
      });
      onAddSyncLog({
        method: 'Google Sheets API',
        target: 'Create New',
        rowCount: 0,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // 4. Push Employees to Connected Google Sheet
  const handlePushToGoogleSheet = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }
    if (!spreadsheetId.trim()) {
      setSheetStatus({
        type: 'error',
        message: 'Silakan masukkan Spreadsheet ID atau buat Spreadsheet baru.',
      });
      return;
    }

    setIsSyncingSheet(true);
    setSheetStatus(null);
    try {
      const sheetTab = selectedSheetName || 'Sheet1';
      const result = await syncEmployeesToSheet(spreadsheetId, sheetTab, employees, accessToken);

      setSheetStatus({
        type: 'success',
        message: `Berhasil menyinkronkan ${employees.length} baris ke Google Sheet (${sheetTab})!`,
      });

      onAddSyncLog({
        method: 'Google Sheets API',
        target: spreadsheetId,
        rowCount: employees.length,
        status: 'success',
        message: `Data ${employees.length} pegawai berhasil ditulis ke Google Sheet`,
      });
    } catch (err: any) {
      setSheetStatus({
        type: 'error',
        message: err.message || 'Gagal menulis data ke Google Sheet',
      });
      onAddSyncLog({
        method: 'Google Sheets API',
        target: spreadsheetId,
        rowCount: employees.length,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // 5. Pull Employees from Connected Google Sheet
  const handlePullFromGoogleSheet = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }
    if (!spreadsheetId.trim()) {
      setSheetStatus({
        type: 'error',
        message: 'Silakan masukkan Spreadsheet ID terlebih dahulu.',
      });
      return;
    }

    setIsReadingSheet(true);
    setSheetStatus(null);
    try {
      const sheetTab = selectedSheetName || 'Sheet1';
      const fetched = await readEmployeesFromSheet(spreadsheetId, sheetTab, accessToken);

      if (fetched.length === 0) {
        setSheetStatus({
          type: 'error',
          message: `Tidak ada data ditemukan pada tab '${sheetTab}'. Pastikan header ada di baris 1.`,
        });
        return;
      }

      onEmployeesUpdated(fetched);
      setSheetStatus({
        type: 'success',
        message: `Berhasil menarik ${fetched.length} data pegawai dari Google Sheet!`,
      });

      onAddSyncLog({
        method: 'Google Sheets API',
        target: spreadsheetId,
        rowCount: fetched.length,
        status: 'success',
        message: `Berhasil mengimpor ${fetched.length} data dari Google Sheet`,
      });
    } catch (err: any) {
      setSheetStatus({
        type: 'error',
        message: err.message || 'Gagal membaca data dari Google Sheet',
      });
      onAddSyncLog({
        method: 'Google Sheets API',
        target: spreadsheetId,
        rowCount: 0,
        status: 'error',
        message: err.message,
      });
    } finally {
      setIsReadingSheet(false);
    }
  };

  // 6. Inspect spreadsheet and load tabs
  const handleInspectSpreadsheet = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }
    if (!spreadsheetId.trim()) return;

    try {
      const info = await fetchSpreadsheetInfo(spreadsheetId, accessToken);
      onAvailableSheetsChange(info.sheetNames);
      if (info.sheetNames.length > 0 && !info.sheetNames.includes(selectedSheetName)) {
        onSelectedSheetNameChange(info.sheetNames[0]);
      }
      setSheetStatus({
        type: 'success',
        message: `Tersambung ke '${info.title}' (${info.sheetNames.length} sheet/tab ditemukan)`,
      });
    } catch (err: any) {
      setSheetStatus({
        type: 'error',
        message: err.message || 'Gagal memuat informasi spreadsheet',
      });
    }
  };

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const sheetOpenUrl = cleanId ? `https://docs.google.com/spreadsheets/d/${cleanId}/edit` : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Sinkronisasi Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan dan sinkronkan data ke Apps Script endpoint & Google Sheets API
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('appscript')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'appscript'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google Apps Script Endpoint</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
              Rekomendasi
            </span>
          </button>
          <button
            onClick={() => setActiveTab('googlesheets')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'googlesheets'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets REST API (OAuth)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'appscript' ? (
            /* TAB 1: Apps Script Web App */
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Endpoint Web App Google Apps Script Terpasang:</span>
                  <p className="text-slate-600 mt-1">
                    Aplikasi otomatis terhubung ke Web App script Anda yang terhubung langsung ke spreadsheet absensi & data pegawai PPNPN.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL Google Apps Script Exec
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scriptUrl}
                    onChange={(e) => onScriptUrlChange(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-slate-700 bg-white"
                  />
                  <button
                    onClick={handleTestAppsScript}
                    disabled={isTestingScript}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shrink-0 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isTestingScript ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>Cek Status</span>
                  </button>
                </div>
              </div>

              {/* Script Test Feedback */}
              {scriptTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                    scriptTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {scriptTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{scriptTestResult.message}</p>
                    {scriptTestResult.timestamp && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Timestamp server: {scriptTestResult.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-sync-apps-script"
                  onClick={handleSyncToAppsScript}
                  disabled={isSyncingScript || employees.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingScript ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>Sinkronkan {employees.length} Data Pegawai Sekarang</span>
                </button>
              </div>

              {scriptSyncStatus && (
                <p className="text-xs font-medium text-slate-700 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  Status: {scriptSyncStatus}
                </p>
              )}
            </div>
          ) : (
            /* TAB 2: Direct Google Sheets API via OAuth */
            <div className="space-y-4">
              {!accessToken ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Diperlukan Google Sign-In</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    Untuk mengakses atau membuat Google Spreadsheet langsung melalui Google Sheets REST API, Anda perlu masuk dengan akun Google Anda.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={onGoogleSignIn}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                      <span>Masuk dengan Google Sekarang</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Terhubung sebagai: <strong>{user?.email}</strong></span>
                  </div>
                  <button
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isCreatingSheet}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingSheet ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Buat Sheet Baru di Drive</span>
                  </button>
                </div>
              )}

              {/* Spreadsheet ID Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Spreadsheet ID atau URL Lengkap Google Sheet
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => onSpreadsheetIdChange(e.target.value)}
                    placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-700 bg-white"
                  />
                  {accessToken && (
                    <button
                      onClick={handleInspectSpreadsheet}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    >
                      Periksa
                    </button>
                  )}
                  {sheetOpenUrl && (
                    <a
                      href={sheetOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Buka</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Sheet Tab Selector */}
              {availableSheets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Tab Sheet
                  </label>
                  <select
                    value={selectedSheetName}
                    onChange={(e) => onSelectedSheetNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {availableSheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Message */}
              {sheetStatus && (
                <div
                  className={`p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                    sheetStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {sheetStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <p className="font-semibold">{sheetStatus.message}</p>
                </div>
              )}

              {/* Push & Pull Actions */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="btn-push-google-sheet"
                  onClick={handlePushToGoogleSheet}
                  disabled={isSyncingSheet || !spreadsheetId}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>Kirim Data ke Google Sheet (Push)</span>
                </button>

                <button
                  id="btn-pull-google-sheet"
                  onClick={handlePullFromGoogleSheet}
                  disabled={isReadingSheet || !spreadsheetId}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-300 transition disabled:opacity-50 cursor-pointer"
                >
                  {isReadingSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Tarik Data dari Sheet (Pull)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{employees.length} data pegawai siap disinkronkan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-100 cursor-pointer transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
