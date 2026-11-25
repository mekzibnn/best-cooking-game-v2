# Dapur Senja — Warung Cepat Saji

[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/mekzibnn/best-cooking-game-v2/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/mekzibnn/best-cooking-game-v2/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

Game masak orisinal yang dimainkan offline di browser desktop, keyboard + mouse.
Kamu juru masak di warung senja: ambil bahan, cincang, masak, rakit di piring,
dan sajikan pesanan sebelum pelanggan kehabisan sabar.

Dibangun di atas **Phaser 4.2.1** (di-vendor sebagai `game/vendor/phaser.min.js`),
dengan semua gambar digambar prosedural di dalam game dan semua suara
disintesis lewat WebAudio — tanpa satu pun file aset eksternal.

## Cara main

1. **Gerak** — WASD / tombol panah, atau klik lantai / stasiun untuk jalan ke sana.
2. **Ambil bahan** — dekati peti bahan (Nasi, Mie, Ayam, Telur, Sayur, Sambal), tekan **E**.
3. **Olah** — Ayam & Sayur dicincang di **Talenan** (tekan E 3x). Nasi, Mie, Telur,
   dan Ayam cincang dimasak di **Kompor** (matang otomatis ~2 detik).
4. **Rakit** — ambil **Piring**, letakkan di **Piring Saji**, tambahkan bahan siap saji
   sampai jadi hidangan lengkap.
5. **Sajikan** — bawa hidangan ke **Jendela Sajian**. Hidangan yang cocok dengan
   pesanan dibayar penuh + tip dari sisa kesabaran pelanggan.

## Resep

| Hidangan | Bahan | Harga |
| --- | --- | --- |
| Nasi Goreng | Nasi + Telur + Ayam | Rp100 |
| Mie Ayam | Mie + Ayam + Sayur | Rp90 |
| Soto Senja | Nasi + Ayam + Sayur + Sambal | Rp110 |
| Telur Dadar | Telur + Sayur | Rp70 |

## Aturan main

- Satu hari masak = **120 detik**. Pesanan baru datang makin cepat dan kesabaran
  pelanggan makin pendek seiring level naik.
- Sajikan beruntun tanpa gagal untuk menaikkan **kombo**. Pesanan yang kedaluwarsa
  mereset kombo. Di 60 detik terakhir, mode **RUSH** aktif.
- **P** jeda, **H** buku resep, **M** suara, **R** main lagi di layar akhir.

## Menjalankan

```sh
node serve.ts
# buka http://localhost:8080
```

## Struktur kode

- `game/src/config.js` — resep, bahan, stasiun, dan semua angka tuning.
- `game/src/rules.js` — aturan murni (tanpa Phaser): pesanan, cincang, masak, rakit, skor.
- `game/src/audio.js` — synth WebAudio: efek suara + loop musik kecil.
- `game/src/textures.js` — semua gambar digambar prosedural di BootScene.
- `game/src/scenes/` — satu scene per layar: Boot, Title, Play, Hud, GameOver.
- `game/src/main.js` — konfigurasi Phaser.Game.
- `main.ts` — program penyerahan: menyalin game/ + screenshots/ dan menulis dossier.json.
