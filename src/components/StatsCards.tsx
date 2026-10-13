import React from 'react';
import { Employee } from '../types';
import { Users, Shield, Briefcase, Fingerprint, Activity, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  employees: Employee[];
  lastSynced: string | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ employees, lastSynced }) => {
  const total = employees.length;
  const staffCount = employees.filter((e) => e.jabatan.toUpperCase() === 'STAFF').length;
  const securityCount = employees.filter((e) => e.jabatan.toUpperCase() === 'SECURITY').length;
  const activeCount = employees.filter((e) => e.status.toLowerCase() === 'aktif').length;
  const fpCount = employees.filter(
    (e) => e.fingerprint_id !== '-' && e.fingerprint_id !== '' && e.fingerprint_id !== undefined
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Total Employees */}
      <div id="card-total-employees" className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Total Pegawai</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-400 ml-1.5">terdaftar</span>
        </div>
      </div>

      {/* Staff Count */}
      <div id="card-staff-count" className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Staff Kantor</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{staffCount}</span>
          <span className="text-xs text-slate-400 ml-1.5">orang</span>
        </div>
      </div>

      {/* Security Count */}
      <div id="card-security-count" className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Security</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{securityCount}</span>
          <span className="text-xs text-slate-400 ml-1.5">personel</span>
        </div>
      </div>

      {/* Fingerprint ID */}
      <div id="card-fp-count" className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Fingerprint ID</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Fingerprint className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-slate-900">{fpCount}</span>
          <span className="text-xs text-slate-400 ml-1.5">/ {total}</span>
        </div>
      </div>

      {/* Status Aktif */}
      <div id="card-active-status" className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Status Aktif</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-slate-400 ml-1">aktif</span>
          </div>
          {lastSynced && (
            <span className="text-[10px] text-slate-400 truncate max-w-[90px]" title={`Terakhir sync: ${lastSynced}`}>
              Sync: {lastSynced.split(',')[1]?.trim() || 'Baru'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
