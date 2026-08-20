/**
 * Preview engine berbasis Web Audio API — dipakai untuk playback real-time
 * region terpilih, DENGAN gain dan fade diterapkan langsung di graph
 * (bukan hasil render/bounce), supaya user dengar preview instan tanpa
 * menunggu proses apapun.
 *
 * PENTING (lihat "Effect Parameter Contract" di plan): parameter yang
 * dipakai di sini (gainDb, fade) harus konsisten secara MATEMATIS dengan
 * filter FFmpeg yang dipakai saat export (lihat filter_builder.rs di
 * backend) — kalau kurva fade di sini beda rumus dengan `afade` FFmpeg,
 * preview bisa terdengar beda tipis dari hasil file akhir. Validasi ini
 * adalah bagian dari Fase 0 § 2.4 (Speed/Pitch) dan sebaiknya diperluas
 * untuk fade/gain juga saat implementasi Fase 2/3.
 */

import type { Fade, Region } from '../types/audio.types';

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export interface PreviewHandle {
  stop: () => void;
}

export interface PreviewOptions {
  audioBuffer: AudioBuffer;
  audioContext: AudioContext;
  region: Region;
  gainDb: number;
  fade: Fade;
  onEnded?: () => void;
}

/**
 * Memutar HANYA rentang `region` dari buffer, dengan gain & fade
 * diterapkan via GainNode automation (`linearRampToValueAtTime`).
 *
 * Catatan: fade curve di sini pakai LINEAR ramp. FFmpeg `afade` defaultnya
 * juga linear ('tri' curve) kecuali disetel lain — pastikan filter_builder.rs
 * tidak diam-diam pakai curve non-default supaya kedua sisi tetap konsisten.
 */
export function playPreview(options: PreviewOptions): PreviewHandle {
  const { audioBuffer, audioContext, region, gainDb, fade, onEnded } = options;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = audioContext.createGain();
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const startSec = region.startMs / 1000;
  const durationSec = (region.endMs - region.startMs) / 1000;
  const now = audioContext.currentTime;
  const targetGain = dbToGain(gainDb);

  // Susun automation gain: mulai dari 0 kalau ada fade-in, naik ke
  // targetGain, tahan, lalu turun ke 0 kalau ada fade-out di akhir durasi.
  const fadeInSec = fade.inMs / 1000;
  const fadeOutSec = fade.outMs / 1000;

  gainNode.gain.cancelScheduledValues(now);

  if (fadeInSec > 0) {
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetGain, now + fadeInSec);
  } else {
    gainNode.gain.setValueAtTime(targetGain, now);
  }

  if (fadeOutSec > 0) {
    const fadeOutStart = now + durationSec - fadeOutSec;
    // Clamp supaya tidak dijadwalkan ke masa lalu kalau fadeOut lebih
    // panjang dari durasi (sama seperti clamp di filter_builder.rs Rust).
    const safeStart = Math.max(fadeOutStart, now);
    gainNode.gain.setValueAtTime(targetGain, safeStart);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
  }

  source.start(now, startSec, durationSec);
  if (onEnded) source.onended = onEnded;

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // source mungkin sudah berhenti sendiri — aman diabaikan.
      }
    },
  };
}
