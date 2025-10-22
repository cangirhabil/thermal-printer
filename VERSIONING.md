# Versiyon Yönetimi ve Güncelleme Rehberi

## 🔒 Sabit Versiyon Stratejisi

Bu proje, **sabit versiyon (exact versioning)** stratejisi kullanır. Bu, `package.json` dosyasında `^` veya `~` gibi semboller kullanmadığımız anlamına gelir.

### Neden Sabit Versiyonlar?

**Avantajlar**:

- ✅ **Öngörülebilirlik**: Tam olarak hangi versiyonların kullanıldığını bilirsiniz
- ✅ **Kararlılık**: Beklenmeyen güncellemeler sistemi bozmaz
- ✅ **Tekrarlanabilirlik**: Her yükleme aynı sonucu verir
- ✅ **Hata Ayıklama**: Versiyon farklılıklarından kaynaklanan sorunlar olmaz
- ✅ **Güvenlik**: Güncellemeler kontrollü yapılır

**Dezavantajlar**:

- ⚠️ Manuel güncelleme gerektirir
- ⚠️ Güvenlik yamalarını manuel takip etmelisiniz

## 📋 Mevcut Versiyonlar

### Çekirdek Bağımlılıklar

```json
{
  "next": "14.2.5",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "node-thermal-printer": "4.4.3",
  "serialport": "12.0.0",
  "canvas": "2.11.2",
  "sharp": "0.33.4"
}
```

### Geliştirme Araçları

```json
{
  "@types/node": "20.14.12",
  "@types/react": "18.3.3",
  "@types/react-dom": "18.3.0",
  "autoprefixer": "10.4.19",
  "eslint": "8.57.0",
  "eslint-config-next": "14.2.5",
  "postcss": "8.4.39",
  "tailwindcss": "3.4.6",
  "typescript": "5.5.4"
}
```

## 🔄 Güncelleme Nasıl Yapılır?

### 1. Mevcut Durumu Kontrol Etme

Güncel olmayan paketleri kontrol edin:

```powershell
npm outdated
```

### 2. Tek Bir Paketi Güncelleme

Dikkatli bir şekilde tek tek güncelleyin:

```powershell
# Belirli bir paketi güncelle
npm install paket-adi@yeni-versiyon --save-exact

# Örnek:
npm install next@14.2.6 --save-exact
```

### 3. Test Etme

Her güncellemeden sonra **mutlaka** test edin:

```powershell
# Uygulamayı çalıştır
npm run dev

# Build test et
npm run build

# Lint kontrolü
npm run lint
```

### 4. Toplu Güncelleme (Dikkatli!)

**Önerilmez**, ama gerekirse:

```powershell
# 1. Yedek alın
cp package.json package.json.backup

# 2. Paketleri kontrol edin
npm outdated

# 3. Güvenli güncellemeler için (patch versiyonlar)
npm update --save-exact

# 4. Test edin
npm run dev
npm run build

# 5. Sorun varsa geri alın
cp package.json.backup package.json
npm install
```

## 🛡️ Güvenlik Güncellemeleri

Güvenlik açıklarını düzenli kontrol edin:

```powershell
# Güvenlik kontrolü
npm audit

# Otomatik düzeltme (dikkatli!)
npm audit fix --force

# Manuel inceleme için
npm audit --json > audit-report.json
```

## 📅 Önerilen Güncelleme Takvimi

### Haftalık

- ⚠️ Kritik güvenlik güncellemelerini kontrol edin
- 🐛 Bilinen hataları takip edin

### Aylık

- 🔍 `npm outdated` ile güncel olmayan paketleri kontrol edin
- 📊 Güvenlik açıklarını `npm audit` ile kontrol edin

### Üç Ayda Bir

- 🔄 Patch ve minor güncellemeleri değerlendirin
- 🧪 Test ortamında güncellemeleri test edin

### Yıllık

- 🚀 Major versiyonları değerlendirin
- 📚 Dokümantasyonu güncelleyin

## 🎯 Güncelleme Önceliklendirmesi

### Yüksek Öncelik (Hemen)

1. Kritik güvenlik açıkları
2. Yazıcı sürücü sorunları
3. Performans sorunları

### Orta Öncelik (1-2 Hafta)

1. Orta düzey güvenlik açıkları
2. Bug düzeltmeleri
3. Uyumluluk sorunları

### Düşük Öncelik (Planlı)

1. Yeni özellikler
2. Minor güncellemeler
3. Dokümantasyon iyileştirmeleri

## 🧪 Test Checklist'i

Her güncellemeden sonra test edin:

- [ ] Uygulama başlıyor mu? (`npm run dev`)
- [ ] Build başarılı mı? (`npm run build`)
- [ ] Serial port algılama çalışıyor mu?
- [ ] USB bağlantısı çalışıyor mu?
- [ ] Network bağlantısı çalışıyor mu?
- [ ] Görsel yükleme çalışıyor mu?
- [ ] Yazdırma işlemi başarılı mı?
- [ ] Test print çalışıyor mu?
- [ ] Dark mode çalışıyor mu?
- [ ] Responsive tasarım bozuldu mu?

## 🔧 Sorun Giderme

### "Bağımlılıklar uyumsuz" Hatası

```powershell
# node_modules'i temizle
rm -rf node_modules package-lock.json

# Tekrar yükle
npm install
```

### "Native modül derlenemedi" Hatası

```powershell
# Build tools'u yükle
npm install --global windows-build-tools

# Yeniden derle
npm rebuild
```

### "Versiyon çakışması" Hatası

```powershell
# Temiz yükleme
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📝 .npmrc Yapılandırması

Proje kök dizinindeki `.npmrc` dosyası:

```
# Sabit versiyonlar için
save-exact=true

# Legacy peer dependencies
legacy-peer-deps=false

# Güncelleme bildirimleri
update-notifier=false
```

## 🔐 En İyi Pratikler

1. **Her Zaman Test Edin**: Güncelleme öncesi ve sonrası
2. **Yedek Alın**: `package.json` ve `package-lock.json`
3. **Dokümante Edin**: Yapılan güncellemeleri kaydedin
4. **Git Kullanın**: Değişiklikleri commit'leyin
5. **Tek Tek Güncelleyin**: Toplu güncellemelerden kaçının
6. **Changelog Okuyun**: Yeni versiyonda ne değişti?
7. **Breaking Changes**: Major güncellemelerde dikkatli olun

## 📚 Yararlı Komutlar

```powershell
# Kurulu versiyonları listele
npm list --depth=0

# Belirli bir paketin versiyonunu göster
npm list paket-adi

# Paketin tüm versiyonlarını göster
npm view paket-adi versions

# Paketin detaylı bilgisi
npm info paket-adi

# Bağımlılık ağacını görüntüle
npm ls
```

## 🆘 Acil Durum: Geri Alma

Güncelleme sorun çıkarırsa:

```powershell
# Git ile geri al
git checkout package.json package-lock.json
npm install

# Veya yedekten geri yükle
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm install
```

## 📞 Destek

Güncelleme ile ilgili sorunlar için:

1. GitHub Issues
2. Proje dokümantasyonu
3. NPM resmi dokümantasyonu

---

**Son Güncelleme**: Ekim 2025  
**Proje Versiyonu**: 0.1.0
