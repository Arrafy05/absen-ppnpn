import { Employee, FingerprintRawLog, AttendanceRecord, LeaveRequest } from '../types';

// Standar jam kerja kantor PPNPN
export const SHIFT_RULES = {
  STAFF: {
    start: '07:30',
    lateThreshold: '08:00',
    end: '16:30',
  },
  SECURITY: {
    start: '07:00',
    lateThreshold: '07:15',
    end: '19:00',
  },
};

// Generate initial sample raw scan logs for today's demonstration
export const generateSampleLogsForDate = (
  employees: Employee[],
  dateStr: string // YYYY-MM-DD
): FingerprintRawLog[] => {
  const logs: FingerprintRawLog[] = [];
  let logId = 1;

  // Let's create realistic scans for ~80% of employees
  employees.forEach((emp, index) => {
    // Skip a few employees to simulate absent / on leave
    if (index === 3 || index === 9 || index === 21) {
      return;
    }

    const pin = emp.fingerprint_id;
    if (!pin || pin === '-') return;

    // Morning check-in variations: 06:50 - 08:35
    let hour = 7;
    let minute = Math.floor((index * 7) % 55);
    let second = Math.floor((index * 13) % 60);

    // Some arrive late after 08:00
    if (index % 6 === 0) {
      hour = 8;
      minute = Math.floor(5 + (index % 25));
    } else if (index % 4 === 0) {
      hour = 7;
      minute = Math.floor(45 + (index % 15));
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const timeIn = `${dateStr} ${pad(hour)}:${pad(minute)}:${pad(second)}`;

    logs.push({
      id: `log-${dateStr}-${logId++}`,
      fingerprint_id: pin,
      timestamp: timeIn,
      type: 'IN',
      device_name: 'MESIN-FP-LOBBY-01',
    });

    // Afternoon check-out for some who have finished shift
    if (index % 3 !== 0) {
      let outHour = 16;
      let outMin = Math.floor(30 + (index % 28));
      let outSec = Math.floor((index * 19) % 60);
      const timeOut = `${dateStr} ${pad(outHour)}:${pad(outMin)}:${pad(outSec)}`;

      logs.push({
        id: `log-${dateStr}-${logId++}`,
        fingerprint_id: pin,
        timestamp: timeOut,
        type: 'OUT',
        device_name: 'MESIN-FP-LOBBY-01',
      });
    }
  });

  return logs;
};

// Calculate attendance record for all employees on a specific date
export const calculateDailyAttendanceRecap = (
  employees: Employee[],
  logs: FingerprintRawLog[],
  leaves: LeaveRequest[],
  targetDate: string // YYYY-MM-DD
): AttendanceRecord[] => {
  // 1. Filter logs for targetDate
  const dayLogs = logs.filter((l) => l.timestamp.startsWith(targetDate));

  // 2. Group logs by fingerprint_id
  const logsByPin: Record<string, string[]> = {};
  dayLogs.forEach((l) => {
    const pinStr = String(l.fingerprint_id).trim();
    if (!logsByPin[pinStr]) logsByPin[pinStr] = [];
    logsByPin[pinStr].push(l.timestamp);
  });

  // Sort timestamps for each pin
  Object.keys(logsByPin).forEach((pin) => {
    logsByPin[pin].sort();
  });

  // 3. Process each employee
  return employees.map((emp) => {
    const pinStr = String(emp.fingerprint_id).trim();
    const empLogs = logsByPin[pinStr] || [];

    // Check if employee has an approved leave request on this date
    const approvedLeave = leaves.find((l) => {
      if (l.employeeId !== emp.id && l.employeeName !== emp.nama) return false;
      if (l.status !== 'Disetujui') return false;
      return targetDate >= l.startDate && targetDate <= l.endDate;
    });

    // If approved leave exists
    if (approvedLeave) {
      const isSick = approvedLeave.category.includes('Sakit');
      return {
        id: `recap-${targetDate}-${emp.id}`,
        date: targetDate,
        employeeId: emp.id,
        nama: emp.nama,
        fingerprint_id: emp.fingerprint_id,
        jabatan: emp.jabatan,
        regu: emp.regu,
        checkIn: null,
        checkOut: null,
        status: isSick ? 'Izin' : 'Cuti',
        lateMinutes: 0,
        earlyMinutes: 0,
        workHours: '-',
        notes: `${approvedLeave.category}: ${approvedLeave.reason}`,
        syncedToSheet: false,
      };
    }

    // If no logs at all
    if (empLogs.length === 0) {
      return {
        id: `recap-${targetDate}-${emp.id}`,
        date: targetDate,
        employeeId: emp.id,
        nama: emp.nama,
        fingerprint_id: emp.fingerprint_id,
        jabatan: emp.jabatan,
        regu: emp.regu,
        checkIn: null,
        checkOut: null,
        status: 'Tidak Hadir',
        lateMinutes: 0,
        earlyMinutes: 0,
        workHours: '-',
        notes: emp.status === 'Non-Aktif' ? 'Pegawai Non-Aktif' : 'Belum Melakukan Scan',
        syncedToSheet: false,
      };
    }

    // Earliest scan = check-in
    const firstScan = empLogs[0];
    const checkInTime = firstScan.slice(11, 16); // HH:mm

    // Latest scan = check-out (if at least 10 minutes later)
    let checkOutTime: string | null = null;
    if (empLogs.length > 1) {
      const lastScan = empLogs[empLogs.length - 1];
      const lastTime = lastScan.slice(11, 16);
      if (lastTime !== checkInTime) {
        checkOutTime = lastTime;
      }
    }

    // Calculate Late
    const [inH, inM] = checkInTime.split(':').map(Number);
    const inTotalMinutes = inH * 60 + inM;
    const thresholdMinutes = emp.jabatan === 'SECURITY' ? 7 * 60 + 15 : 8 * 60; // 08:00
    const lateMinutes = Math.max(0, inTotalMinutes - thresholdMinutes);

    // Calculate Early Leave
    let earlyMinutes = 0;
    const standardOutMinutes = emp.jabatan === 'SECURITY' ? 19 * 60 : 16 * 60 + 30; // 16:30
    if (checkOutTime) {
      const [outH, outM] = checkOutTime.split(':').map(Number);
      const outTotalMinutes = outH * 60 + outM;
      if (outTotalMinutes < standardOutMinutes) {
        earlyMinutes = standardOutMinutes - outTotalMinutes;
      }
    }

    // Determine status
    let status: AttendanceRecord['status'] = 'Hadir';
    if (lateMinutes > 0) {
      status = 'Terlambat';
    } else if (earlyMinutes > 0 && checkOutTime) {
      status = 'Pulang Cepat';
    }

    // Duration calculation
    let workHours = '-';
    if (checkInTime && checkOutTime) {
      const [oH, oM] = checkOutTime.split(':').map(Number);
      const diffM = oH * 60 + oM - (inH * 60 + inM);
      if (diffM > 0) {
        const hrs = Math.floor(diffM / 60);
        const mins = diffM % 60;
        workHours = `${hrs}j ${mins}m`;
      }
    }

    return {
      id: `recap-${targetDate}-${emp.id}`,
      date: targetDate,
      employeeId: emp.id,
      nama: emp.nama,
      fingerprint_id: emp.fingerprint_id,
      jabatan: emp.jabatan,
      regu: emp.regu,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status,
      lateMinutes,
      earlyMinutes,
      workHours,
      notes: lateMinutes > 0 ? `Terlambat ${lateMinutes} menit` : 'Tepat Waktu',
      syncedToSheet: false,
    };
  });
};
