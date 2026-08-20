# POC_FINDINGS.md — Hasil Proof of Concept Fase 0 (Potong-Audio)

> Dokumen ini menjawab 8 pertanyaan PoC secara eksplisit (ya/tidak) dengan
> bukti yang diambil langsung dari eksekusi di Windows x86_64 (build host
> Fase 0). Tanggal eksekusi: 2026-08-20.

---

## 1. Sidecar FFmpeg bisa di-spawn di Windows x86_64?

**YA.**

- BtbN gpl build (win64) di-download dan ditempatkan di
  `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe`.
- `tauri build` me-rename sidecar ke `target/release/ffmpeg.exe` (konvensi
  Tauri `externalBin`) — diverifikasi file ada dan versinya:
  `ffmpeg version N-126217-ge1e325235e-20260819` (built 2026-08-19).
- `ffmpeg -version` jalan dari prompt dengan exit 0.
- Aplikasi hasil build (`potong-audio.exe`) sukses diluncurkan dan bertahan
  running (smoke test), membuktikan runtime Tauri + WebView2 tidak crash.
- Command baru `get_ffmpeg_version` (spawn `sidecar("ffmpeg") -version`,
  return string) sudah di-wire di `lib.rs` dan frontend menampilkan versinya
  di header (`src/App.tsx`).

## 2. Sidecar FFmpeg bisa di-spawn di Linux x86_64?

**BELUM TERVERIFIKASI DI LINGKUNGAN INI** (build host Windows).

- Konfigurasi siap: `binaries/ffmpeg-x86_64-unknown-linux-gnu` (tanpa `.exe`)
  dan `capabilities/default.json` memakai `shell:allow-execute` yang sama.
- **Tindakan lanjut wajib**: download BtbN `linux64-gpl` build lalu jalankan
  `cargo tauri build` di host Linux x86_64 sebelum menyatakan lulus.
- Tidak ada kode OS-specific di sisi spawn (pola `app.shell().sidecar(...)`
  identik di kedua OS), jadi risiko residual rendah.

## 3. Sidecar FFprobe bisa di-spawn di kedua OS?

**YA (Windows).** `ffprobe-x86_64-pc-windows-msvc.exe` di-rename Tauri menjadi
`target/release/ffprobe.exe`; `ffprobe -version` jalan dengan exit 0.
Parsing JSON (`parse_ffprobe_json` di `probe.rs`) teruji 7 unit test.

**Linux**: sama seperti FFmpeg — konfigurasi siap, butuh verifikasi di host
Linux.

## 4. Progress streaming live ke UI?

**YA.**

- Trim sungguhan file 5 menit memakai filter chain `filter_builder` +
  `-progress pipe:2` menghasilkan 4 titik `out_time_us` sebelum `progress=end`
  (98.06s → 181.79s → 262.01s → 280.00s), membuktikan FFmpeg streaming
  progress ke stderr selama proses (bukan hanya di akhir).
- `ProgressTracker` memetakan `out_time_us` → persen dan meng-throttle emit
  (9 unit test termasuk simulasi stream end-to-end `[10,50,100,Done]`).
- `sidecar::run_export` + `export_audio` meng-emit `export://progress` /
  `export://done` / `export://error` (verified via test fake ffmpeg
  cross-platform).

## 5. Trim end-to-end menghasilkan file valid?

**YA.**

- Sample 10s WAV (lavfi sine 440Hz) di-trim region 2000–5000ms memakai
  argumen persis yang dihasilkan `build_filter_plan` + `build_args`:
  `atrim=start=2000ms:end=5000ms,asetpts=PTS-STARTPTS` → output MP3 3.000000s,
  durasi sesuai region (ffprobe verifikasi).
- Unit test `run_export_sukses_...` memverifikasi alur penuh (spawn →
  progress → file output → unregister job) dengan fake ffmpeg.
- Flow cancel: `cancel_menghentikan_proses_yang_sedang_berjalan` lulus di
  Windows dengan fixture `.bat`.

## 6. Keputusan FFmpeg build (full vs minimal) dengan ukuran

| Item | Ukuran |
|---|---|
| `ffmpeg.exe` (BtbN gpl full, master 20260819) | 139.05 MB |
| `ffprobe.exe` (BtbN gpl full) | 138.85 MB |
| Aplikasi `potong-audio.exe` (release, stripped) | 4.44 MB |
| Installer NSIS `Potong-Audio_0.1.0_x64-setup.exe` | 80.13 MB |

**Keputusan sementara: BtbN gpl full** untuk Fase 0/1 karena:
- Satu build mencakup semua format yang dibutuhkan v1
  (mp3, wav, m4a/aac, flac, m4r) + codec lama (ogg, wma) tanpa pekerjaan
  per-konfigurasi.
- Installer 80 MB (terkompresi NSIS) masih dalam ambang wajar untuk
  aplikasi offline.
- **Catatan untuk T0.4 lanjutan**: bandingkan dengan build BtbN `gpl-shared`
  atau minimal (hanya libmp3lame/aac/flac) kalau ukuran installer jadi
  masalah di distribusi; proyeksi penghematan signifikan (~50%+) tapi
  butuh konfigurasi FFmpeg custom. Keputusan final ditulis di sini setelah
  perbandingan dilakukan di host Linux.

## 7. Status code signing

- **Windows**: ditunda ke Fase 5 (T5.1) — installer NSIS tidak ditandatangani
  di Fase 0. SmartScreen akan memperingatkan saat distribusi publik.
- **macOS**: di luar scope Fase 0 (target Windows + Linux x86_64 saja).

## 8. Rekomendasi lanjut ke Fase 1

**YA.**

Semua PoC kritis Fase 0 lulus di Windows x86_64: sidecar spawn, ffprobe,
progress streaming, trim end-to-end valid, build installer NSIS sukses,
39 unit test hijau, frontend build sukses. Satu-satunya temuan yang belum
terverifikasi adalah runtime Linux (butuh host Linux), dan itu bukan blokir
untuk memulai Fase 1 (feat per-feature tetap bisa dikerjakan + diuji di
Windows; verifikasi Linux dilakukan bersamaan dengan CI/build AppImage).

---

## Catatan tambahan hasil implementasi Fase 0

- Struktur modul diperbaiki: `commands/mod.rs` = `export`, `probe`, `version`;
  `ffmpeg/mod.rs` = `filter_builder`, `progress_parser`, `sidecar`.
- `tauri.conf.json`: trailing comma dihapus; `build.features = ["tauri-runtime"]`
  ditambahkan supaya `cargo tauri build` mengaktifkan feature tanpa flag manual.
- Config frontend dipindah `src/` → root; `vite.config.ts` perlu
  `root: 'src'` + `build.outDir: '../dist'` (kompensasi root non-default),
  dan `src/index.html` script src diubah `/src/main.tsx` → `/main.tsx`.
- Bug pre-existing diperbaiki: import `StatusBadge.tsx`
  (`../../types` → `../types`).
- `fake_ffmpeg.sh` dipindah ke `test-fixtures/`; `fake_ffmpeg.bat` dibuat
  setara (cek `--fail`, output path = argumen terakhir, 3× progress,
  `progress=end`, buat file output).
- `Killable` untuk `CommandChild` memakai `Mutex<Option<CommandChild>>`
  karena API tauri-plugin-shell `CommandChild::kill(self)` by-value.
- Test cancel cross-platform (`.bat`/`.sh`).
- Non-blocking, dilaporkan saja (di luar scope Fase 0): `landing/index.html`
  masih menyebut "License: MIT" dan branding "PotongAudio" (tanpa hyphen).
