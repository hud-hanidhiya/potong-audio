//! Entry point biner. Sengaja TIPIS — logika sesungguhnya ada di lib.rs
//! (`run()`), mengikuti pola resmi Tauri v2 (struktur lib+bin) supaya
//! kompatibel dengan target mobile di masa depan kalau dibutuhkan (project
//! ini pernah eksplorasi Capacitor untuk Android di proyek lain — lihat
//! riwayat kerja terkait PPKEK — pola lib+bin ini memudahkan kalau opsi
//! serupa dipertimbangkan lagi untuk Tauri Mobile).
//!
//! Body `main()` di-split dua jalur secara sengaja: supaya `cargo build`
//! TANPA feature `tauri-runtime` tetap bisa compile (jadi binary stub yang
//! kasih pesan jelas), bukannya gagal compile total. Ini menjaga
//! `cargo test` (yang butuh membangun target bin juga secara default)
//! tetap cepat dan tidak menyeret dependency Tauri yang berat.

#[cfg(feature = "tauri-runtime")]
fn main() {
    potong_audio_lib::run();
}

#[cfg(not(feature = "tauri-runtime"))]
fn main() {
    eprintln!(
        "Binary ini butuh feature `tauri-runtime`. Jalankan dengan:\n  \
         cargo run --features tauri-runtime\natau lewat Tauri CLI:\n  \
         cargo tauri dev"
    );
    std::process::exit(1);
}
