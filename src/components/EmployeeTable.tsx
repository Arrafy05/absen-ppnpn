import React, { useState, useMemo } from 'react';
import { Employee, FilterJabatan, FilterRegu, FilterStatus } from '../types';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Shield,
  Briefcase,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  KeyRound,
  Lock,
} from 'lucide-react';

interface EmployeeTableProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchStatusChange: (ids: string[], status: 'Aktif' | 'Non-Aktif') => void;
  onQuickSyncSelected?: (employees: Employee[]) => void;
  onResetPin?: (id: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onBatchDelete,
  onBatchStatusChange,
  onQuickSyncSelected,
  onResetPin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJabatan, setFilterJabatan] = useState<string>('ALL');
  const [filterRegu, setFilterRegu] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [sortBy, setSortBy] = useState<'id' | 'nama' | 'fingerprint_id' | 'jabatan'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered & Sorted employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesSearch =
          emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(emp.fingerprint_id).includes(searchTerm);

        const matchesJabatan =
          filterJabatan === 'ALL' || emp.jabatan.toUpperCase() === filterJabatan;

        const matchesRegu =
          filterRegu === 'ALL' || emp.regu.toUpperCase() === filterRegu;

        const matchesStatus =
          filterStatus === 'ALL' || emp.status.toUpperCase() === filterStatus.toUpperCase();

        return matchesSearch && matchesJabatan && matchesRegu && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'fingerprint_id') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [employees, searchTerm, filterJabatan, filterRegu, filterStatus, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedEmployees.map((e) => e.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newSet = new Set([...selectedIds, ...pageIds]);
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterJabatan('ALL');
    setFilterRegu('ALL');
    setFilterStatus('ALL');
    setCurrentPage(1);
  };

  const isAllPageSelected =
    paginatedEmployees.length > 0 &&
    paginatedEmployees.every((e) => selectedIds.includes(e.id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Pegawai & Pengguna
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredEmployees.length} dari total {employees.length} data pegawai
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-employee"
              onClick={onAddEmployee}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pegawai</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, ID (P001), atau Fingerprint..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                x
              </button>
            )}
          </div>

          {/* Jabatan Filter */}
          <div>
            <select
              value={filterJabatan}
              onChange={(e) => {
                setFilterJabatan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Jabatan</option>
              <option value="STAFF">STAFF</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>

          {/* Regu Filter */}
          <div>
            <select
              value={filterRegu}
              onChange={(e) => {
                setFilterRegu(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Regu</option>
              <option value="-">- (Non-Regu)</option>
              <option value="ALPHA">ALPHA</option>
              <option value="BRAVO">BRAVO</option>
              <option value="CHARLIE">CHARLIE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 px-4 sm:px-6 py-2.5 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-emerald-900">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>{selectedIds.length} pegawai terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchStatusChange(selectedIds, 'Aktif')}
              className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-medium transition cursor-pointer"
            >
              Set Aktif
            </button>
            <button
              onClick={() => onBatchStatusChange(selectedIds, 'Non-Aktif')}
              className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-medium transition cursor-pointer"
            >
              Set Non-Aktif
            </button>
            {onQuickSyncSelected && (
              <button
                onClick={() => {
                  const sel = employees.filter((e) => selectedIds.includes(e.id));
                  onQuickSyncSelected(sel);
                }}
                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition cursor-pointer"
              >
                Sync Terpilih
              </button>
            )}
            <button
              onClick={() => onBatchDelete(selectedIds)}
              className="px-2.5 py-1 rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:text-slate-700 underline text-[11px] ml-1 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <button
                  onClick={handleSelectAllOnPage}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Pilih Semua di Halaman ini"
                >
                  {isAllPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => {
                  if (sortBy === 'id') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('id');
                    setSortOrder('asc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  {sortBy === 'id' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => {
                  if (sortBy === 'fingerprint_id')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('fingerprint_id');
                    setSortOrder('asc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Fingerprint</span>
                  {sortBy === 'fingerprint_id' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100 select-none"
                onClick={() => {
                  if (sortBy === 'nama') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('nama');
                    setSortOrder('asc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Nama Pegawai</span>
                  {sortBy === 'nama' && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="p-3.5">Jabatan</th>
              <th className="p-3.5">Regu</th>
              <th className="p-3.5">Role App</th>
              <th className="p-3.5 text-center">PIN Portal</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-slate-600">
                      Tidak ada data pegawai yang cocok
                    </p>
                    <p className="text-xs text-slate-400">
                      Coba ganti kata kunci pencarian atau reset filter.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                  <tr
                    key={emp.id}
                    id={`row-${emp.id}`}
                    className={`hover:bg-slate-50/80 transition ${
                      isSelected ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleSelectRow(emp.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* ID */}
                    <td className="p-3.5 font-mono font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{emp.id}</span>
                        <button
                          onClick={() => handleCopyId(emp.id)}
                          title="Salin ID"
                          className="text-slate-300 hover:text-slate-600 transition"
                        >
                          {copiedId === emp.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Fingerprint ID */}
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-medium border border-purple-100">
                        <Fingerprint className="w-3.5 h-3.5 text-purple-500" />
                        <span>{emp.fingerprint_id || '-'}</span>
                      </div>
                    </td>

                    {/* Nama */}
                    <td className="p-3.5 font-bold text-slate-900 tracking-tight">
                      {emp.nama}
                    </td>

                    {/* Jabatan */}
                    <td className="p-3.5">
                      {emp.jabatan.toUpperCase() === 'SECURITY' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Shield className="w-3 h-3 text-amber-600" />
                          SECURITY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Briefcase className="w-3 h-3 text-indigo-600" />
                          {emp.jabatan}
                        </span>
                      )}
                    </td>

                    {/* Regu */}
                    <td className="p-3.5">
                      {emp.regu !== '-' ? (
                        <span className="px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          Regu {emp.regu}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Role App */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        {emp.role_app}
                      </span>
                    </td>

                    {/* PIN Portal Status */}
                    <td className="p-3.5 text-center">
                      {emp.pin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Lock className="w-2.5 h-2.5" />
                          <span>PIN Khusus</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Bawaan</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          emp.status.toLowerCase() === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onResetPin && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Reset PIN pegawai ${emp.nama} (${emp.id}) kembali ke nilai bawaan (PIN Sidik Jari: ${emp.fingerprint_id} atau 1234)?`
                                )
                              ) {
                                onResetPin(emp.id);
                              }
                            }}
                            title="Reset PIN Pegawai ke Bawaan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditEmployee(emp)}
                          title="Edit Pegawai"
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Hapus Pegawai"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer controls */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredEmployees.length} baris)
          </span>
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>Semua</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
