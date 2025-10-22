# KP-301H Termal Yazıcı Kontrol Paneli

KP-301H termal yazıcı için geliştirilmiş modern web tabanlı kontrol paneli. React ve Next.js kullanılarak oluşturulmuştur.

## ✨ Özellikler

- 🖼️ **Görsel Yazdırma**: Sürükle-bırak veya dosya seçimi ile görsel yükleme
- 🔌 **Çoklu Bağlantı Desteği**:
  - Serial Port (RS-232)
  - USB
  - Network/LAN (TCP/IP)
- 🔄 **Otomatik Port Algılama**: Mevcut serial portları otomatik tespit
- 🎨 **Modern Arayüz**: Tailwind CSS ile responsive tasarım
- 🌙 **Dark Mode**: Karanlık tema desteği
- ⚡ **Hızlı ve Kolay**: Kullanıcı dostu arayüz

## 🚀 Kurulum

### Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- Windows/Linux/MacOS

### Adım 1: Bağımlılıkları Yükleyin

```bash
npm install
```

veya

```bash
yarn install
```

### Adım 2: Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

veya

```bash
yarn dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📦 Üretim Build

```bash
npm run build
npm start
```

## 🖨️ Yazıcı Ayarları

### KP-301H Spesifikasyonları

- **Yazıcı Tipi**: Termal (ESC/POS uyumlu)
- **Kağıt Genişliği**: 80mm (576 dots)
- **Bağlantı Seçenekleri**:
  - Serial: COM1, COM2, vb. (9600 baud)
  - USB: USB seri port emülasyonu
  - Network: TCP/IP (Port 9100)

### Serial Port Bağlantısı

1. Yazıcıyı bilgisayara serial kablo ile bağlayın
2. Panelden "Serial Port" seçeneğini seçin
3. Port listesinden uygun COM portunu seçin
4. "Bağlantıyı Test Et" butonuna tıklayın

### USB Bağlantısı

1. Yazıcıyı bilgisayara USB kablo ile bağlayın
2. Sürücülerin yüklenmesini bekleyin
3. Panelden "USB" seçeneğini seçin
4. Otomatik algılanan USB portunu seçin

### Network (LAN) Bağlantısı

1. Yazıcının IP adresini öğrenin (genellikle yazıcı ayarlarından)
2. Panelden "Network" seçeneğini seçin
3. IP adresini ve portu (varsayılan: 9100) girin
4. "Bağlantıyı Test Et" butonuna tıklayın

## 💡 Kullanım

1. **Bağlantı Seçimi**: Sol panelden bağlantı tipini seçin
2. **Port/IP Ayarı**: Seçtiğiniz bağlantı tipine göre gerekli bilgileri girin
3. **Görsel Yükleme**: Sağ panelden yazdırmak istediğiniz görseli yükleyin
4. **Test**: İsteğe bağlı olarak bağlantıyı test edin
5. **Yazdır**: "Yazdır" butonuna tıklayarak işlemi başlatın

## 🎨 Görsel İpuçları

- Termal yazıcılar için **siyah-beyaz** görseller en iyi sonucu verir
- Maksimum genişlik: **576 piksel** (80mm)
- Yüksek kontrastlı, net görseller tercih edin
- PNG, JPG, GIF formatları desteklenir

## 🛠️ Teknoloji Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **UI**: React 18.3.1 + Tailwind CSS 3.4.6
- **Yazıcı Kütüphanesi**: node-thermal-printer 4.4.3
- **Serial İletişim**: serialport 12.0.0
- **Görsel İşleme**: sharp 0.33.4
- **Dil**: TypeScript 5.5.4

**Not**: Tüm bağımlılıklar sabit versiyonlarda kilitlenmiştir (^ veya ~ kullanılmamıştır) - bu sistem kararlılığını garanti eder.

## 📁 Proje Yapısı

```
thermal-printer/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── printer/          # Yazıcı API endpoint'leri
│   │       ├── ports/        # Port listesi
│   │       ├── print/        # Yazdırma
│   │       └── test/         # Bağlantı testi
│   ├── globals.css           # Global stiller
│   ├── layout.tsx            # Ana layout
│   └── page.tsx              # Ana sayfa
├── components/               # React bileşenleri
│   ├── ConnectionSelector.tsx # Bağlantı seçici
│   ├── ImageUploader.tsx     # Görsel yükleyici
│   └── PrinterPanel.tsx      # Ana panel
├── types/                    # TypeScript tip tanımları
│   └── printer.ts            # Yazıcı tipleri
└── public/                   # Statik dosyalar
```

## 🔧 API Endpoints

### `GET /api/printer/ports`

Mevcut serial portları listeler.

### `POST /api/printer/test`

Yazıcı bağlantısını test eder.

**Body:**

```json
{
  "connectionType": "serial",
  "serialPort": "COM3"
}
```

### `POST /api/printer/print`

Görsel yazdırır.

**Body:**

```json
{
  "imageData": "data:image/png;base64,...",
  "settings": {
    "connectionType": "serial",
    "serialPort": "COM3"
  }
}
```

## ⚠️ Sorun Giderme

### Port bulunamıyor

- Yazıcının düzgün bağlı olduğundan emin olun
- Gerekli sürücülerin yüklü olduğunu kontrol edin
- "Yenile" butonuna tıklayarak port listesini güncelleyin

### Yazdırma başarısız

- Bağlantı ayarlarını kontrol edin
- Yazıcının açık ve hazır olduğundan emin olun
- "Bağlantıyı Test Et" ile önce test yapın

### Node modülleri yüklenemiyor

```bash
# Node modüllerini temizle ve tekrar yükle
rm -rf node_modules package-lock.json
npm install
```

## � Versiyon Yönetimi

Bu proje **sabit versiyonlar** kullanır - tüm bağımlılıklar `package.json`'da `^` veya `~` olmadan tanımlanmıştır. Bu:

- Sistem kararlılığını garanti eder
- Beklenmeyen güncellemeleri önler
- Tekrarlanabilir build'ler sağlar

Detaylı bilgi için [VERSIONING.md](VERSIONING.md) dosyasına bakın.

## �📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu uygulama KP-301H termal yazıcı için özel olarak geliştirilmiştir ancak ESC/POS uyumlu diğer yazıcılarla da çalışabilir.
