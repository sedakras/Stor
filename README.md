# Stor

Mac ekranın için stor perde. Menü çubuğunda durur; zinciri çekince ya da kısayola basınca ekranının üstüne bir stor iner.

## Kurulum

1. Mac'ine uygun dosyayı indir:
   - **Stor-mac-apple-silicon.zip**: M1, M2, M3, M4 çipli Mac'ler (2020 sonrası çoğu Mac)
   - **Stor-mac-intel.zip**: Intel işlemcili Mac'ler
   - Hangisi olduğunu bilmiyorsan: sol üstteki  menüsü > Bu Mac Hakkında > "Çip" satırı "Apple M…" yazıyorsa Apple Silicon.
2. Zip'i aç, çıkan **Stor.app** dosyasını **Uygulamalar** klasörüne sürükle.
3. Terminal'i aç (Spotlight'ta "Terminal" yaz) ve şu iki komutu sırayla yapıştır:

```bash
xattr -cr /Applications/Stor.app
```

```bash
codesign --force --deep --sign - /Applications/Stor.app
```

   Birincisi internetten indirilen dosyaya macOS'un koyduğu karantina işaretini kaldırır. İkincisi uygulamayı senin Mac'inde imzalar. Uygulama bir Apple geliştirici hesabıyla imzalanmadığı için bu adım gerekiyor; yapılmazsa macOS "Stor hasarlı" diyebilir.
4. Stor'u Uygulamalar'dan aç. Dock'ta görünmez; menü çubuğunun sağında küçük bir stor simgesi belirir ve ilk açılışta stor yarıya kadar iner.

## Kullanım

- **İndirip kaldırmak:** ⌥⌘S (Option + Command + S), menü çubuğundaki simge > "Storu indir / kaldır", ya da storun sağındaki zinciri tıkla.
- **İstediğin yüksekliğe getirmek:** alt çıtadan tutup sürükle. Tamamen yukarı çekince stor kasete sarılır ve kaybolur.
- **Menü çubuğu simgesinden:** kumaş, renk, gün-gece aralığı, kordon ucu, boşta kalınca inme, akşam saatinde inme, Touch ID ile kaldırma ve oturum açılınca başlatma.
- Bağlı her ekrana ayrı bir stor iner.

## Kumaşlar

Karartma ve kadife ekranı tamamen kapatır. Screen, tül, washi kâğıdı ve gün-gece (zebra) kumaşları arkasını macOS'un kendi bulanıklığıyla gösterir; ekranda ne olduğu okunmaz.

## Kaynaktan çalıştırmak

```bash
npm install
```

```bash
npm start
```

Paketleri yeniden üretmek için `npm run build` (çıktı `dist/` klasörüne).
