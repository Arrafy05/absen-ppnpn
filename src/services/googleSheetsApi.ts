import { Employee } from '../types';

export const extractSpreadsheetId = (input: string): string => {
  const trimmed = input.trim();
  // Matches docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

export const fetchSpreadsheetInfo = async (
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheetNames: string[] }> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch spreadsheet info (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const title = data.properties?.title || 'Untitled Spreadsheet';
  const sheetNames = (data.sheets || []).map(
    (s: any) => s.properties?.title || 'Sheet1'
  );

  return { title, sheetNames };
};

export const createNewSpreadsheet = async (
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetName: string }> => {
  const sheetName = 'Data_Pegawai';
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Data Pegawai PPNPN - User Sync',
      },
      sheets: [
        {
          properties: {
            title: sheetName,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create new spreadsheet (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl, sheetName };
};

export const syncEmployeesToSheet = async (
  spreadsheetId: string,
  sheetName: string,
  employees: Employee[],
  accessToken: string
): Promise<{ updatedRows: number; spreadsheetUrl: string }> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const header = ['id', 'fingerprint_id', 'nama', 'jabatan', 'regu', 'role_app', 'status', 'terakhir_sync'];

  const rows = employees.map((emp) => [
    emp.id,
    emp.fingerprint_id.toString(),
    emp.nama,
    emp.jabatan,
    emp.regu,
    emp.role_app,
    emp.status,
    new Date().toISOString(),
  ]);

  const allValues = [header, ...rows];
  const range = `'${sheetName}'!A1:H${allValues.length}`;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to write data to Google Sheet (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const updatedRows = data.updatedRows || allValues.length;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

  return { updatedRows, spreadsheetUrl };
};

export const readEmployeesFromSheet = async (
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<Employee[]> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `'${sheetName}'!A1:G500`;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to read from Google Sheet (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is headers
  const dataRows = rows.slice(1);
  return dataRows.map((row, index) => ({
    id: row[0] ? String(row[0]) : `P${String(index + 1).padStart(3, '0')}`,
    fingerprint_id: row[1] ? String(row[1]) : '',
    nama: row[2] ? String(row[2]) : 'Tanpa Nama',
    jabatan: row[3] ? String(row[3]) : 'STAFF',
    regu: row[4] ? String(row[4]) : '-',
    role_app: row[5] ? String(row[5]) : 'pegawai',
    status: row[6] ? String(row[6]) : 'Aktif',
    lastSyncedAt: new Date().toISOString(),
  }));
};
