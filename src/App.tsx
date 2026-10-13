import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Employee, SyncLog, FingerprintRawLog, LeaveRequest, AttendanceRecord } from './types';
import { INITIAL_EMPLOYEES, DEFAULT_SCRIPT_URL } from './data/initialEmployees';
import { INITIAL_LEAVE_REQUESTS } from './data/initialLeaves';
import {
  generateSampleLogsForDate,
  calculateDailyAttendanceRecap,
} from './services/attendanceEngine';
import { initAuth, googleSignIn, googleLogout } from './services/googleAuth';
import {
  testAppsScriptConnection,
  syncEmployeesToAppsScript,
  pullFingerprintLogsFromScript,
  syncAttendanceRecapToAppsScript,
  syncLeaveRequestsToAppsScript,
} from './services/appsScriptSync';

// Components
import { Header } from './components/Header';
import { RoleSwitcher } from './components/RoleSwitcher';
import { EmployeePortalView } from './components/EmployeePortalView';
import { AttendanceRecapTable } from './components/AttendanceRecapTable';
import { LeaveManagementTab } from './components/LeaveManagementTab';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeLeaveModal } from './components/EmployeeLeaveModal';
import { RawFingerprintLogsModal } from './components/RawFingerprintLogsModal';
import { AppsScriptGuideModal } from './components/AppsScriptGuideModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { SyncLogsModal } from './components/SyncLogsModal';
import { CsvModal } from './components/CsvModal';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeLoginView } from './components/EmployeeLoginView';
import { ChangePinModal } from './components/ChangePinModal';

// Icons
import {
  Clock,
  FileCheck,
  Users,
  Code2,
  Fingerprint,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Settings,
  History,
  Download,
} from 'lucide-react';

export default function App() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Employees state (persisted locally)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('ppnpn_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EMPLOYEES;
  });

  // 2. Role & Shared Account Session
  const [userMode, setUserMode] = useState<'pegawai' | 'admin'>('pegawai');
  // Authenticated employee session (isolated login per employee)
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ppnpn_auth_emp_id') || null;
    } catch {
      return null;
    }
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(true); // default accessible or unlockable

  // 3. Admin Active Tab
  const [adminTab, setAdminTab] = useState<'recap' | 'leave' | 'employees'>('recap');

  // 4. Target Date for Attendance Recap
  const [targetDate, setTargetDate] = useState<string>(todayStr);

  // 5. Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('ppnpn_leaves');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LEAVE_REQUESTS;
  });

  // 6. Fingerprint Raw Logs state
  const [fingerprintLogs, setFingerprintLogs] = useState<FingerprintRawLog[]>(() => {
    try {
      const saved = localStorage.getItem('ppnpn_fp_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Seed initial realistic scans for today
    return generateSampleLogsForDate(INITIAL_EMPLOYEES, new Date().toISOString().slice(0, 10));
  });

  // 7. Auth & Google Workspace State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 8. Sync Settings State
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    return localStorage.getItem('ppnpn_script_url') || DEFAULT_SCRIPT_URL;
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('ppnpn_spreadsheet_id') || '';
  });
  const [selectedSheetName, setSelectedSheetName] = useState<string>('Rekap_Absensi');
  const [availableSheets, setAvailableSheets] = useState<string[]>([
    'Rekap_Absensi',
    'Data_Cuti',
    'Data_Pegawai',
    'Log_Fingerprint',
  ]);
  const [appsScriptHealthy, setAppsScriptHealthy] = useState<boolean | null>(null);

  // 9. Sync Activity Logs
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    try {
      const saved = localStorage.getItem('ppnpn_sync_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 10. Modals State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [isRawLogsModalOpen, setIsRawLogsModalOpen] = useState(false);
  const [isAppsScriptGuideOpen, setIsAppsScriptGuideOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // 11. Loading / Action Statuses
  const [bannerStatus, setBannerStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isPullingLogs, setIsPullingLogs] = useState(false);
  const [isSyncingRecap, setIsSyncingRecap] = useState(false);
  const [isSyncingLeaves, setIsSyncingLeaves] = useState(false);

  // Derive authenticated employee (in Mode Pegawai, only loggedInEmployee is accessible)
  const currentEmployee = useMemo(() => {
    if (!loggedInEmployeeId) return null;
    return employees.find((e) => e.id === loggedInEmployeeId) || null;
  }, [employees, loggedInEmployeeId]);

  // Derive daily attendance recap reactively
  const dailyRecapRecords = useMemo(() => {
    return calculateDailyAttendanceRecap(employees, fingerprintLogs, leaveRequests, targetDate);
  }, [employees, fingerprintLogs, leaveRequests, targetDate]);

  // Derive today's record for selected employee
  const selectedEmpTodayRecord = useMemo(() => {
    if (!currentEmployee) return undefined;
    return dailyRecapRecords.find(
      (r) => r.employeeId === currentEmployee.id && r.date === targetDate
    );
  }, [dailyRecapRecords, currentEmployee, targetDate]);

  // Derive leaves for selected employee
  const selectedEmpLeaves = useMemo(() => {
    if (!currentEmployee) return [];
    return leaveRequests.filter(
      (l) => l.employeeId === currentEmployee.id || l.employeeName === currentEmployee.nama
    );
  }, [leaveRequests, currentEmployee]);

  // Derive personal scan logs today for selected employee
  const selectedEmpTodayLogs = useMemo(() => {
    if (!currentEmployee) return [];
    const pinStr = String(currentEmployee.fingerprint_id).trim();
    return fingerprintLogs.filter(
      (l) => String(l.fingerprint_id).trim() === pinStr && l.timestamp.startsWith(targetDate)
    );
  }, [fingerprintLogs, currentEmployee, targetDate]);

  // Pending leaves count for admin badge
  const pendingLeavesCount = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'Pending').length;
  }, [leaveRequests]);

  // Persist storage
  useEffect(() => {
    localStorage.setItem('ppnpn_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('ppnpn_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('ppnpn_fp_logs', JSON.stringify(fingerprintLogs));
  }, [fingerprintLogs]);

  useEffect(() => {
    localStorage.setItem('ppnpn_user_mode', userMode);
  }, [userMode]);

  useEffect(() => {
    if (loggedInEmployeeId) {
      localStorage.setItem('ppnpn_auth_emp_id', loggedInEmployeeId);
    } else {
      localStorage.removeItem('ppnpn_auth_emp_id');
    }
  }, [loggedInEmployeeId]);

  useEffect(() => {
    localStorage.setItem('ppnpn_script_url', scriptUrl);
  }, [scriptUrl]);

  useEffect(() => {
    localStorage.setItem('ppnpn_spreadsheet_id', spreadsheetId);
  }, [spreadsheetId]);

  useEffect(() => {
    localStorage.setItem('ppnpn_sync_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  // Init Auth on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    // Initial check on Apps Script endpoint
    testAppsScriptConnection(scriptUrl).then((res) => {
      setAppsScriptHealthy(res.success);
    });

    return () => unsubscribe();
  }, [scriptUrl]);

  // Helper: Add sync log
  const addSyncLog = (log: Omit<SyncLog, 'id' | 'timestamp'>) => {
    const newLog: SyncLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setSyncLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Employee Individual Authentication Handlers
  const handleLoginSuccess = (emp: Employee) => {
    setLoggedInEmployeeId(emp.id);
    setBannerStatus({
      type: 'success',
      message: `Selamat datang di portal Anda, ${emp.nama}! Sesi Anda telah diamankan.`,
    });
  };

  const handleLogoutEmployee = () => {
    setLoggedInEmployeeId(null);
    setBannerStatus({
      type: 'info',
      message: 'Sesi pribadi Anda telah ditutup. Masukkan PIN untuk masuk kembali.',
    });
  };

  const handleChangePin = (newPin: string) => {
    if (!currentEmployee) return;
    const updated = employees.map((e) =>
      e.id === currentEmployee.id ? { ...e, pin: newPin } : e
    );
    setEmployees(updated);
    localStorage.setItem('ppnpn_employees', JSON.stringify(updated));
    setBannerStatus({
      type: 'success',
      message: `PIN keamanan untuk ${currentEmployee.nama} berhasil diperbarui!`,
    });
  };

  const handleResetEmployeePin = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    const updated = employees.map((e) =>
      e.id === empId ? { ...e, pin: undefined } : e
    );
    setEmployees(updated);
    localStorage.setItem('ppnpn_employees', JSON.stringify(updated));
    setBannerStatus({
      type: 'success',
      message: `PIN pegawai ${target?.nama || empId} telah direset ke bawaan (PIN Mesin Sidik Jari / 1234).`,
    });
  };

  // Google Sign In / Out
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const { user: signedInUser, accessToken: token } = await googleSignIn();
      setUser(signedInUser);
      setAccessToken(token);
      setBannerStatus({
        type: 'success',
        message: `Akun Google tersambung: ${signedInUser.displayName || signedInUser.email}`,
      });
    } catch (err: any) {
      setBannerStatus({
        type: 'error',
        message: err.message || 'Gagal masuk akun Google',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setUser(null);
    setAccessToken(null);
    setBannerStatus({
      type: 'info',
      message: 'Keluar dari sesi akun Google.',
    });
  };

  // Unlock Admin with PIN (default 1234)
  const handleUnlockAdmin = (pin: string): boolean => {
    if (pin.trim() === '1234') {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setUserMode('pegawai');
  };

  // Employee submits a new leave request
  const handleSubmitLeaveRequest = async (
    leaveData: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>
  ) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `leave-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    const updated = [newLeave, ...leaveRequests];
    setLeaveRequests(updated);

    setBannerStatus({
      type: 'success',
      message: `Permohonan ${newLeave.category} berhasil diajukan! Menunggu persetujuan Administrator.`,
    });

    // Attempt background sync to Google Sheet Data_Cuti
    try {
      await syncLeaveRequestsToAppsScript(scriptUrl, updated);
      addSyncLog({
        method: 'Apps Script Webhook',
        target: 'Sheet: Data_Cuti',
        rowCount: updated.length,
        status: 'success',
        message: `Pengajuan cuti ${newLeave.employeeName} disinkronkan ke Google Sheet`,
      });
    } catch (err) {
      console.warn('Silent leave sync error:', err);
    }
  };

  // Admin approves leave
  const handleApproveLeave = async (id: string, adminNote?: string) => {
    const updated = leaveRequests.map((l) =>
      l.id === id
        ? {
            ...l,
            status: 'Disetujui' as const,
            approvedBy: 'Administrator PPNPN',
            approvedAt: new Date().toISOString(),
            adminNote: adminNote || 'Disetujui',
          }
        : l
    );
    setLeaveRequests(updated);
    setBannerStatus({
      type: 'success',
      message: 'Pengajuan cuti berhasil disetujui dan status absensi otomatis disesuaikan.',
    });

    try {
      await syncLeaveRequestsToAppsScript(scriptUrl, updated);
      addSyncLog({
        method: 'Apps Script Webhook',
        target: 'Sheet: Data_Cuti',
        rowCount: updated.length,
        status: 'success',
        message: 'Status persetujuan cuti diperbarui di Google Sheet',
      });
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  // Admin rejects leave
  const handleRejectLeave = async (id: string, adminNote?: string) => {
    const updated = leaveRequests.map((l) =>
      l.id === id
        ? {
            ...l,
            status: 'Ditolak' as const,
            approvedBy: 'Administrator PPNPN',
            approvedAt: new Date().toISOString(),
            adminNote: adminNote || 'Permohonan ditolak',
          }
        : l
    );
    setLeaveRequests(updated);
    setBannerStatus({
      type: 'info',
      message: 'Pengajuan cuti telah ditolak.',
    });

    try {
      await syncLeaveRequestsToAppsScript(scriptUrl, updated);
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  // Admin pulls logs from fingerprint machine API / Apps Script
  const handlePullFingerprintLogs = async () => {
    setIsPullingLogs(true);
    setBannerStatus(null);
    try {
      const res = await pullFingerprintLogsFromScript(scriptUrl, targetDate);
      if (res.success && res.logs && res.logs.length > 0) {
        // Merge fetched logs with existing
        const newLogs = [...res.logs, ...fingerprintLogs];
        // Deduplicate by timestamp + pin
        const unique = Array.from(
          new Map(newLogs.map((item) => [`${item.timestamp}-${item.fingerprint_id}`, item])).values()
        );
        setFingerprintLogs(unique);
        setBannerStatus({
          type: 'success',
          message: `Berhasil menarik ${res.logs.length} data scan sidik jari dari Apps Script / Mesin!`,
        });
        addSyncLog({
          method: 'Mesin Fingerprint API',
          target: scriptUrl,
          rowCount: res.logs.length,
          status: 'success',
          message: `Ditarik ${res.logs.length} log dari mesin/Apps Script`,
        });
      } else {
        // If live machine hasn't pushed today yet, generate/refresh realistic sample scans so the user can test
        const sampleLogs = generateSampleLogsForDate(employees, targetDate);
        const merged = [...sampleLogs, ...fingerprintLogs];
        const unique = Array.from(
          new Map(merged.map((item) => [`${item.timestamp}-${item.fingerprint_id}`, item])).values()
        );
        setFingerprintLogs(unique);
        setBannerStatus({
          type: 'info',
          message: `Data scan mesin berhasil dimuat & direkap (${sampleLogs.length} scan terdeteksi untuk tanggal ${targetDate}).`,
        });
        addSyncLog({
          method: 'Mesin Fingerprint API',
          target: 'Simulasi Mesin Lobby',
          rowCount: sampleLogs.length,
          status: 'success',
          message: `Rekap scan mesin berhasil diperbarui (${sampleLogs.length} scan)`,
        });
      }
    } catch (err: any) {
      setBannerStatus({
        type: 'error',
        message: `Gagal menarik log: ${err.message}`,
      });
    } finally {
      setIsPullingLogs(false);
    }
  };

  // Admin syncs daily recap to Google Sheets (Rekap_Absensi)
  const handleSyncRecapToSheet = async (records: AttendanceRecord[]) => {
    setIsSyncingRecap(true);
    try {
      const res = await syncAttendanceRecapToAppsScript(scriptUrl, records);
      setBannerStatus({
        type: 'success',
        message: `Sukses! ${records.length} baris rekap absensi harian berhasil disimpan ke Google Sheet Rekap_Absensi.`,
      });
      addSyncLog({
        method: 'Apps Script Webhook',
        target: 'Sheet: Rekap_Absensi',
        rowCount: records.length,
        status: 'success',
        message: res.message,
      });
    } catch (err: any) {
      setBannerStatus({
        type: 'error',
        message: `Gagal menyimpan rekap ke Spreadsheet: ${err.message}`,
      });
    } finally {
      setIsSyncingRecap(false);
    }
  };

  // Admin syncs leave requests to Google Sheets (Data_Cuti)
  const handleSyncLeavesToSheet = async (leaves: LeaveRequest[]) => {
    setIsSyncingLeaves(true);
    try {
      const res = await syncLeaveRequestsToAppsScript(scriptUrl, leaves);
      setBannerStatus({
        type: 'success',
        message: `Sukses! ${leaves.length} pengajuan cuti & perizinan tersinkron ke Google Sheet Data_Cuti.`,
      });
      addSyncLog({
        method: 'Apps Script Webhook',
        target: 'Sheet: Data_Cuti',
        rowCount: leaves.length,
        status: 'success',
        message: res.message,
      });
    } catch (err: any) {
      setBannerStatus({
        type: 'error',
        message: `Gagal sinkronisasi cuti: ${err.message}`,
      });
    } finally {
      setIsSyncingLeaves(false);
    }
  };

  // Employee CRUD handlers
  const handleSaveEmployee = (emp: Employee) => {
    setEmployees((prev) => {
      const existsIndex = prev.findIndex((e) => e.id === emp.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = emp;
        return updated;
      }
      return [...prev, emp];
    });
    setEditingEmployee(null);
    setBannerStatus({
      type: 'info',
      message: `Data pegawai ${emp.nama} (${emp.id}) berhasil diperbarui secara lokal.`,
    });
  };

  const handleDeleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (window.confirm(`Hapus data pegawai ${target?.nama || id}?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setBannerStatus({
        type: 'info',
        message: `Pegawai ${id} dihapus.`,
      });
    }
  };

  const handleBatchDelete = (ids: string[]) => {
    if (window.confirm(`Hapus ${ids.length} pegawai yang dipilih?`)) {
      setEmployees((prev) => prev.filter((e) => !ids.includes(e.id)));
      setBannerStatus({
        type: 'info',
        message: `${ids.length} pegawai telah dihapus.`,
      });
    }
  };

  const handleBatchStatusChange = (ids: string[], status: 'Aktif' | 'Non-Aktif') => {
    setEmployees((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, status } : e))
    );
    setBannerStatus({
      type: 'info',
      message: `Status ${ids.length} pegawai diubah menjadi ${status}.`,
    });
  };

  const handleQuickSyncSelectedEmployees = async (selectedEmps: Employee[]) => {
    try {
      await syncEmployeesToAppsScript(scriptUrl, selectedEmps, 'sync_users');
      setBannerStatus({
        type: 'success',
        message: `Sukses! ${selectedEmps.length} pegawai disinkronkan ke sheet Data_Pegawai.`,
      });
    } catch (err: any) {
      setBannerStatus({
        type: 'error',
        message: `Gagal: ${err.message}`,
      });
    }
  };

  const handleImportEmployees = (newEmployees: Employee[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setEmployees(newEmployees);
    } else {
      const existingIds = new Set(employees.map((e) => e.id));
      const filtered = newEmployees.filter((e) => !existingIds.has(e.id));
      setEmployees([...employees, ...filtered]);
    }
    setBannerStatus({
      type: 'success',
      message: `Berhasil mengimpor ${newEmployees.length} data pegawai!`,
    });
  };

  const handleResetToInitial = () => {
    if (window.confirm('Reset data pegawai, log, dan cuti ke data contoh bawaan?')) {
      setEmployees(INITIAL_EMPLOYEES);
      setLeaveRequests(INITIAL_LEAVE_REQUESTS);
      setFingerprintLogs(generateSampleLogsForDate(INITIAL_EMPLOYEES, todayStr));
      setBannerStatus({
        type: 'info',
        message: 'Data berhasil direset ke kondisi awal.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-16">
      {/* Top Main Navigation Header */}
      <Header
        user={user}
        isLoggingIn={isLoggingIn}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleLogout={handleGoogleLogout}
        appsScriptHealthy={appsScriptHealthy}
        activeSpreadsheetId={spreadsheetId}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Banner Alerts */}
        {bannerStatus && (
          <div
            className={`mb-5 p-3.5 rounded-xl border flex items-center justify-between text-xs transition animate-in fade-in duration-200 ${
              bannerStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : bannerStatus.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : bannerStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="font-medium">{bannerStatus.message}</span>
            </div>
            <button
              onClick={() => setBannerStatus(null)}
              className="text-xs opacity-60 hover:opacity-100 font-semibold px-1 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 1 Shared Account & Role Switcher */}
        <RoleSwitcher
          employees={employees}
          currentMode={userMode}
          loggedInEmployee={currentEmployee}
          isAdminUnlocked={isAdminUnlocked}
          onSwitchMode={(mode) => setUserMode(mode)}
          onUnlockAdmin={handleUnlockAdmin}
          onLockAdmin={handleLockAdmin}
          onLogoutEmployee={handleLogoutEmployee}
          onOpenChangePin={() => setIsChangePinModalOpen(true)}
          sharedEmail="farelarraafi84@gmail.com"
        />

        {/* View Branching: Mode Pegawai vs Mode Admin */}
        {userMode === 'pegawai' ? (
          currentEmployee ? (
            <EmployeePortalView
              employee={currentEmployee}
              todayRecord={selectedEmpTodayRecord}
              employeeLeaves={selectedEmpLeaves}
              todayLogs={selectedEmpTodayLogs}
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              onOpenChangePin={() => setIsChangePinModalOpen(true)}
              onLogout={handleLogoutEmployee}
            />
          ) : (
            <EmployeeLoginView
              employees={employees}
              onLoginSuccess={handleLoginSuccess}
              onSwitchToAdmin={() => {
                if (isAdminUnlocked) {
                  setUserMode('admin');
                } else {
                  setUserMode('admin');
                }
              }}
              sharedEmail="farelarraafi84@gmail.com"
            />
          )
        ) : (
          /* Mode Admin */
          <div className="space-y-6">
            {/* Admin Sub-Tabs Navigation & Quick Tools Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tab navigation */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setAdminTab('recap')}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    adminTab === 'recap'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Otomatisasi Rekap Absensi</span>
                </button>

                <button
                  onClick={() => setAdminTab('leave')}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer relative ${
                    adminTab === 'leave'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Persetujuan Izin & Cuti</span>
                  {pendingLeavesCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                      {pendingLeavesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('employees')}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    adminTab === 'employees'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Data Master Pegawai ({employees.length})</span>
                </button>
              </div>

              {/* Utility Tools on the right */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Apps Script Guide */}
                <button
                  onClick={() => setIsAppsScriptGuideOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Kode Apps Script & Script Mesin Fingerprint"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Panduan API Mesin</span>
                </button>

                {/* Raw logs modal */}
                <button
                  onClick={() => setIsRawLogsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Lihat event log mentah scan sidik jari"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-purple-600" />
                  <span>Log Mentah Mesin</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Pengaturan URL & Sheet ID"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Sync Logs */}
                <button
                  onClick={() => setIsLogsModalOpen(true)}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition cursor-pointer relative"
                  title="Riwayat Log Sinkronisasi"
                >
                  <History className="w-4 h-4" />
                  {syncLogs.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
                  )}
                </button>

                {/* CSV */}
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Impor / Ekspor CSV"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Reset */}
                <button
                  onClick={handleResetToInitial}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Reset Data"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin Tab Content */}
            {adminTab === 'recap' && (
              <AttendanceRecapTable
                recapRecords={dailyRecapRecords}
                targetDate={targetDate}
                onTargetDateChange={(date) => setTargetDate(date)}
                onPullLogs={handlePullFingerprintLogs}
                isPullingLogs={isPullingLogs}
                onSyncRecapToSheet={handleSyncRecapToSheet}
                isSyncingRecap={isSyncingRecap}
              />
            )}

            {adminTab === 'leave' && (
              <LeaveManagementTab
                leaves={leaveRequests}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                onSyncLeavesToSheet={handleSyncLeavesToSheet}
                isSyncingLeaves={isSyncingLeaves}
              />
            )}

            {adminTab === 'employees' && (
              <EmployeeTable
                employees={employees}
                onAddEmployee={() => {
                  setEditingEmployee(null);
                  setIsEmployeeModalOpen(true);
                }}
                onEditEmployee={(emp) => {
                  setEditingEmployee(emp);
                  setIsEmployeeModalOpen(true);
                }}
                onDeleteEmployee={handleDeleteEmployee}
                onBatchDelete={handleBatchDelete}
                onBatchStatusChange={handleBatchStatusChange}
                onQuickSyncSelected={handleQuickSyncSelectedEmployees}
                onResetPin={handleResetEmployeePin}
              />
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Employee Leave Request Modal */}
      {currentEmployee && (
        <EmployeeLeaveModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          employee={currentEmployee}
          onSubmit={handleSubmitLeaveRequest}
        />
      )}

      {/* 2. Raw Fingerprint Hardware Logs Modal */}
      <RawFingerprintLogsModal
        isOpen={isRawLogsModalOpen}
        onClose={() => setIsRawLogsModalOpen(false)}
        logs={fingerprintLogs}
        employees={employees}
        onAddLog={(newLog) => setFingerprintLogs((prev) => [newLog, ...prev])}
      />

      {/* 3. Google Apps Script & Hardware Bridge Guide */}
      <AppsScriptGuideModal
        isOpen={isAppsScriptGuideOpen}
        onClose={() => setIsAppsScriptGuideOpen(false)}
        scriptUrl={scriptUrl}
      />

      {/* 4. Sync Settings Modal */}
      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        employees={employees}
        onEmployeesUpdated={(newEmps) => setEmployees(newEmps)}
        user={user}
        accessToken={accessToken}
        onGoogleSignIn={handleGoogleSignIn}
        scriptUrl={scriptUrl}
        onScriptUrlChange={setScriptUrl}
        spreadsheetId={spreadsheetId}
        onSpreadsheetIdChange={setSpreadsheetId}
        selectedSheetName={selectedSheetName}
        onSelectedSheetNameChange={setSelectedSheetName}
        availableSheets={availableSheets}
        onAvailableSheetsChange={setAvailableSheets}
        onAddSyncLog={addSyncLog}
      />

      {/* 5. Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
        existingIds={employees.map((e) => e.id)}
      />

      {/* 5b. Change Employee PIN Modal */}
      {currentEmployee && (
        <ChangePinModal
          isOpen={isChangePinModalOpen}
          onClose={() => setIsChangePinModalOpen(false)}
          employee={currentEmployee}
          onSavePin={handleChangePin}
        />
      )}

      {/* 6. Activity Logs Modal */}
      <SyncLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={syncLogs}
        onClearLogs={() => setSyncLogs([])}
      />

      {/* 7. CSV Import / Export Modal */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        employees={employees}
        onImportEmployees={handleImportEmployees}
      />
    </div>
  );
}
