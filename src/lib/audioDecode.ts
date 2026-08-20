/**
 * Decode file audio untuk keperluan VISUALISASI WAVEFORM & PREVIEW saja.
 * TIDAK dipakai untuk proses export final — itu tugas Rust/FFmpeg native
 * (lihat PLAN_AUDIO_CUTTER.md Section 4, "file audio asli tidak perlu
 * di-load penuh ke JS heap untuk proses export").
 *
 * Karena ini cuma untuk preview, decode via Web Audio API sudah cukup;
 * tidak perlu strategi chunked-decode kompleks untuk v1 (lihat catatan
 * risiko "memory pressure" di PLAN_AUDIO_CUTTER.md § 6 — kalau nanti jadi
 * masalah nyata di file besar, di sinilah tempat menambahkan streaming
 * decode).
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export interface DecodedAudio {
  audioBuffer: AudioBuffer;
  durationMs: number;
}

/**
 * Decode dari path file lokal (via Tauri, bukan File API browser biasa —
 * asumsinya file sudah ada di disk, path didapat dari native file picker
 * `pickOpenAudioFile()` di ipc.ts, bukan drag-drop File object langsung).
 *
 * Catatan: pembacaan file dari path lokal butuh Tauri fs plugin
 * (`@tauri-apps/plugin-fs`, method `readFile`) untuk mendapat bytes-nya
 * sebelum di-decode Web Audio API. Ditulis sebagai TODO eksplisit di sini
 * karena dependency itu belum diinstal di skeleton ini.
 */
export async function decodeAudioFromPath(_filePath: string): Promise<DecodedAudio> {
  throw new Error(
    'TODO(Fase 2, T2.1): baca bytes file via @tauri-apps/plugin-fs readFile(), ' +
      'lalu decode dengan decodeAudioFromBytes() di bawah.'
  );
}

export async function decodeAudioFromBytes(bytes: ArrayBuffer): Promise<DecodedAudio> {
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(bytes);
  return {
    audioBuffer,
    durationMs: Math.round(audioBuffer.duration * 1000),
  };
}

export function disposeSharedAudioContext(): void {
  if (sharedAudioContext) {
    void sharedAudioContext.close();
    sharedAudioContext = null;
  }
}
