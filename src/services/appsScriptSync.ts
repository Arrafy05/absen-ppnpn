import { Employee } from '../types';

export interface AppsScriptTestResult {
  success: boolean;
  message: string;
  timestamp?: string;
  raw?: any;
}

export const testAppsScriptConnection = async (
  scriptUrl: string
): Promise<AppsScriptTestResult> => {
  try {
    // Try via local proxy first to avoid CORS redirect issues
    const proxyRes = await fetch('/api/sync-script/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: data.success ?? true,
        message: data.message || 'Koneksi ke Apps Script berhasil',
        timestamp: data.timestamp,
        raw: data,
      };
    }
  } catch (err) {
    console.warn('Proxy test failed, falling back to direct fetch', err);
  }

  // Direct client fetch fallback
  try {
    const res = await fetch(scriptUrl, {
      method: 'GET',
    });
    const data = await res.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Koneksi Apps Script Web App aktif',
      timestamp: data.timestamp,
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menghubungi script.google.com endpoint',
    };
  }
};

export const syncEmployeesToAppsScript = async (
  scriptUrl: string,
  employees: Employee[],
  action: string = 'sync_users'
): Promise<{ success: boolean; message: string; data?: any }> => {
  const payload = {
    action,
    count: employees.length,
    timestamp: new Date().toISOString(),
    users: employees.map((emp) => ({
      id: emp.id,
      fingerprint_id: emp.fingerprint_id,
      nama: emp.nama,
      jabatan: emp.jabatan,
      regu: emp.regu,
      role_app: emp.role_app,
      status: emp.status,
    })),
  };

  // Try via local Express backend proxy
  try {
    const proxyRes = await fetch('/api/sync-script/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptUrl,
        payload,
      }),
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      return {
        success: true,
        message: resData.message || `Berhasil mensinkronisasi ${employees.length} data ke Apps Script`,
        data: resData,
      };
    }
  } catch (err) {
    console.warn('Backend proxy sync failed, trying direct...', err);
  }

  // Fallback: send directly (or with standard form data)
  try {
    // Note: Apps Script POST often redirects 302. Sending as text/plain or no-cors
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Data (${employees.length} pegawai) dikirim langsung ke Apps Script endpoint (no-cors mode)`,
    };
  } catch (error: any) {
    throw new Error(`Gagal mengirim data ke Apps Script: ${error.message}`);
  }
};

// Pull raw fingerprint logs from Apps Script / Google Sheet
export const pullFingerprintLogsFromScript = async (
  scriptUrl: string,
  date?: string
): Promise<{ success: boolean; logs: any[]; message: string }> => {
  try {
    const proxyRes = await fetch('/api/fingerprint/pull-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, date }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: data.success,
        logs: data.logs || [],
        message: data.message || `Ditemukan ${(data.logs || []).length} log scan fingerprint`,
      };
    }
  } catch (err) {
    console.warn('Proxy pull logs failed:', err);
  }

  // Direct fetch fallback
  try {
    const directUrl = new URL(scriptUrl);
    directUrl.searchParams.set('action', 'get_logs');
    if (date) directUrl.searchParams.set('date', date);

    const res = await fetch(directUrl.toString(), { method: 'GET' });
    const data = await res.json();
    return {
      success: true,
      logs: Array.isArray(data) ? data : data.logs || [],
      message: 'Log fingerprint berhasil ditarik langsung dari Apps Script',
    };
  } catch (err: any) {
    return {
      success: false,
      logs: [],
      message: err.message || 'Gagal menarik log dari Apps Script',
    };
  }
};

// Sync daily attendance recap to Google Apps Script (Sheet: Rekap_Absensi)
export const syncAttendanceRecapToAppsScript = async (
  scriptUrl: string,
  recaps: any[]
): Promise<{ success: boolean; message: string }> => {
  const payload = {
    action: 'sync_recap',
    count: recaps.length,
    timestamp: new Date().toISOString(),
    recaps,
  };

  try {
    const proxyRes = await fetch('/api/sync-script/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, payload }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: true,
        message: data.message || `${recaps.length} data rekap absensi berhasil disimpan ke Spreadsheet`,
      };
    }
  } catch (err) {
    console.warn('Proxy sync recap failed, trying direct...', err);
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      message: `${recaps.length} data rekap absensi dikirim ke Apps Script (no-cors mode)`,
    };
  } catch (err: any) {
    throw new Error(`Gagal mengirim rekap ke Apps Script: ${err.message}`);
  }
};

// Sync leave requests to Google Apps Script (Sheet: Data_Cuti)
export const syncLeaveRequestsToAppsScript = async (
  scriptUrl: string,
  leaves: any[]
): Promise<{ success: boolean; message: string }> => {
  const payload = {
    action: 'sync_leave',
    count: leaves.length,
    timestamp: new Date().toISOString(),
    leaves,
  };

  try {
    const proxyRes = await fetch('/api/sync-script/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl, payload }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: true,
        message: data.message || `${leaves.length} pengajuan cuti berhasil disinkronkan ke Spreadsheet`,
      };
    }
  } catch (err) {
    console.warn('Proxy sync leave failed, trying direct...', err);
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      message: `${leaves.length} data cuti dikirim ke Apps Script (no-cors mode)`,
    };
  } catch (err: any) {
    throw new Error(`Gagal mengirim cuti ke Apps Script: ${err.message}`);
  }
};

