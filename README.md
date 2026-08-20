# PotongAudio

**Potong audio dengan presisi.**

Aplikasi desktop offline cross-platform (Windows/Linux) untuk trim, efek audio (fade, gain, speed), dan konversi format audio.

## ✨ Fitur

- **Trim Audio** — Potong audio dengan presisi menggunakan visualisasi waveform
- **Efek Audio** — Fade in/out, gain adjustment, speed/pitch control
- **Konversi Format** — MP3, WAV, M4A, AAC, FLAC, OGG, dan lainnya
- **100% Offline** — Semua processing dilakukan lokal, tidak ada upload ke server
- **Cross-Platform** — Tersedia untuk Windows dan Linux
- **Performa Tinggi** — Menggunakan FFmpeg native via Rust backend
- **UI Modern** — Interface berbasis React dengan visualisasi waveform interaktif

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — Build tool modern
- **Zustand** — State management
- **WaveSurfer.js** — Visualisasi waveform audio
- **Tailwind CSS** — Styling

### Backend
- **Rust** — Core audio processing
- **Tauri v2** — Desktop framework
- **FFmpeg** — Audio encoding/decoding (sidecar binary)
- **FFprobe** — Audio metadata probing

## 📦 Instalasi

### Prerequisites

- Node.js 18+ dan npm
- Rust 1.75+ (dengan toolchain stable)
- Tauri CLI (`cargo install tauri-cli`)
- FFmpeg binary (akan di-download otomatis saat build)

### Development

```bash
# Clone repository
git clone https://github.com/yourusername/potongaudio.git
cd potongaudio

# Install dependencies frontend
npm install

# Install dependencies Rust
cd src-tauri
cargo check

# Jalankan development mode
npm run tauri dev
```

### Build Production

```bash
# Build untuk platform saat ini
npm run tauri build

# Output akan ada di:
# - Windows: src-tauri/target/release/bundle/msi/potongaudio_*.msi
# - macOS: src-tauri/target/release/bundle/dmg/potongaudio_*.dmg
# - Linux: src-tauri/target/release/bundle/deb/potongaudio_*.deb
```

## 📖 Dokumentasi

- [Arsitektur Aplikasi](./docs/ARCHITECTURE.md)
- [Rencana Implementasi](./docs/IMPLEMENTATION.md)
- [Kontrak IPC](./docs/IPC_CONTRACT.md)
- [Testing Guide](./docs/TESTING.md)

## 🎯 Roadmap

### v1.0 (MVP)
- [x] Trim audio dengan waveform
- [ ] Fade in/out effects
- [ ] Gain adjustment
- [ ] Speed/pitch control
- [ ] Export ke berbagai format (MP3, WAV, M4A)

### v1.1
- [ ] Multi-region trim
- [ ] Undo/redo
- [ ] Batch processing
- [ ] Keyboard shortcuts

### v2.0
- [ ] Normalization
- [ ] Audio compression
- [ ] Noise reduction
- [ ] Visualizer real-time

## 🧪 Testing

### Frontend

```bash
# Type checking
npm run typecheck

# Build production
npm run build

# Linting
npm run lint
```

### Backend (Rust)

```bash
# Unit tests
cd src-tauri
cargo test

# Coverage
cargo tarpaulin --out Html
```

## 📁 Struktur Project

```
potongaudio/
├── src/                    # Frontend React/TypeScript
│   ├── components/         # UI components
│   ├── lib/               # Utility functions
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/             # Backend Rust
│   ├── ffmpeg/            # FFmpeg wrapper & filter builder
│   ├── commands/          # Tauri commands
│   ├── error.rs           # Error handling
│   ├── main.rs            # Entry point
│   └── Cargo.toml
├── docs/                  # Dokumentasi
├── package.json
├── tauri.conf.json
└── README.md
```

## 🤝 Kontribusi

Kontribusi sangat welcome! Silakan:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 Lisensi

Distributed under the MIT License. Lihat `LICENSE` untuk detail lebih lanjut.

## 📞 Kontak

- **Website:** https://potongaudio.id (coming soon)
- **GitHub:** https://github.com/yourusername/potongaudio
- **Twitter:** [@potongaudio](https://twitter.com/potongaudio)

---

**PotongAudio** — Dibuat dengan ❤️ dari Indonesia.
