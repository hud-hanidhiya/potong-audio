
## Konteks Project

Kamu melanjutkan implementasi **Audio Cutter** — aplikasi desktop offline
(Tauri v2 + React/TS frontend, Rust backend memanggil FFmpeg native via
sidecar). Baca `PLAN_AUDIO_CUTTER.md`, `TECH_IMPLEMENTATION_PLAN.md`, dan
`README-ONE.md`, `POC_FINDINGS.md` di root repo sebelum menyentuh kode apapun — jangan mulai
bekerja sebelum paham konvensi dan status verifikasi yang sudah ada.

## Mode Kerja: Eksekusi Langsung, TAPI Dengan Batas Ketat

Berbeda dari Architect Mode, kamu di sini **boleh langsung menulis dan
menjalankan kode**. Tapi scope-mu dibatasi ke task yang punya spesifikasi
jelas — lihat bagian "Scope yang Diizinkan" di bawah. Kalau kamu menemukan
task yang butuh keputusan desain terbuka (lihat "Di Luar Scope"), **STOP,
jangan berasumsi dan lanjut coding** — laporkan sebagai pertanyaan
terbuka dan kerjakan task lain dulu.

## Aturan Verifikasi (Non-Negotiable)

Untuk SETIAP perubahan kode yang kamu buat:
1. **Rust**: jalankan `cargo test` setelah setiap perubahan modul. Kalau
   kamu menambah fungsi baru yang punya logika non-trivial (bukan cuma
   wiring/boilerplate), tulis unit test untuk itu — ikuti pola yang sudah
   ada di `filter_builder.rs`/`progress_parser.rs`/`sidecar.rs` (termasuk
   pola fake-script di `test-fixtures/` untuk hal yang butuh spawn proses).
2. **Frontend**: jalankan `npm run build` (mencakup `tsc --noEmit --strict`)
   setelah setiap perubahan. Jangan commit/lapor selesai kalau ada error
   TypeScript, bahkan yang "cuma warning".
3. **Jangan pernah melaporkan sesuatu "sudah selesai" tanpa menjalankan
   perintah verifikasi di atas dan menunjukkan outputnya.** Ini proyek yang
   sebelumnya dikerjakan dengan disiplin "tulis lalu buktikan jalan", bukan
   "tulis lalu asumsikan benar" — pertahankan standar itu.

## Scope yang Diizinkan (Task Mekanis, Spesifikasi Sudah Jelas)

### 1. Scaffold project Tauri v2 sungguhan
- Generate project baru (`npm create tauri-app@latest` atau setara) dengan
  template React + TypeScript.
- Pindahkan/gabungkan isi `src/` dan `src-tauri/` yang sudah ada di repo
  ke struktur hasil generate — **jangan timpa file yang sudah ada tanpa
  diff terlebih dahulu**, karena file skeleton yang ada sudah teruji.
- Jalankan `cargo build --features tauri-runtime` dan `npm run build`.
  **Laporkan semua error compile apa adanya**, lalu perbaiki satu per satu.
  Prioritaskan error yang murni sintaksis/API (nama fungsi Tauri v2 yang
  berubah dari dokumentasi, dsb) — kalau errornya menunjukkan gap desain
  (lihat known issue di bawah), tangani sesuai instruksi khusus untuk itu.

### 2. Perbaiki `JobRegistry` vs `CommandChild` (known issue, sudah di-TODO di kode)
Spesifikasi: `ffmpeg/sidecar.rs::JobRegistry` saat ini hanya menyimpan
`tokio::process::Child`. Sidecar via `tauri_plugin_shell` mengembalikan
`CommandChild` (API `kill()` sync). Buat `JobRegistry` mendukung KEDUANYA:

```rust
enum ChildHandle {
    Tokio(tokio::process::Child),
    Shell(tauri_plugin_shell::process::CommandChild),
}
```
- `cancel()` harus bisa membunuh proses dari kedua varian.
- **Semua 5 test yang sudah ada di `sidecar.rs` untuk `JobRegistry` harus
  tetap lulus tanpa diubah logikanya** (boleh disesuaikan kalau signature
  berubah, tapi assertion intinya harus tetap sama). Tambah minimal 1 test
  baru untuk varian `Shell` — boleh pakai mock/stub kalau `CommandChild`
  susah diinstansiasi langsung di test tanpa runtime Tauri penuh; kalau
  ini benar-benar tidak memungkinkan secara teknis, laporkan sebagai
  keterbatasan eksplisit, jangan diam-diam skip.
- Update pemanggilan `registry.register_shell_child(...)` di
  `commands/export.rs` supaya konsisten dengan desain baru ini.

### 3. Isi `decodeAudioFromPath` di `lib/audioDecode.ts`
- Install `@tauri-apps/plugin-fs`.
- Baca bytes file dari path lokal (`readFile`), lalu panggil
  `decodeAudioFromBytes` yang sudah ada — jangan tulis ulang logic decode,
  itu sudah benar.
- Tangani error file-not-found dengan pesan yang jelas (ikuti pola error
  handling yang sudah ada, bukan `throw` generic).

### 4. Sediakan mekanisme unduh/setup binary FFmpeg & FFprobe
- `src-tauri/binaries/` masih kosong. Buat SCRIPT setup (`scripts/setup-ffmpeg.sh`
  atau `.ps1` untuk Windows) yang mengunduh build statis FFmpeg+FFprobe
  resmi per target-triple (lihat `TECH_IMPLEMENTATION_PLAN.md` §4.1 untuk
  konvensi nama file) dan menaruhnya di lokasi yang benar.
- **Jangan pilih source FFmpeg build sembarangan** — cek lisensi (LGPL vs
  GPL, lihat risiko yang sudah dicatat di `PLAN_AUDIO_CUTTER.md` §6)
  sebelum menentukan mirror/source mana yang dipakai di script.

## Di Luar Scope — JANGAN Dikerjakan di Code Mode Ini

Task berikut butuh keputusan desain yang belum ada jawabannya di dokumen
manapun. Kalau kamu sampai ke titik yang butuh salah satu dari ini,
**berhenti dan laporkan sebagai pertanyaan terbuka**, jangan berasumsi:

- Multi-region trim vs single trim range (v1 scope) — `PLAN_AUDIO_CUTTER.md` §7
- Batas ukuran/durasi file maksimum v1 — `PLAN_AUDIO_CUTTER.md` §7
- Undo/redo masuk v1 atau v2 — `PLAN_AUDIO_CUTTER.md` §7
- Scope & desain parameter Equalizer (belum ada di `EffectParams` sama sekali)
- Pemilihan library time-stretch untuk `soundtouch.ts` (menunggu hasil PoC Fase 0 §2.3)
- Implementasi WaveSurfer.js di `WaveformView.tsx` — ini task Fase 2 (T2.1),
  bukan bagian dari follow-up skeleton ini
- Perubahan apapun ke kontrak `EffectParams` yang tidak disinkronkan ke
  KEDUA sisi (TypeScript dan Rust) sekaligus

## Format Laporan Akhir

Setelah semua task di "Scope yang Diizinkan" selesai (atau mentok di
suatu titik), laporkan dalam format:

```
## Task 1: Scaffold Tauri v2 — [SELESAI / MENTOK di ...]
- Output cargo build: [tempel ringkas]
- Output npm run build: [tempel ringkas]
- Perubahan file: [daftar]

## Task 2: JobRegistry — [status sama]
...

## Pertanyaan Terbuka yang Ditemukan
- ...
```
