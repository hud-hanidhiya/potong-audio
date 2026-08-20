/**
 * Komponen status kecil generik — opsional, disebut di
 * TECH_IMPLEMENTATION_PLAN.md sebagai reuse pola dari proyek lain
 * (INSW SSO design guide). Dipakai untuk menampilkan status export
 * (idle/running/done/error/cancelled) secara konsisten di beberapa tempat.
 */

import type { ExportStatus } from '../types/audio.types';

const STATUS_STYLES: Record<ExportStatus, string> = {
  idle: 'bg-slate-700 text-slate-300',
  running: 'bg-cyan-900 text-cyan-300',
  done: 'bg-green-900 text-green-300',
  error: 'bg-red-900 text-red-300',
  cancelled: 'bg-yellow-900 text-yellow-300',
};

const STATUS_LABELS: Record<ExportStatus, string> = {
  idle: 'Idle',
  running: 'Memproses',
  done: 'Selesai',
  error: 'Gagal',
  cancelled: 'Dibatalkan',
};

export function StatusBadge({ status }: { status: ExportStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
