# 🚀 Hızlı Başlangıç Rehberi

## ⚡ 5 Dakikada Başlayın

### 1️⃣ Uygulamayı Başlatın

```bash
npm run dev
```

Tarayıcınızda açın: **http://localhost:3000**

### 2️⃣ Yazıcı Kontrolü

Sayfa açıldığında:

- ✅ Sağ üstte **"Aktif"** badge'i görünüyorsa → Hazırsınız!
- ❌ **"Bağlantı Yok"** gösteriyorsa → Yazıcınızı kontrol edin

### 3️⃣ İlk Yazdırma (Görsel)

1. **"Görsel"** sekmesine tıklayın
2. Bir resmi sürükleyip bırakın
3. Önizlemeyi kontrol edin
4. **"Yazdır"** butonuna tıklayın
5. ✅ Başarı bildirimi göreceksiniz!

### 4️⃣ Metin Yazdırma

1. **"Metin"** sekmesine geçin
2. Metni yazın
3. İsteğe bağlı: Format ayarlayın
4. Önizlemeyi kontrol edin
5. **"Yazdır"** butonuna tıklayın

---

## 📱 Cihazlarda Kullanım

### 💻 Masaüstü

- Tam özellikli 3 sütun layout
- Tüm özellikler aktif
- Hover efektleri

### 📱 Tablet

- 2 sütun layout
- Optimize edilmiş görünüm
- Touch-friendly

### 📱 Mobil

- Tek sütun
- Stack layout
- Büyük dokunma alanları

---

## 🎯 Temel Özellikler

### ✨ Otomatik Algılama

Hiçbir ayar yapmanıza gerek yok! Sistem otomatik olarak:

- USB yazıcıları
- Serial portları (COM)
- Network yazıcıları
- Windows yazıcılarını

tarar ve en uygununu seçer.

### 🖼️ Görsel Yazdırma

- **Desteklenen formatlar:** PNG, JPG, GIF
- **Sürükle & Bırak** desteği
- **Otomatik önizleme**
- **Boyut optimizasyonu:** 576px genişlik

### 📝 Metin Yazdırma

- **Çoklu satır** desteği
- **4 yazı boyutu:** Küçük, Normal, Büyük, Çok Büyük
- **3 hizalama:** Sol, Orta, Sağ
- **Kalın yazı** seçeneği
- **Canlı önizleme**

### ⚙️ Manuel Ayarlar

İhtiyaç duyarsanız:

1. **"Ayarlar"** sekmesine gidin
2. Bağlantı tipini seçin
3. Gerekli bilgileri girin
4. **"Bağlantıyı Test Et"** ile kontrol edin

---

## 🆘 Sorun mu Yaşıyorsunuz?

### Yazıcı Algılanmıyor

```
1. USB kablosunu kontrol edin
2. Yazıcının açık olduğundan emin olun
3. Sayfayı yenileyin (F5)
4. Hala sorun varsa → Ayarlar → Bağlantıyı Test Et
```

### Bozuk Çıktı

```
1. Görseli 576px genişliğe düşürün
2. Kağıt genişliğini kontrol edin (80mm)
3. Yazıcı ayarlarını sıfırlayın
```

### Network Bağlanamıyor

```
1. Yazıcı ve PC aynı ağda mı?
2. IP adresi doğru mu?
3. Port numarası (genellikle 9100)
4. Firewall ayarlarını kontrol edin
```

---

## 🎨 UI Özellikleri

### 🌗 Dark Mode

- Otomatik sistem tercihi
- Göz dostu renkler
- Tüm komponentler uyumlu

### 📱 Responsive

- Her ekran boyutunda mükemmel
- Mobil-first tasarım
- Touch-optimized

### 🔔 Bildirimler

- Başarı/hata mesajları
- Otomatik kapanma (5 saniye)
- Stack notification desteği

---

## ⌨️ Klavye Kısayolları

```
Tab          → Komponentler arası gezinti
Enter        → Buton aktivasyonu
Esc          → Modal/Dialog kapatma
Ctrl/Cmd + V → Görsel yapıştırma (yakında)
```

---

## 📊 Sistem Gereksinimleri

### Minimum

- **Node.js:** 18.x veya üzeri
- **RAM:** 512MB
- **Disk:** 500MB
- **Tarayıcı:** Modern browser (Chrome, Firefox, Safari, Edge)

### Önerilen

- **Node.js:** 20.x
- **RAM:** 2GB
- **Disk:** 1GB
- **Bağlantı:** USB 2.0 veya üzeri

---

## 🔧 Gelişmiş Özellikler

### API Endpoints

```javascript
// Otomatik yazdırma
POST /api/printer/auto-print
Body: {
  imageData: "base64...",
  textData: "Merhaba",
  textOptions: {
    fontSize: "normal",
    alignment: "left",
    bold: false
  }
}

// Yazıcı algılama
GET /api/printer/auto-detect

// Port listeleme
GET /api/printer/ports
```

### Özelleştirme

- `tailwind.config.ts` → Renkler, spacing
- `components/ui/` → Shadcn komponentleri
- `app/globals.css` → Global stiller

---

## 📚 Daha Fazla Bilgi

- **Kullanım Kılavuzu:** `USAGE.md`
- **Tasarım Dokümantasyonu:** `DESIGN.md`
- **UI Rehberi:** `UI_GUIDE.md`
- **Uygulama Özeti:** `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Başarılı Kullanım İpuçları

1. **Görsel boyutunu optimize edin** → Daha hızlı yazdırma
2. **Önizlemeyi kontrol edin** → Hata oranını azaltır
3. **Otomatik modu kullanın** → En kolay yöntem
4. **Kağıt kalitesine dikkat edin** → Daha iyi sonuçlar

---

## 💡 Pro İpuçları

### Görsel Yazdırma

- Yüksek kontrast → Daha net çıktı
- Siyah-beyaz → En iyi sonuç
- 576px genişlik → Optimum boyut

### Metin Yazdırma

- Kısa satırlar → Daha okunabilir
- Kalın yazı → Vurgular için
- Ortala hizalama → Başlıklar için

### Performans

- Görsel önbelleği temizleyin
- Tarayıcı cache'ini yönetin
- Düzenli olarak yazıcıyı yeniden başlatın

---

## ⭐ En İyi Uygulamalar

1. ✅ Her yazdırma öncesi önizleme yapın
2. ✅ Yazıcı bağlantısını düzenli test edin
3. ✅ Görsel boyutlarını optimize edin
4. ✅ Kağıt kalitesine dikkat edin
5. ✅ Düzenli bakım yapın

---

## 🎯 Başarı Metrikleri

Uygulamanız başarılıysa:

- ✅ Yazıcı otomatik algılanıyor
- ✅ Yazdırma 5 saniyeden kısa sürüyor
- ✅ %95+ başarı oranı
- ✅ Hiç ayar gerekmiyor
- ✅ Tüm cihazlarda çalışıyor

---

**İyi yazdırmalar! 🖨️✨**
