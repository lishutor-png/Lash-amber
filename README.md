# THE LAST EMBER — v0.3

> *"Survive. Die. Remember. Rise Again."*

**THE LAST EMBER** adalah game RPG bertahan hidup roguelite fantasi gelap 2D top-down (*offline-first*, orientasi lanskap) dengan gaya visual **HD 2D Dark Fantasy Illustrated Art**, pertarungan giliran (*turn-based combat*), penjinakan satwa pendamping, memancing, meracik perlengkapan 7 slot, perdagangan dengan NPC, serta 9 bioma dunia yang saling terhubung.

---

## Fitur Utama v0.3

- **HD 2D Dark Fantasy Illustrated Art**: Pohon berlapis organik, formasi batu & mineral berkilau, tepian sungai & lahar beranimasi, bayangan halus, serta partikel cuaca bioma (*Salju*, *Abu Vulkanik*, *Hujan*, *Gelombang Panas*, *Kabut*).
- **Kamera Lebih Dekat**: 4 tingkat zoom (`Sangat Dekat`, `Dekat`, `Normal`, `Jauh`) dengan default **Sangat Dekat** agar karakter, satwa, dan rintangan terlihat jelas.
- **Peta Dunia Layar Penuh**: Mendukung *pinch-to-zoom* (cubit di layar sentuh), *scroll wheel*, tombol `+`/`-`, geser peta, serta panel detail Wilayah, Sub-Area, Bahaya Lingkungan, dan ikon penanda (*Pedagang*, *Pandai Besi*, *Alkemis*, *Dungeon*, *Gua*, *Sarang Bos*, *Titik Pancing*).
- **9 Bioma Terhubung**: *Hutan Terlupakan*, *Padang Rumput Hijau*, *Sabana Hijau*, *Gurun Membara*, *Dataran Tinggi Beku*, *Pegunungan Kuno*, *Rimba Dalam*, *Kerajaan Runtuh*, dan *Gunung Berapi Kelabu*.
- **Bahaya Lingkungan & Perlengkapan Survival**: Hawa Dingin/Beku, Panas/Gurun Ekstrem, Bara Vulkanik, serta Kabut Beracun — dapat ditangkal dengan Jubah Bulu, Pakaian Linen Gurun, Zirah Obsidian, Topeng Filter, Obor, dan Ramuan ketahanan.
- **Eskalasi Malam (+5%/Malam)**: Satwa & monster liar di alam terbuka meningkat kekuatannya secara deterministik setiap malam terlewati (tidak berlaku di zona aman/pedagang).
- **Perdagangan & Koin Emas**: Pos Dagang, Desa Pedagang, Pandai Besi, Alkemis, dan Pedagang Langka dengan stok persisten & pembaruan berkala.
- **Tabrakan Organik Akurat**: Tanaman kecil tidak menghalangi langkah; batang pohon dan batu langsung dapat dilewati begitu ditebang/ditambang habis.

---

## Pengembangan Web Lokal

```bash
npm install
npm run dev        # Jalankan server lokal di port 3000
npm run lint       # Cek TypeScript (tsc --noEmit)
npm run build      # Hasilkan bundle produksi di dist/
```

---

## Build Android APK (Offline Landscape Shell)

Proyek Android di folder `android/` membungkus hasil build web `dist/` secara lokal menggunakan `WebViewAssetLoader` (100% offline, orientasi `sensorLandscape`).

### 1. Build Manual via Android Studio / CLI
```bash
npm ci
npm run build
rm -rf android/app/src/main/assets/www
mkdir -p android/app/src/main/assets/www
cp -r dist/* android/app/src/main/assets/www/
cd android
gradle testDebugUnitTest assembleDebug
```
Hasil APK berada di: `android/app/build/outputs/apk/debug/app-debug.apk`.

### 2. Build Otomatis via GitHub Actions
Setiap `push` ke branch `main`/`master` atau `pull_request` akan menjalankan `.github/workflows/android-build.yml`:
1. Membuka tab **Actions** pada repositori GitHub.
2. Pilih workflow **Build Android APK** yang selesai berjalan.
3. Unduh artifact **`the-last-ember-debug-apk`**.

#### (Opsional) Signed Release APK di GitHub Actions
Tambahkan Repository Variable `ENABLE_RELEASE_SIGNING=true` dan Secrets berikut:
- `KEYSTORE_BASE64` (hasil `base64 -w 0 release.keystore`)
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

---

## Panduan Push ke GitHub

```bash
git init
git add .
git commit -m "THE LAST EMBER v0.3 - World Expansion & Android Build Pipeline"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<NAMA-REPO>.git
git push -u origin main
```
