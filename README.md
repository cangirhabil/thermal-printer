# KP-302H Termal Yazıcı Kontrol Paneli

KP-302H termal yazıcı için geliştirilmiş modern web tabanlı kontrol paneli. React ve Next.js kullanılarak oluşturulmuştur.

## 🌟 Özellikler

- **🔍 Otomatik Cihaz Bulma**: KP-302H yazıcısı ağınızda model ismine göre otomatik olarak taranır ve bulunur
- **🔄 Akıllı Bağlantı Yönetimi**: Önce COM, sonra LAN - bir bağlantı koparsa otomatik diğerine geçiş
- **🌐 Esnek Bağlantı**: COM/USB (Öncelik 1), Network/LAN (Öncelik 2), Windows Printer (Öncelik 3)
- **🖼️ Görsel Yazdırma**: Sürükle-bırak ile görsel yükleme ve yazdırma
- **📝 Metin Yazdırma**: ESC/POS komutları ile özelleştirilebilir metin yazdırma
- **🇹🇷 Türkçe Karakter Desteği**: PC857_TURKISH karakter seti ile tam Türkçe destek
- **👁️ Gerçek Zamanlı Önizleme**: Yazdırma öncesi önizleme
- **📜 Yazdırma Geçmişi**: Son yazdırma işlemlerinin kaydı

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

## 📖 Kullanım

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcıda `http://localhost:3000` adresine gidin
3. Bağlantı tipini seçin:
   - **🔌 COM/USB** (Öncelik 1): Port seçin
   - **🌐 Network** (Öncelik 2): KP-302H otomatik bulunacak
   - **️ Windows Printer** (Öncelik 3): Yazıcı adını girin

### 🔍 Otomatik Yazıcı Algılama

"Otomatik Algıla" butonu ile KP-302H yazıcı otomatik olarak bulunur:

**Öncelik Sırası:**
1. **🥇 COM/USB Port**: İlk önce COM portlar kontrol edilir
2. **🥈 Network (LAN)**: COM bulunamazsa ağda KP-302H taranır
3. **🥉 Windows Printer**: Son olarak Windows yazıcılar denenir

### 🔄 Otomatik Bağlantı Geçişi

Sistem akıllı bağlantı yönetimine sahiptir:
- **COM bağlantısı koparsa** → Otomatik olarak LAN'a geçiş yapar
- **LAN bağlantısı koparsa** → Otomatik olarak COM'u dener
- **Geçişte bildirim** → Kullanıcı her geçişte bilgilendirilir
- **3 otomatik deneme** → Başarısız olursa manuel müdahale gerekir

### 🌐 Ağ Taraması Detayları

Network bağlantısında:
- Yazıcı **model ismine** göre otomatik bulunur (KP-302H)
- Seri numarası kontrolü **YOK** (sadece model ismi)
- Sabit IP girmek **gerekmez**
- Yaygın IP aralıkları taranır (192.168.x.x, 10.0.0.x)
- Bulunduğunda otomatik bağlanır

---

**Not**: Bu uygulama KP-302H termal yazıcı için özel olarak geliştirilmiştir ancak ESC/POS uyumlu diğer yazıcılarla da çalışabilir.
