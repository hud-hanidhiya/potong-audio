/**
 * Halaman upload/landing — drag-drop area + tombol file picker native.
 * File picker native pakai Tauri dialog plugin (lihat pickOpenAudioFile
 * di lib/ipc.ts), BUKAN <input type="file"> HTML biasa, supaya user dapat
 * path file asli di disk (dibutuhkan Rust command, bukan Blob/File object
 * browser).
 */

import { useCallback, useState } from 'react';
import { pickOpenAudioFile, probeAudioFile } from '../../lib/ipc';
import { useAudioStore } from '../../store/useAudioStore';

const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'wma'];

export function Dropzone() {
  const loadFile = useAudioStore((s) => s.loadFile);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAndLoad = useCallback(
    async (filePath: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const probe = await probeAudioFile(filePath);
        const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
        loadFile({ path: filePath, fileName, probe });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [loadFile]
  );

  const handleBrowseClick = useCallback(async () => {
    const filePath = await pickOpenAudioFile();
    if (filePath) await openAndLoad(filePath);
  }, [openAndLoad]);

  // Catatan drag-drop: Tauri v2 punya event native `tauri://file-drop` yang
  // memberi path file asli (beda dari drag-drop HTML5 biasa yang cuma kasih
  // Blob). Wiring event listener itu adalah TODO Fase 1 (T1.5) — di sini
  // baru kerangka handler + state visual `isDragActive`-nya saja.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragActive(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    // TODO(T1.5): ganti dengan listener tauri://file-drop, lihat catatan di atas.
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 text-center transition-colors',
        isDragActive ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-700',
      ].join(' ')}
    >
      <p className="text-slate-300">
        Seret file audio ke sini, atau
      </p>
      <button
        type="button"
        onClick={handleBrowseClick}
        disabled={isLoading}
        className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
      >
        {isLoading ? 'Memuat...' : 'Pilih File'}
      </button>
      <p className="text-xs text-slate-500">
        Format didukung: {SUPPORTED_EXTENSIONS.join(', ')}
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
