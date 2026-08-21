## Konteks Project

Kamu bertindak sebagai arsitek teknis untuk melanjutkan pengembangan
**PotongAuido** — aplikasi desktop offline cross-platform (Windows/macOS/
Linux) untuk trim, efek (fade/gain/speed), dan konversi format audio.

Arsitektur: **hybrid Tauri v2** — React/TypeScript untuk UI, Rust untuk
audio processing berat (memanggil FFmpeg native via sidecar, bukan
FFmpeg.wasm). Alasan pemilihan arsitektur ini ada di `PLAN_AUDIO_CUTTER.md`
Section 0 — baca dulu sebelum mengusulkan perubahan arsitektur apapun.

**Baca 4 dokumen ini secara berurutan sebelum mulai:**
1. `PLAN_AUDIO_CUTTER.md` — arsitektur, tech stack, roadmap fase, risiko terbuka
2. `TECH_IMPLEMENTATION_PLAN.md` — struktur project, kontrak data/IPC lengkap, task breakdown per fase (T0.1, T1.1, dst), strategi testing
3. `README-ONE.md` — status verifikasi kode saat ini (mana yang ✅ teruji vs ⚠️ belum)
4. `POC_FINDINGS.d` 

## Status Kode Saat Ini — WAJIB Dipahami Sebelum Mengedit

Skeleton sudah ada dan **sebagian sudah teruji sungguhan** (bukan cuma
ditulis):

- ✅ **Teruji penuh** (`cargo test`, 38 test lulus): `src-tauri/src/error.rs`,
  `ffmpeg/filter_builder.rs`, `ffmpeg/progress_parser.rs`, `ffmpeg/sidecar.rs`,
  bagian parsing di `commands/probe.rs`, struct `EffectParams` di `commands/export.rs`.
- ✅ **Teruji penuh** (`tsc --strict` + `vite build`): seluruh `src/` frontend
  (components, store Zustand, lib, types).
- ⚠️ **BELUM tervalidasi** dengan Tauri CLI sungguhan: `src-tauri/src/main.rs`,
  `lib.rs`, bagian `#[tauri::command]` di `commands/export.rs` dan
  `commands/probe.rs`, `tauri.conf.json`, `capabilities/default.json`.
  Ini ditulis mengikuti dokumentasi resmi Tauri v2, TAPI dibuat di lingkungan
  yang tidak punya toolchain untuk compile Tauri penuh — jadi **kemungkinan
  ada error compile yang belum ketahuan**.

## Known Issues — Sudah Diketahui, Jangan Ditemukan Ulang

1. **`JobRegistry` (di `ffmpeg/sidecar.rs`) tidak kompatibel dengan sidecar
   Tauri.** Registry ini dibangun untuk `tokio::process::Child`, sementara
   `tauri_plugin_shell::sidecar().spawn()` mengembalikan `CommandChild` yang
   API-nya berbeda (`kill()` sync, bukan async). Baris
   `registry.register_shell_child(...)` di `commands/export.rs` **memanggil
   method yang belum ada** — ini TODO eksplisit yang sudah ditandai di kode,
   bukan bug tersembunyi.
2. **Equalizer belum di-scope.** Disebut di rancangan UI awal, tombolnya
   sudah ada di `Toolbar.tsx` (disabled), tapi belum masuk `EffectParams`
   maupun `filter_builder.rs` Rust sama sekali.
3. **`decodeAudioFromPath` di `lib/audioDecode.ts` sengaja `throw`** — butuh
   `@tauri-apps/plugin-fs` yang belum diinstal.
4. **`playWithTimeStretch` di `lib/soundtouch.ts` sengaja `throw`** — belum
   ada library time-stretch yang dipilih, menunggu hasil PoC Fase 0 §2.3.
5. **Folder `src-tauri/binaries/` masih kosong** — belum ada binary FFmpeg/
   FFprobe sungguhan di-drop ke sana.

## Tugasmu (Architect Mode — buat rencana dulu, jangan langsung eksekusi kode)

Susun **rencana implementasi bertahap** untuk membawa project ini dari
kondisi skeleton ke titik "Fase 0 selesai" (exit criteria ada di
`PLAN_AUDIO_CUTTER.md` §2 dan `TECH_IMPLEMENTATION_PLAN.md` §7), dengan
urutan sebagai berikut:

1. **Validasi compile dasar dulu.** Init project Tauri v2 sungguhan
   (`npm create tauri-app` atau setara), tempelkan skeleton `src/` dan
   `src-tauri/` yang sudah ada ke struktur project yang di-generate, lalu
   jalankan `cargo build --features tauri-runtime` dan `npm run build`.
   Laporkan SEMUA error compile yang muncul sebelum melangkah ke poin
   berikutnya — jangan sambil jalan diam-diam menambal banyak hal sekaligus.

2. **Perbaiki known issue #1** (`JobRegistry` vs `CommandChild`). Usulkan
   desain (mis. enum `ChildHandle { Tokio(...), Shell(...) }` atau trait
   object dengan method `kill()` seragam), lalu implementasikan DENGAN unit
   test baru yang menutupi kedua varian — pola testing yang sudah dipakai
   di `sidecar.rs` (pakai fake script di `test-fixtures/`) harus tetap
   dipertahankan, jangan dihapus demi kemudahan.

3. **Jalankan PoC Fase 0 sesuai checklist di `PLAN_AUDIO_CUTTER.md` §2**
   (T0.1 - T0.5 di `TECH_IMPLEMENTATION_PLAN.md` §5), khususnya:
   - Sidecar FFmpeg + FFprobe bisa di-spawn dan progress ter-stream ke UI
   - Ukuran installer setelah FFmpeg dibundel (bandingkan build full vs minimal codec)
   - Code signing/notarization macOS untuk sidecar binary pihak ketiga

4. **Tulis `POC_FINDINGS.md`** merangkum hasil semua poin di atas, dengan
   keputusan eksplisit per item (bukan "sepertinya bisa" — beri jawaban
   ya/tidak dan alasan).

## Batasan & Konvensi yang WAJIB Diikuti

- **Jangan ubah kontrak `EffectParams`** (di `types/audio.types.ts` dan
  `commands/export.rs`) tanpa mengubah keduanya sekaligus secara sinkron —
  ini kontrak IPC inti, lihat `TECH_IMPLEMENTATION_PLAN.md` §2.
- **Jangan hapus atau downgrade test yang sudah lulus** demi mempercepat
  implementasi. Kalau perubahan desain butuh mengubah test, jelaskan
  alasannya secara eksplisit di PR/commit message.
- **Semua kode Rust baru harus py `cargo test`-able** tanpa perlu binary
  FFmpeg asli terinstal di CI — ikuti pola fake-script di `test-fixtures/`
  yang sudah ada.
- **Bahasa pesan error yang ditampilkan ke user harus Bahasa Indonesia**
  (lihat `error.rs` — ini konvensi yang sudah ditetapkan, bukan preferensi
  acak).
- **Jangan mulai fitur Fase 2/3 (waveform interaktif, effects UI lanjutan)
  sebelum Fase 0 dinyatakan selesai** — Fase 0 adalah gate wajib per
  `PLAN_AUDIO_CUTTER.md`.
- Kalau menemukan keputusan desain yang belum ada jawabannya di dokumen
  manapun (seperti 3 pertanyaan terbuka di `PLAN_AUDIO_CUTTER.md` §7, atau
  scope Equalizer di known issue #2), **jangan berasumsi sendiri** — tandai
  sebagai pertanyaan terbuka di output rencana, supaya bisa diputuskan
  manusia sebelum implementasi lanjut.

## Output yang Diharapkan dari Architect Mode Ini

1. Rencana bertahap (checklist task, mirip format `T0.x` yang sudah ada)
   untuk keempat tugas di atas.
2. Daftar pertanyaan terbuka yang perlu keputusan manusia sebelum lanjut,
   kalau ada.
3. **Belum ada kode ditulis di tahap ini** — architect mode fokus ke
   rencana; implementasi menyusul di mode lain setelah rencana disetujui.
