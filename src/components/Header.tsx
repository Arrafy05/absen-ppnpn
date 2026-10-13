import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  isLoggingIn: boolean;
  onGoogleSignIn: () => void;
  onGoogleLogout: () => void;
  appsScriptHealthy: boolean | null;
  activeSpreadsheetId: string;
  onOpenSyncModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoggingIn,
  onGoogleSignIn,
  onGoogleLogout,
  appsScriptHealthy,
  activeSpreadsheetId,
  onOpenSyncModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Google Sheet User Data Sync
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PPNPN Absensi
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sinkronisasi data pegawai langsung ke Google Sheets & Apps Script
              </p>
            </div>
          </div>

          {/* Right Status & Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Status Pill */}
            <button
              onClick={onOpenSyncModal}
              title="Pengaturan & Status Sinkronisasi"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  appsScriptHealthy ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'
                }`}
              />
              <span>Apps Script: {appsScriptHealthy ? 'Aktif' : 'Tersambung'}</span>
              {activeSpreadsheetId && (
                <span className="text-slate-400">| Sheet Terhubung</span>
              )}
            </button>

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {user.displayName || 'Google User'}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onGoogleLogout}
                  title="Sign out of Google"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official Google Material Sign-In Button compliant with guidelines */
              <button
                id="btn-google-signin"
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 shadow-2xs transition disabled:opacity-60 cursor-pointer"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
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
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
