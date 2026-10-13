export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * SISTEM ABSENSI & CUTI PPNPN - GOOGLE APPS SCRIPT API GATEWAY
 * =========================================================================
 * Petunjuk Pemasangan:
 * 1. Buka Google Sheets database Anda.
 * 2. Klik menu "Ekstensi" > "Apps Script" (Extensions > Apps Script).
 * 3. Hapus kode bawaan, lalu paste seluruh isi file script ini ke Code.gs.
 * 4. Klik "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 5. Pilih jenis "Aplikasi Web" (Web App):
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 6. Salin URL Aplikasi Web dan masukkan ke pengaturan aplikasi Web PPNPN.
 * =========================================================================
 */

// Inisialisasi Sheet & Header otomatis jika belum ada
function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#10b981");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// GET Request Handler (Status Check & Query Data)
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "status";
  
  if (action === "get_logs") {
    return jsonResponse(getFingerprintLogs());
  } else if (action === "get_leave") {
    return jsonResponse(getLeaveRequests());
  } else if (action === "get_recap") {
    return jsonResponse(getAttendanceRecap());
  } else if (action === "get_users") {
    return jsonResponse(getUsers());
  }
  
  return jsonResponse({
    success: true,
    status: "active",
    message: "API Absensi PPNPN aktif",
    timestamp: new Date().toISOString()
  });
}

// POST Request Handler (Webhook Fingerprint Machine & App Sync)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = {};
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter || {};
    }
    
    var action = data.action || (e.parameter && e.parameter.action) || "sync_users";
    
    // 1. Terima Log Langsung dari Mesin Fingerprint / Software Mesin
    if (action === "machine_push_log" || action === "push_log") {
      var logSheet = getOrCreateSheet("Log_Fingerprint", [
        "Waktu Scan", "Fingerprint ID / PIN", "Tipe", "Mesin / SN", "Diterima Pada"
      ]);
      
      var logs = data.logs || [data];
      var rows = [];
      var now = new Date();
      
      for (var i = 0; i < logs.length; i++) {
        var item = logs[i];
        rows.push([
          item.timestamp || Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
          item.fingerprint_id || item.pin || "-",
          item.type || "CHECK",
          item.device_name || item.sn || "MESIN-01",
          now.toISOString()
        ]);
      }
      
      if (rows.length > 0) {
        logSheet.getRange(logSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      }
      
      return jsonResponse({
        success: true,
        message: "Berhasil menerima " + rows.length + " log dari mesin fingerprint",
        count: rows.length
      });
    }
    
    // 2. Sinkronisasi Data Master Pegawai
    if (action === "sync_users") {
      var userSheet = getOrCreateSheet("Data_Pegawai", [
        "ID", "Fingerprint ID", "Nama Pegawai", "Jabatan", "Regu", "Role App", "Status", "Terakhir Update"
      ]);
      
      var users = data.users || [];
      if (users.length > 0) {
        // Kosongkan baris lama selain header
        var lastRow = userSheet.getLastRow();
        if (lastRow > 1) {
          userSheet.getRange(2, 1, lastRow - 1, 8).clearContent();
        }
        
        var userRows = users.map(function(u) {
          return [
            u.id || "",
            u.fingerprint_id || "",
            u.nama || "",
            u.jabatan || "STAFF",
            u.regu || "-",
            u.role_app || "pegawai",
            u.status || "Aktif",
            new Date().toISOString()
          ];
        });
        
        userSheet.getRange(2, 1, userRows.length, 8).setValues(userRows);
      }
      
      return jsonResponse({
        success: true,
        message: "Berhasil memperbarui " + users.length + " data master pegawai di spreadsheet",
        count: users.length
      });
    }
    
    // 3. Sinkronisasi Rekap Harian Absensi
    if (action === "sync_recap") {
      var recapSheet = getOrCreateSheet("Rekap_Absensi", [
        "Tanggal", "ID Pegawai", "Fingerprint PIN", "Nama Pegawai", "Jabatan", "Regu",
        "Jam Masuk", "Jam Pulang", "Status Kehadiran", "Terlambat (Menit)", "Pulang Cepat (Menit)", "Durasi Kerja", "Catatan"
      ]);
      
      var recaps = data.recaps || [];
      var recapRows = recaps.map(function(r) {
        return [
          r.date || "",
          r.employeeId || "",
          r.fingerprint_id || "",
          r.nama || "",
          r.jabatan || "",
          r.regu || "",
          r.checkIn || "-",
          r.checkOut || "-",
          r.status || "Hadir",
          r.lateMinutes || 0,
          r.earlyMinutes || 0,
          r.workHours || "-",
          r.notes || ""
        ];
      });
      
      if (recapRows.length > 0) {
        recapSheet.getRange(recapSheet.getLastRow() + 1, 1, recapRows.length, recapRows[0].length).setValues(recapRows);
      }
      
      return jsonResponse({
        success: true,
        message: "Rekap absensi (" + recapRows.length + " baris) berhasil disimpan ke spreadsheet",
        count: recapRows.length
      });
    }
    
    // 4. Sinkronisasi Pengajuan & Status Izin / Cuti
    if (action === "sync_leave") {
      var leaveSheet = getOrCreateSheet("Data_Cuti", [
        "ID Pengajuan", "ID Pegawai", "Nama Pegawai", "Kategori", "Tgl Mulai", "Tgl Selesai",
        "Durasi (Hari)", "Alasan", "Kontak Darurat", "Status", "Disetujui Oleh", "Catatan Admin", "Diajukan Pada"
      ]);
      
      var leaves = data.leaves || [];
      if (leaves.length > 0) {
        var lastRow = leaveSheet.getLastRow();
        if (lastRow > 1) {
          leaveSheet.getRange(2, 1, lastRow - 1, 13).clearContent();
        }
        
        var leaveRows = leaves.map(function(l) {
          return [
            l.id || "",
            l.employeeId || "",
            l.employeeName || "",
            l.category || "Cuti Tahunan",
            l.startDate || "",
            l.endDate || "",
            l.durationDays || 1,
            l.reason || "",
            l.emergencyContact || "-",
            l.status || "Pending",
            l.approvedBy || "-",
            l.adminNote || "-",
            l.submittedAt || new Date().toISOString()
          ];
        });
        
        leaveSheet.getRange(2, 1, leaveRows.length, 13).setValues(leaveRows);
      }
      
      return jsonResponse({
        success: true,
        message: "Data cuti & perizinan (" + leaves.length + " pengajuan) berhasil disinkronkan",
        count: leaves.length
      });
    }
    
    return jsonResponse({
      success: true,
      message: "Aksi " + action + " diterima oleh Apps Script",
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

// Helpers pembaca data
function getFingerprintLogs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log_Fingerprint");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      timestamp: data[i][0],
      fingerprint_id: data[i][1],
      type: data[i][2],
      device_name: data[i][3]
    });
  }
  return result;
}

function getLeaveRequests() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data_Cuti");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      id: data[i][0],
      employeeId: data[i][1],
      employeeName: data[i][2],
      category: data[i][3],
      startDate: data[i][4],
      endDate: data[i][5],
      durationDays: data[i][6],
      reason: data[i][7],
      emergencyContact: data[i][8],
      status: data[i][9],
      approvedBy: data[i][10],
      adminNote: data[i][11],
      submittedAt: data[i][12]
    });
  }
  return result;
}

function getAttendanceRecap() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Rekap_Absensi");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      date: data[i][0],
      employeeId: data[i][1],
      fingerprint_id: data[i][2],
      nama: data[i][3],
      jabatan: data[i][4],
      regu: data[i][5],
      checkIn: data[i][6],
      checkOut: data[i][7],
      status: data[i][8],
      lateMinutes: data[i][9],
      earlyMinutes: data[i][10],
      workHours: data[i][11],
      notes: data[i][12]
    });
  }
  return result;
}

function getUsers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data_Pegawai");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      id: data[i][0],
      fingerprint_id: data[i][1],
      nama: data[i][2],
      jabatan: data[i][3],
      regu: data[i][4],
      role_app: data[i][5],
      status: data[i][6]
    });
  }
  return result;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
