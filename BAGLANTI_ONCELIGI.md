# KP-302 Yazıcı Bağlantı Önceliği

## 📋 Sistem Güncellendi

KP-302 termal yazıcı için otomatik bağlantı sistemi, dokümanına uygun olarak güncellendi.

## 🔌 Bağlantı Öncelik Sırası

### ✅ ÖNCELİK 1: COM PORT (Serial)

- **Neden öncelikli:** KP-302 dokümanına göre USB/Serial bağlantı birincil yöntem
- **Nasıl çalışır:**
  - Sistem tüm COM portlarını tarar (COM1, COM2, COM3, vb.)
  - Her portu test eder
  - Çalışan ilk COM portunu kullanır
- **Ayarlar:**
  - Baud Rate: 9600
  - Data Bits: 8
  - Stop Bits: 1
  - Parity: None
  - Flow Control: RTS/CTS (Hardware)

### ⚡ ÖNCELİK 2: ETHERNET (Network)

- **Ne zaman kullanılır:** COM port müsait değilse
- **Nasıl çalışır:**
  - Sistem bilinen IP adreslerini dener:
    - 192.168.2.211 (varsayılan)
    - 192.168.1.100
    - 192.168.0.100
  - Port: 9100, 9101, 9102
- **Özellikler:**
  - 2 saniye timeout
  - TCP socket bağlantısı
  - RAW data gönderimi

## 🎯 Kullanım

Artık hiçbir ayar yapmanıza gerek yok! Sistem otomatik olarak:

1. **COM Port kontrol eder** → Müsaitse kullanır ✅
2. **COM yoksa Ethernet'e geçer** → Müsaitse kullanır ✅
3. **İkisi de yoksa hata mesajı gösterir** ❌

## 🔍 Sorun Giderme

### COM Port Çalışmıyorsa:

```
✓ USB kablosu takılı mı?
✓ Cihaz Yöneticisi'nde COM portu görünüyor mu? (örn: COM3)
✓ Sürücüler yüklü mü?
✓ Başka program portu kullanıyor olabilir
```

### Ethernet Çalışmıyorsa:

```
✓ Network kablosu bağlı mı?
✓ IP adresi doğru mu? (Yazıcı menüsünden kontrol edin)
✓ Firewall 9100 portunu engelliyor olabilir
✓ Aynı network'te misiniz?
```

## 📊 Sistem Davranışı

```
🤖 YAZDIRMA İSTEĞİ
    ↓
🔌 ÖNCELİK 1: COM PORT
    ├─ Tüm COM portları taranır
    ├─ COM3, COM4, COM5... test edilir
    ├─ ✅ Çalışan bulundu → YAZDIR
    └─ ❌ Hiçbiri çalışmadı
           ↓
    🌐 ÖNCELİK 2: ETHERNET
       ├─ IP adresleri test edilir
       ├─ 192.168.2.211:9100 test edilir
       ├─ ✅ Çalışan bulundu → YAZDIR
       └─ ❌ Hiçbiri çalışmadı
              ↓
           ❌ HATA MESAJI
```

## 💡 Notlar

- **KP-302 Dokümanı:** Yazıcı hem USB (Serial) hem de Ethernet destekler
- **Öncelik Mantığı:** USB/COM daha hızlı ve stabil olduğu için öncelikli
- **Otomatik Algılama:** Kullanıcı müdahalesine gerek yok
- **Yedekleme:** Eski dosya `route.ts.backup` olarak saklandı

## 🚀 Test

Sistemi test etmek için:

1. Görsel veya metin yükleyin
2. "Yazdır" butonuna tıklayın
3. Terminal loglarını izleyin
4. Sistem hangi yolu kullandığını gösterecek

**Beklenen Log Çıktısı:**

```
========================================
🤖 OTOMATİK YAZDIRMA - KP-302 Yazıcı
Öncelik: 1) COM Port  2) Ethernet
========================================

🔌 ÖNCELİK 1: COM PORT BAĞLANTISI
📋 KP-302: Serial/COM interface (öncelikli)
🔍 3 serial port bulundu
🔌 Port deneniyor: COM3
✅ COM3 başarılı!
✅ COM PORT BAĞLANTISI BAŞARILI!
   Port: COM3
```

---

**Güncelleme:** 21 Ekim 2025
**Versiyon:** v2.0 - KP-302 Optimized
