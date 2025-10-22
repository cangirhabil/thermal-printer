# KP-301H Yazıcı Bağlantı Sorun Giderme

## 🔍 Yaşanan Sorun

"Socket timeout" hatası - Yazıcıya bağlanılamıyor.

## 📋 Kontrol Listesi

### 1. Yazıcı Fiziksel Kontrolü

- [ ] Yazıcı AÇIK mı?
- [ ] Kağıt var mı?
- [ ] Kapak kapalı mı?
- [ ] Hata LED'i yanıyor mu?

### 2. Bağlantı Tipi Kontrolü

#### Serial/USB Bağlantı İçin:

```powershell
# Windows'ta COM portlarını listele
mode
```

Veya Cihaz Yöneticisi'nden kontrol edin:

1. Win + X → Cihaz Yöneticisi
2. "Ports (COM & LPT)" altında yazıcıyı görün
3. Port numarasını not edin (örn: COM3)

#### Network Bağlantısı İçin:

**Yazıcının IP Adresini Bulma:**

1. **Self-Test Yazdırma** (Yazıcı kapalıyken):

   - FEED tuşuna basılı tutun
   - Gücü açın
   - FEED tuşunu 3 saniye sonra bırakın
   - Çıkan kağıtta IP adresi yazacak

2. **Router'dan Kontrol**:
   - Router admin paneline girin (genellikle 192.168.1.1)
   - Bağlı cihazları görün
   - "Custom" veya "KP-301H" isminde bir cihaz arayın

**IP Bağlantısını Test Etme:**

```powershell
# Yazıcıya ping at
ping 192.168.1.XXX

# Port açık mı kontrol et
Test-NetConnection -ComputerName 192.168.1.XXX -Port 9100
```

✅ Başarılı: `TcpTestSucceeded : True`  
❌ Başarısız: `TcpTestSucceeded : False`

### 3. KP-301H Özel Ayarlar

#### Baud Rate (Serial Bağlantı)

KP-301H varsayılan: **9600 bps**

Eğer değiştirildiyse, olası değerler:

- 2400
- 4800
- 9600 (varsayılan)
- 19200
- 38400
- 57600
- 115200

#### Network Port

Varsayılan: **9100** (RAW printing)

### 4. Yazıcı Sürücüsü

Windows için:

1. Üreticinin web sitesinden sürücü indirin
2. Sürücüyü yükleyin
3. Test sayfası yazdırın

### 5. Güvenlik Duvarı

Network bağlantısı kullanıyorsanız:

```powershell
# Port 9100'ü aç (Yönetici olarak çalıştırın)
New-NetFirewallRule -DisplayName "Thermal Printer" -Direction Outbound -LocalPort 9100 -Protocol TCP -Action Allow
```

## 🔧 Çözüm Önerileri

### Senaryo 1: Network Timeout Hatası

**Sebep**: Yazıcıya ağ üzerinden erişilemiyor

**Çözüm**:

1. IP adresini doğrulayın (self-test print)
2. Ping testini yapın
3. Port 9100'ün açık olduğunu kontrol edin
4. Güvenlik duvarını kontrol edin
5. Yazıcı ve bilgisayar aynı ağda mı kontrol edin

### Senaryo 2: Serial Port Bulunamadı

**Sebep**: Port seçilmemiş veya yanlış

**Çözüm**:

1. Cihaz Yöneticisi'nden doğru COM portunu bulun
2. Başka bir uygulama portu kullanıyor mu kontrol edin
3. USB kablosunu çıkarıp takın
4. Sürücüyü yeniden yükleyin

### Senaryo 3: "Başarılı" Diyor Ama Yazdırmıyor

**Olası Sebepler**:

1. **Kağıt Yok**: Termal kağıt bitmiş olabilir
2. **Isıtıcı Soğuk**: Yazıcı henüz ısınmamış
3. **Yanlış Kağıt**: Termal kağıt değil normal kağıt kullanılıyor
4. **Termal Kafa Kirli**: Temizleme gerekiyor
5. **Baskı Yoğunluğu Düşük**: Ayar değiştirilmiş

**Çözümler**:

```javascript
// API'de baskı yoğunluğunu artır
printer.setTextDoubleHeight();
printer.setTextDoubleWidth();
printer.bold(true);
```

### Senaryo 4: Karakterler Bozuk Çıkıyor

**Sebep**: Karakter seti uyumsuzluğu

**Çözüm**: Farklı karakter setleri deneyin:

- `PC857_TURKISH`
- `PC850_MULTILINGUAL`
- `SLOVENIA`
- `WINDOWS_1254`

## 🧪 Manuel Test

### Basit Python Test (Opsiyonel)

```python
# test_printer.py
import socket

# Network yazıcı testi
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(5)

try:
    sock.connect(('192.168.1.XXX', 9100))
    sock.send(b'Hello Printer\n\n\n\n')
    print("Başarılı!")
except Exception as e:
    print(f"Hata: {e}")
finally:
    sock.close()
```

### Windows Test Yazdırma

```powershell
# COM port testi (COM3 örneği)
echo "Test" > COM3
```

## 📊 Hata Log Analizi

Terminalden hata mesajlarını kontrol edin:

```powershell
# Next.js console'da hatalar görünür
# Önemli hatalar:
```

1. **"Socket timeout"** → Network bağlantısı yok
2. **"Port not found"** → Serial port yanlış/bağlı değil
3. **"ENOENT"** → Yazıcı sürücüsü yok
4. **"Access denied"** → İzin problemi
5. **"Code page not recognized"** → Karakter seti hatası (düzeltildi)

## 🎯 Önerilen Bağlantı Sırası

1. **Önce Serial/USB deneyin** (En güvenilir)

   - USB kablosu takın
   - Panelden COM portunu seçin
   - Test butonuna basın

2. **Sonra Network deneyin**
   - Self-test ile IP adresini öğrenin
   - Ping ile bağlantıyı test edin
   - Panele IP'yi girin

## 🆘 Hala Çalışmıyor?

### Debug Modu

1. Terminali açık tutun
2. Hatayı okuyun
3. Hangi satırda hata olduğuna bakın

### Log Kaydetme

Proje klasöründe:

```powershell
npm run dev > printer-debug.log 2>&1
```

### Factory Reset (Son Çare)

Yazıcıyı fabrika ayarlarına döndürün:

1. Gücü kapatın
2. FEED + POWER tuşlarına birlikte basın
3. 5 saniye bekleyin
4. Bırakın

---

**Hangi bağlantı tipini kullanıyorsunuz?**

- Serial/USB → COM port numarasını kontrol edin
- Network → IP adresini ve ping testini yapın
