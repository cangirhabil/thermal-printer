# 🖨️ KP-301H Termal Yazıcı Kontrol Paneli

Modern, profesyonel ve responsive termal yazıcı kontrol paneli. Next.js 14 ve Shadcn UI ile geliştirilmiştir.

## ✨ Özellikler

### 🎨 Modern UI/UX
- **Shadcn UI** komponentleri ile profesyonel tasarım
- **Tam responsive** - Mobil, tablet ve desktop için optimize
- **Dark mode** desteği
- **Smooth animasyonlar** ve transitions
- **Lucide Icons** ile modern ikonlar

### 🖨️ Yazdırma Özellikleri
- **Görsel Yazdırma**
  - Drag & drop görsel yükleme
  - Önizleme desteği
  - PNG, JPG, GIF formatları
  - Otomatik boyutlandırma (576px genişlik)

- **Metin Yazdırma**
  - Çoklu satır metin desteği
  - Yazı boyutu seçimi (Küçük, Normal, Büyük, Çok Büyük)
  - Hizalama (Sol, Orta, Sağ)
  - Kalın yazı seçeneği
  - Canlı önizleme

- **Otomatik Yazıcı Algılama**
  - USB bağlantı
  - Serial port (COM)
  - Network bağlantısı
  - Windows yazıcıları

### ⚙️ Ayarlar
- Manuel bağlantı seçimi
- Port tarama ve listeleme
- Network yapılandırması
- Bağlantı testi

### 📊 Durum Takibi
- Gerçek zamanlı yazıcı durumu
- Bağlantı tipi gösterimi
- Hızlı bilgiler kartı
- Yazıcı özellikleri

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
npm start
```

## 📦 Kullanılan Teknolojiler

- **Next.js 14** - React framework
- **Shadcn UI** - UI komponent kütüphanesi
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - İkon kütüphanesi
- **TypeScript** - Tip güvenliği
- **node-thermal-printer** - Termal yazıcı desteği
- **serialport** - Serial port iletişimi
- **sharp** - Görsel işleme

## 🎯 Kullanım

### Görsel Yazdırma
1. **Görsel** sekmesine tıklayın
2. Görseli sürükleyip bırakın veya dosya seçin
3. Önizlemeyi kontrol edin
4. **Yazdır** butonuna tıklayın

### Metin Yazdırma
1. **Metin** sekmesine tıklayın
2. Metni yazın
3. Formatı ayarlayın (boyut, hizalama, kalın)
4. Önizlemeyi kontrol edin
5. **Yazdır** butonuna tıklayın

### Yazıcı Ayarları
1. **Ayarlar** sekmesine tıklayın
2. Bağlantı tipini seçin (varsayılan: Otomatik)
3. Gerekirse manuel ayarlar yapın
4. **Bağlantıyı Test Et** butonuyla kontrol edin

## 🔧 Yapılandırma

### Yazıcı Özellikleri
- **Model**: KP-301H
- **Kağıt Genişliği**: 80mm
- **Çözünürlük**: 203 DPI
- **Maksimum Genişlik**: 576 piksel

### Desteklenen Bağlantı Tipleri
- USB
- Serial (COM portları)
- Network (TCP/IP)
- Windows Yazıcıları

## 📱 Responsive Tasarım

Uygulama tüm ekran boyutlarında mükemmel çalışır:
- **Mobil** (< 640px): Tek sütun, stack layout
- **Tablet** (640px - 1024px): Adapte edilmiş grid
- **Desktop** (> 1024px): Tam özellikli 3 sütun layout

## 🎨 UI Komponentleri

### Ana Komponentler
- `PrinterDashboard` - Ana kontrol paneli
- `ImagePrintPanel` - Görsel yazdırma paneli
- `TextPrintPanel` - Metin yazdırma paneli
- `PrinterSettingsPanel` - Ayarlar paneli
- `PrinterStatusCard` - Durum kartı

### Shadcn UI Komponentleri
- Button
- Card
- Input
- Textarea
- Tabs
- Badge
- Select
- Toast
- Alert
- Switch
- Label
- Dropdown Menu

## 🌐 API Endpoints

```typescript
// Otomatik yazdırma
POST /api/printer/auto-print
Body: { imageData?, textData?, textOptions? }

// Yazıcı algılama
GET /api/printer/auto-detect

// Port listeleme
GET /api/printer/ports

// Manuel yazdırma
POST /api/printer/print
POST /api/printer/print-com
POST /api/printer/print-raw
```

## 🐛 Sorun Giderme

### Yazıcı Algılanmıyor
- USB kablosunu kontrol edin
- Yazıcının açık olduğundan emin olun
- Sürücülerin yüklü olduğunu kontrol edin
- Farklı USB portu deneyin

### Bozuk Çıktı
- Kağıt genişliğini kontrol edin (80mm olmalı)
- Görsel boyutunu 576px genişlik olarak ayarlayın
- Yazıcı ayarlarını sıfırlayın

### Network Bağlantı Sorunları
- Yazıcı ve bilgisayar aynı ağda olmalı
- IP adresini kontrol edin
- Port numarasını kontrol edin (varsayılan: 9100)
- Firewall ayarlarını kontrol edin

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.

## 👨‍💻 Geliştirici

Profesyonel termal yazıcı kontrol paneli - 2025

---

**Not**: Bu uygulama KP-301H termal yazıcı için optimize edilmiştir ancak diğer ESC/POS uyumlu yazıcılarla da çalışabilir.
