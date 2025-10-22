# 🚀 Hızlı Başlangıç Rehberi

## ⚠️ ÖNEMLİ: Node.js Gerekli!

Bu projeyi çalıştırmak için **Node.js** kurulu olmalıdır.

## 📥 Node.js Kurulumu (Windows)

### Adım 1: Node.js İndirme

1. Tarayıcınızda şu adresi açın: **https://nodejs.org/**
2. **"LTS (Long Term Support)"** versiyonunu indirin (önerilen)
   - Genellikle yeşil renkle vurgulanmıştır
   - Ekim 2025 itibariyle: Node.js 20.x veya 22.x LTS
3. İndirilen `.msi` dosyasını çalıştırın

### Adım 2: Kurulum

1. Kurulum sihirbazını açın
2. **"Next"** tıklayın
3. Lisans sözleşmesini kabul edin
4. Kurulum konumunu seçin (varsayılan: `C:\Program Files\nodejs\`)
5. **ÖNEMLİ**: Tüm bileşenlerin seçili olduğundan emin olun:
   - ✅ Node.js runtime
   - ✅ npm package manager
   - ✅ Online documentation shortcuts
   - ✅ Add to PATH
6. **"Install"** tıklayın
7. Kurulum tamamlandığında **"Finish"** tıklayın

### Adım 3: Kurulumu Doğrulama

Kurulum tamamlandıktan sonra:

1. **PowerShell'i KAPATIN ve YENİDEN AÇIN** (önemli!)
2. Şu komutları çalıştırın:

```powershell
node --version
```

Çıktı: `v20.x.x` veya `v22.x.x` gibi bir versiyon görmeli

```powershell
npm --version
```

Çıktı: `10.x.x` gibi bir versiyon görmeli

✅ Her iki komut da versiyon numarası gösteriyorsa kurulum başarılı!

## 🎯 Projeyi Çalıştırma

Node.js kurulumu tamamlandıktan sonra:

### 1. Proje Dizinine Git

```powershell
cd C:\Users\User\Desktop\thermal-printer
```

### 2. Bağımlılıkları Yükle

```powershell
npm install
```

⏳ **İlk yükleme 2-5 dakika sürebilir. Bekleyin!**

Bu komut şunları yapacak:

- Tüm gerekli paketleri indirecek (Next.js, React, serialport, vb.)
- Native modülleri derleyecek (serialport için)
- `node_modules` klasörü oluşturacak

### 3. Geliştirme Sunucusunu Başlat

```powershell
npm run dev
```

✅ Başarılı olursa şunu göreceksiniz:

```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 4. Tarayıcıda Aç

Tarayıcınızda şu adresi açın:

```
http://localhost:3000
```

🎉 **KP-301H Termal Yazıcı Kontrol Paneli görünmeli!**

## 🖨️ Yazıcı Test Etme

### Bağlantı Seçenekleri

Panel açıldığında:

#### Seçenek 1: Serial Port (USB-Serial Adaptör)

1. **"Serial Port"** butonuna tıklayın
2. Dropdown'dan COM portunu seçin (örn: COM3, COM4)
   - Port görmüyorsanız **"🔄 Yenile"** tıklayın
3. **"Bağlantıyı Test Et"** tıklayın

#### Seçenek 2: USB Bağlantısı

1. **"USB"** butonuna tıklayın
2. USB portunu seçin
3. **"Bağlantıyı Test Et"** tıklayın

#### Seçenek 3: Network (LAN)

1. **"Network (LAN)"** butonuna tıklayın
2. Yazıcının IP adresini girin (örn: `192.168.1.100`)
3. Port numarasını girin (varsayılan: `9100`)
4. **"Bağlantıyı Test Et"** tıklayın

### Görsel Yazdırma Testi

1. **Sağ panelde** görsel yükleme alanına:
   - Bir görsel dosyasını sürükleyip bırakın
   - VEYA tıklayarak dosya seçin
2. Görsel yüklendikten sonra **"Yazdır"** butonuna tıklayın

## 🔧 Olası Sorunlar ve Çözümler

### "node komutu bulunamadı" Hatası

**Çözüm**:

- PowerShell'i kapatıp yeniden açın
- Node.js'in PATH'e eklendiğinden emin olun
- Bilgisayarı yeniden başlatın

### "npm install" Sırasında Hata

**Çözüm**:

```powershell
# Temizle ve tekrar dene
npm cache clean --force
npm install
```

### "SerialPort yüklenemedi" Hatası

**Çözüm**: Windows Build Tools gerekli

```powershell
# Yönetici olarak çalıştırın
npm install --global windows-build-tools
npm rebuild
```

### "Port bulunamadı" Hatası

**Çözüm**:

1. Yazıcının bilgisayara bağlı olduğundan emin olun
2. Cihaz Yöneticisi'ni açın (Device Manager)
3. "Ports (COM & LPT)" bölümünde yazıcıyı görün
4. Gerekirse yazıcı sürücüsünü yükleyin

### "Port 3000 kullanımda" Hatası

**Çözüm**: Başka bir port kullanın

```powershell
npm run dev -- -p 3001
```

Sonra: http://localhost:3001

## 📝 Hızlı Test Checklist

Projeyi başlattıktan sonra test edin:

- [ ] Sayfa yükleniyor mu? (http://localhost:3000)
- [ ] 3 bağlantı butonu görünüyor mu? (Serial, USB, Network)
- [ ] Port listesi dropdown çalışıyor mu?
- [ ] Görsel yükleme alanı çalışıyor mu?
- [ ] Sürükle-bırak çalışıyor mu?
- [ ] Test butonu tıklanabiliyor mu?
- [ ] Yazdır butonu tıklanabiliyor mu?

## 🎓 Gelişmiş: Üretim Build

Geliştirme tamamlandığında:

```powershell
# Build oluştur
npm run build

# Üretim modunda çalıştır
npm start
```

## 🆘 Yardım

Sorun yaşıyorsanız:

1. **SETUP.md** - Detaylı kurulum rehberi
2. **README.md** - Genel dokümantasyon
3. **VERSIONING.md** - Güncelleme ve versiyon yönetimi

## 📞 İletişim

GitHub: https://github.com/cangirhabil/thermal-printer

---

**İyi Şanslar! 🚀**
