/**
 * Bottom dock: fade in/out toggle, format selector, tombol Save.
 * Menghubungkan useAudioStore (EffectParams) ke useExportStore (job export)
 * lewat lib/ipc.ts — lihat TECH_IMPLEMENTATION_PLAN.md § 3 untuk kontrak
 * command/event lengkapnya.
 */

import type { OutputFormat } from '../../types/audio.types';
import { pickSaveLocation } from '../../lib/ipc';
import { useAudioStore } from '../../store/useAudioStore';
import { useExportStore } from '../../store/useExportStore';

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A' },
  { value: 'm4r', label: 'M4R (Ringtone iPhone)' },
  { value: 'flac', label: 'FLAC' },
  { value: 'wav', label: 'WAV' },
];

export function ExportDock() {
  const loadedFile = useAudioStore((s) => s.loadedFile);
  const effectParams = useAudioStore((s) => s.effectParams);
  const setFade = useAudioStore((s) => s.setFade);
  const setOutputFormat = useAudioStore((s) => s.setOutputFormat);

  const exportState = useExportStore();

  if (!loadedFile || !effectParams) return null;

  const handleSave = async () => {
    const suggestedName = loadedFile.fileName.replace(/\.[^.]+$/, `.${effectParams.outputFormat}`);
    const outputPath = await pickSaveLocation(suggestedName);
    if (!outputPath) return; // user membatalkan dialog

    await exportState.startExport({
      params: effectParams,
      totalDurationMs: loadedFile.probe.durationMs,
      outputPath,
    });
  };

  const isBusy = exportState.status === 'running';

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-slate-800 px-4 py-3">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={effectParams.fade.inMs > 0}
            onChange={(e) => setFade({ inMs: e.target.checked ? 500 : 0 })}
          />
          Fade In
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={effectParams.fade.outMs > 0}
            onChange={(e) => setFade({ outMs: e.target.checked ? 500 : 0 })}
          />
          Fade Out
        </label>

        <select
          value={effectParams.outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="ml-auto rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-green-400 disabled:opacity-50"
        >
          {isBusy ? `Menyimpan... ${exportState.percent}%` : 'Save'}
        </button>

        {isBusy && (
          <button
            type="button"
            onClick={() => void exportState.cancel()}
            className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-600"
          >
            Batal
          </button>
        )}
      </div>

      {exportState.status === 'error' && (
        <p className="text-sm text-red-400">{exportState.errorMessage}</p>
      )}
      {exportState.status === 'done' && (
        <p className="text-sm text-green-400">Tersimpan di {exportState.outputPath}</p>
      )}
    </div>
  );
}
