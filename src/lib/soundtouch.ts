/**
 * Wrapper tipis untuk SoundTouch.js — dipakai KHUSUS untuk preview speed
 * change TANPA mengubah pitch (time-stretch). Ini terpisah dari
 * previewEngine.ts (yang menangani gain/fade lewat GainNode biasa) karena
 * time-stretch butuh pemrosesan sampel yang jauh lebih kompleks daripada
 * sekadar automation parameter.
 *
 * TODO(Fase 0, § 2.3): package SoundTouch.js belum diinstal di skeleton
 * ini — validasi dulu di PoC apakah versi yang dipakai kompatibel dengan
 * Web Audio API AudioWorklet modern (banyak fork lama SoundTouch.js masih
 * pakai ScriptProcessorNode yang sudah deprecated). Cek juga lisensi
 * (LGPL) — lihat PLAN_AUDIO_CUTTER.md § 6.
 *
 * Interface di bawah ini adalah KONTRAK yang ingin dicapai, bukan
 * implementasi final — isi badan fungsi akan berubah total begitu library
 * pilihan (SoundTouch.js atau alternatifnya) sudah divalidasi di Fase 0.
 */

export interface TimeStretchHandle {
  stop: () => void;
  setRatio: (ratio: number) => void;
}

export interface TimeStretchOptions {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
  ratio: number; // 0.25 - 4.0, dari EffectParams.speed.ratio
  onEnded?: () => void;
}

export function playWithTimeStretch(_options: TimeStretchOptions): TimeStretchHandle {
  throw new Error(
    'TODO(Fase 0 → Fase 2, T2.5): implementasikan setelah spike SoundTouch.js ' +
      'di Fase 0 § 2.3 selesai dan library pilihan final ditentukan.'
  );
}

/**
 * Dipakai oleh WaveformView/Toolbar untuk memutuskan: kalau ratio == 1.0,
 * cukup pakai `playPreview` biasa dari previewEngine.ts (lebih murah,
 * tanpa overhead time-stretch). Time-stretch hanya diaktifkan kalau user
 * benar-benar mengubah speed.
 */
export function needsTimeStretch(ratio: number): boolean {
  return Math.abs(ratio - 1.0) > Number.EPSILON;
}
