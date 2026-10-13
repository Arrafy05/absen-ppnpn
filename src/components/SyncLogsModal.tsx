import React from 'react';
import { SyncLog } from '../types';
import { X, CheckCircle2, AlertCircle, History, Clock, Layers } from 'lucide-react';

interface SyncLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SyncLog[];
  onClearLogs: () => void;
}

export const SyncLogsModal: React.FC<SyncLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Log Sinkronisasi
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs text-slate-500 hover:text-red-600 transition cursor-pointer"
              >
                Hapus Log
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-600">
                Belum ada aktivitas sinkronisasi
              </p>
              <p className="text-xs text-slate-400">
                Log akan otomatis tercatat setiap kali data disinkronkan ke Google Sheet atau Apps Script.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition ${
                  log.status === 'success'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-red-50/50 border-red-200'
                }`}
              >
                {log.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {log.method}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-700">{log.message}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    {log.rowCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {log.rowCount} baris
                      </span>
                    )}
                    <span className="truncate max-w-[280px] font-mono text-[10px]">
                      {log.target}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
