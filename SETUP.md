# KP-301H Termal Yazıcı Kurulum Rehberi

## Windows İçin Adım Adım Kurulum

## 📦 Sabit Versiyon Bilgileri

Bu proje, sistem kararlılığı için tüm bağımlılıklarda **sabit versiyonlar** kullanır:

### Ana Bağımlılıklar

- Next.js: `14.2.5`
- React: `18.3.1`
- React DOM: `18.3.1`
- node-thermal-printer: `4.4.3`
- serialport: `12.0.0`
- canvas: `2.11.2`
- sharp: `0.33.4`

### Geliştirme Bağımlılıkları

- TypeScript: `5.5.4`
- Tailwind CSS: `3.4.6`
- ESLint: `8.57.0`

**Avantajları**:

- ✅ Beklenmeyen güncellemelerden korunma
- ✅ Tekrarlanabilir build'ler
- ✅ Ekip içinde aynı versiyonların kullanılması
- ✅ Üretim ortamında tutarlılık

### 1. Node.js Kurulumu

1. [Node.js resmi web sitesine](https://nodejs.org/) gidin
2. LTS (Long Term Support) versiyonunu indirin
3. İndirilen dosyayı çalıştırın ve kurulum sihirbazını takip edin
4. Kurulum tamamlandığında PowerShell'i açın ve kontrol edin:
   ```powershell
   node --version
   npm --version
   ```

### 2. Proje Bağımlılıklarını Yükleme

PowerShell'de proje klasörüne gidin:

```powershell
cd C:\Users\User\Desktop\thermal-printer
```

Bağımlılıkları yükleyin:

```powershell
npm install
```

**Not**:

- İlk yükleme birkaç dakika sürebilir. Sabırlı olun.
- Tüm bağımlılıklar sabit versiyonlarda kilitlenmiştir (package.json'da ^ veya ~ kullanılmamıştır)
- Bu, sistem kararlılığını garanti eder ve beklenmeyen güncellemelerden korunmanızı sağlar
- `.npmrc` dosyası otomatik versiyonları engellemek için yapılandırılmıştır

### 3. Yazıcı Sürücülerini Kurma

#### Serial Port Bağlantısı

- Windows genellikle serial portları otomatik tanır
- Cihaz Yöneticisi'nden (Device Manager) COM portunu kontrol edin
- Gerekirse yazıcı üreticisinin sürücüsünü yükleyin

#### USB Bağlantısı

1. Yazıcıyı USB ile bilgisayara bağlayın
2. Windows'un otomatik sürücü kurulumunu bekleyin
3. Cihaz Yöneticisi'nde "Ports (COM & LPT)" altında görünmeli
4. Gerekirse [üreticinin web sitesinden](https://www.custom.biz/en-us/products/printers/receipt-pos/kp-301h) sürücüyü indirin

#### Network/LAN Bağlantısı

1. Yazıcıyı ağa bağlayın
2. Yazıcının IP adresini öğrenin (test baskısından veya ayarlardan)
3. Bilgisayarınızdan yazıcıya ping atarak test edin:
   ```powershell
   ping 192.168.1.100
   ```

### 4. Uygulamayı Çalıştırma

Geliştirme modunda çalıştırın:

```powershell
npm run dev
```

Tarayıcınızda şu adresi açın:

```
http://localhost:3000
```

### 5. İlk Kullanım

1. **Bağlantı Tipini Seçin**: Serial, USB veya Network
2. **Port/IP Ayarlayın**:
   - Serial/USB: Dropdown'dan COM portunu seçin
   - Network: IP adresini girin (örn: 192.168.1.100)
3. **Bağlantıyı Test Edin**: "Bağlantıyı Test Et" butonuna tıklayın
4. **Görsel Yükleyin**: Sağ panelden görsel yükleyin
5. **Yazdırın**: "Yazdır" butonuna tıklayın

## Yaygın Sorunlar ve Çözümleri

### "npx komutu bulunamadı" Hatası

**Çözüm**: Node.js kurulumu eksik veya PATH'e eklenmemiş

1. Node.js'i tekrar kurun
2. Kurulum sırasında "Add to PATH" seçeneğinin seçili olduğundan emin olun
3. PowerShell'i kapatıp tekrar açın

### "SerialPort yüklenemedi" Hatası

**Çözüm**: Native modül derleme araçları gerekli

```powershell
npm install --global windows-build-tools
npm rebuild
```

### Port Listesi Boş Geliyor

**Çözüm**:

1. Yazıcının düzgün bağlı olduğundan emin olun
2. Cihaz Yöneticisi'nden COM portunu kontrol edin
3. Yazıcı sürücülerinin kurulu olduğunu doğrulayın
4. PowerShell'i yönetici olarak çalıştırın

### "Sharp yüklenemedi" Hatası

**Çözüm**:

```powershell
npm install --platform=win32 --arch=x64 sharp
```

### Yazıcı Yanıt Vermiyor

**Çözüm**:

1. Yazıcının açık ve hazır durumda olduğunu kontrol edin
2. Kağıt var mı kontrol edin
3. Bağlantı ayarlarını doğrulayın
4. Başka bir programdan yazıcıyı test edin

### "Permission Denied" Hatası

**Çözüm**: PowerShell'i yönetici olarak çalıştırın

1. PowerShell'e sağ tıklayın
2. "Yönetici olarak çalıştır" seçin
3. Komutu tekrar deneyin

## Üretim Ortamı İçin

Uygulamayı üretim modunda çalıştırmak için:

```powershell
# Build oluştur
npm run build

# Üretim sunucusunu başlat
npm start
```

## Otomatik Başlatma (İsteğe Bağlı)

Windows başlangıcında uygulamayı otomatik başlatmak için:

1. Bir `.bat` dosyası oluşturun:

```batch
@echo off
cd C:\Users\User\Desktop\thermal-printer
start /B npm start
```

2. Bu dosyayı Başlangıç klasörüne kopyalayın:
   - `Win + R` tuşlarına basın
   - `shell:startup` yazın
   - `.bat` dosyasını bu klasöre kopyalayın

## Port Ayarları Referansı

### Serial Port Ayarları

- **Baud Rate**: 9600
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None
- **Flow Control**: None

### Network Port

- **Varsayılan Port**: 9100 (RAW printing)
- **Protokol**: TCP/IP

## Güvenlik Notları

- Uygulama localhost'ta çalışır (sadece yerel bilgisayardan erişilebilir)
- Dış ağdan erişim için Next.js yapılandırmasını düzenlemeniz gerekir
- Üretim ortamında güvenlik duvarı kurallarını kontrol edin

## Destek

Sorunlarınız için:

1. README.md dosyasındaki "Sorun Giderme" bölümüne bakın
2. GitHub'da issue açın
3. Yazıcı üreticisinin teknik desteğine başvurun

---

**İyi Yazdırmalar! 🖨️**
