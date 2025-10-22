import { NextRequest, NextResponse } from "next/server";
import * as net from "net";
import sharp from "sharp";

// Güvenli ThermalPrinter kütüphanesi
async function getThermalPrinter() {
  try {
    const { ThermalPrinter, PrinterTypes } = await import("node-thermal-printer");
    return { ThermalPrinter, PrinterTypes };
  } catch (error) {
    console.error("ThermalPrinter yüklenemedi:", error);
    return null;
  }
}

interface PrintAttempt {
  method: string;
  details: string;
  success: boolean;
  error?: string;
}

interface TextOptions {
  fontSize?: "small" | "normal" | "large" | "xlarge";
  fontType?: "A" | "B";
  alignment?: "left" | "center" | "right";
  bold?: boolean;
  underline?: boolean;
  lineSpacing?: number;
  leftMargin?: number;
  topSpacing?: number;
  bottomSpacing?: number;
}

// ==========================================
// COM PORT - Serial Communication (Priority 1)
// node-thermal-printer kütüphanesi ile güvenli yazdırma
// ==========================================
async function trySerialPorts(
  imageData: string | null,
  textData: string,
  textOptions?: TextOptions
): Promise<PrintAttempt> {
  try {
    const printerLib = await getThermalPrinter();
    if (!printerLib) {
      return {
        method: "Serial/USB",
        details: "ThermalPrinter kütüphanesi yüklenemedi",
        success: false,
        error: "node-thermal-printer paketi bulunamadı",
      };
    }

    const { ThermalPrinter, PrinterTypes } = printerLib;
    const { SerialPort } = await import("serialport");
    const ports = await SerialPort.list();

    console.log(`🔍 ${ports.length} serial port bulundu`);

    // Her portu dene
    for (const portInfo of ports) {
      const portPath = portInfo.path;
      console.log(`🔌 Port deneniyor: ${portPath}`);

      try {
        // ThermalPrinter yapılandırması
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON, // ESC/POS uyumlu
          interface: portPath,
          characterSet: "PC857_TURKISH" as any, // Türkçe karakter desteği
          removeSpecialCharacters: false,
          lineCharacter: "-",
          options: {
            timeout: 5000,
          },
        });

        // Bağlantı testi
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
          console.log(`❌ ${portPath} bağlantı başarısız`);
          continue;
        }

        console.log(`✅ ${portPath} bağlantı başarılı`);

        // Yazıcıyı başlat
        printer.clear();

        // Görsel işleme
        if (imageData) {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");

          // KP-302: 576 dots genişlik (72mm x 8 dots/mm)
          const processedImage = await sharp(imageBuffer)
            .resize(576, null, {
              fit: "inside",
              withoutEnlargement: false,
              kernel: sharp.kernel.lanczos3,
            })
            .grayscale()
            .normalise()
            .threshold(128, { greyscale: false })
            .png()
            .toBuffer();

          // Görseli Base64 olarak yazdır
          const base64Image = processedImage.toString("base64");
          await printer.printImageBuffer(Buffer.from(base64Image, "base64"));
          printer.newLine();
        }

        // Metin yazdırma
        if (textData && textData.trim().length > 0) {
          // Üst boşluk
          const topSpacing = textOptions?.topSpacing || 2;
          for (let i = 0; i < topSpacing; i++) {
            printer.newLine();
          }

          // Sol kenar boşluğu (leftMargin piksel -> karakter dönüşümü)
          const leftMargin = textOptions?.leftMargin || 0;
          const leftMarginChars = Math.floor(leftMargin / 12); // ~12 piksel = 1 karakter

          // Font tipi
          if (textOptions?.fontType === "B") {
            printer.setTypeFontB();
          } else {
            printer.setTypeFontA();
          }

          // Hizalama
          if (textOptions?.alignment === "center") {
            printer.alignCenter();
          } else if (textOptions?.alignment === "right") {
            printer.alignRight();
          } else {
            printer.alignLeft();
          }

          // Kalın yazı
          if (textOptions?.bold) {
            printer.bold(true);
          }

          // Altı çizili
          if (textOptions?.underline) {
            printer.underline(true);
          }

          // Yazı boyutu
          if (textOptions?.fontSize === "small") {
            printer.setTextNormal();
          } else if (textOptions?.fontSize === "normal") {
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
          } else if (textOptions?.fontSize === "large") {
            printer.setTextQuadArea();
          } else if (textOptions?.fontSize === "xlarge") {
            printer.setTextQuadArea();
            printer.bold(true); // Extra emphasis
          }

          // Satır aralığı ayarı (ESC/POS raw command)
          const lineSpacing = textOptions?.lineSpacing || 30;
          printer.raw(Buffer.from([0x1b, 0x33, lineSpacing])); // ESC 3 n

          // Sol kenar boşluğu ekle
          const leftPadding = " ".repeat(leftMarginChars);
          
          // Metni satır satır yazdır
          const lines = textData.split("\n");
          for (const line of lines) {
            printer.println(leftPadding + line);
          }

          // Ayarları sıfırla
          printer.setTextNormal();
          printer.bold(false);
          printer.underline(false);
          printer.alignLeft();
          printer.setTypeFontA();
          printer.raw(Buffer.from([0x1b, 0x32])); // ESC 2 - Varsayılan satır aralığı

          // Alt boşluk
          const bottomSpacing = textOptions?.bottomSpacing || 3;
          for (let i = 0; i < bottomSpacing; i++) {
            printer.newLine();
          }
        }

        // Kağıt ilerletme ve kesme
        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.cut();

        // Yazdır
        await printer.execute();
        
        console.log(`✅ ${portPath} yazdırma başarılı!`);
        return {
          method: "Serial/USB (ThermalPrinter)",
          details: portPath,
          success: true,
        };
      } catch (error: any) {
        console.log(`❌ ${portPath} yazdırma hatası: ${error.message}`);
        continue;
      }
    }

    return {
      method: "Serial/USB",
      details: "Hiçbir port çalışmadı",
      success: false,
      error: "Tüm portlar denendi, hiçbiri çalışmadı",
    };
  } catch (error: any) {
    return {
      method: "Serial/USB",
      details: "SerialPort yüklenemedi",
      success: false,
      error: error.message,
    };
  }
}

// ==========================================
// NETWORK - Ethernet Communication (Priority 2)
// node-thermal-printer kütüphanesi ile güvenli network yazdırma
// ==========================================
async function tryNetwork(
  imageData: string | null,
  textData: string,
  textOptions?: TextOptions
): Promise<PrintAttempt> {
  const ips = ["192.168.2.211", "192.168.1.100", "192.168.0.100"];
  const ports = [9100, 9101, 9102];

  const printerLib = await getThermalPrinter();
  if (!printerLib) {
    return {
      method: "Network",
      details: "ThermalPrinter kütüphanesi yüklenemedi",
      success: false,
      error: "node-thermal-printer paketi bulunamadı",
    };
  }

  const { ThermalPrinter, PrinterTypes } = printerLib;

  for (const ip of ips) {
    for (const port of ports) {
      try {
        console.log(`🌐 Network deneniyor: ${ip}:${port}`);

        // ThermalPrinter network yapılandırması
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: `tcp://${ip}:${port}`,
          characterSet: "PC857_TURKISH" as any,
          removeSpecialCharacters: false,
          lineCharacter: "-",
          options: {
            timeout: 5000,
          },
        });

        // Bağlantı testi
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
          console.log(`❌ ${ip}:${port} bağlantı başarısız`);
          continue;
        }

        console.log(`✅ ${ip}:${port} bağlantı başarılı`);

        // Yazıcıyı başlat
        printer.clear();

        // Görsel işleme
        if (imageData) {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");

          const processedImage = await sharp(imageBuffer)
            .resize(576, null, {
              fit: "inside",
              withoutEnlargement: false,
              kernel: sharp.kernel.lanczos3,
            })
            .grayscale()
            .normalise()
            .threshold(128, { greyscale: false })
            .png()
            .toBuffer();

          const base64Image = processedImage.toString("base64");
          await printer.printImageBuffer(Buffer.from(base64Image, "base64"));
          printer.newLine();
        }

        // Metin yazdırma (Serial ile aynı mantık)
        if (textData && textData.trim().length > 0) {
          const topSpacing = textOptions?.topSpacing || 2;
          for (let i = 0; i < topSpacing; i++) {
            printer.newLine();
          }

          const leftMargin = textOptions?.leftMargin || 0;
          const leftMarginChars = Math.floor(leftMargin / 12);

          if (textOptions?.fontType === "B") {
            printer.setTypeFontB();
          } else {
            printer.setTypeFontA();
          }

          if (textOptions?.alignment === "center") {
            printer.alignCenter();
          } else if (textOptions?.alignment === "right") {
            printer.alignRight();
          } else {
            printer.alignLeft();
          }

          if (textOptions?.bold) {
            printer.bold(true);
          }

          if (textOptions?.underline) {
            printer.underline(true);
          }

          if (textOptions?.fontSize === "small") {
            printer.setTextNormal();
          } else if (textOptions?.fontSize === "normal") {
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
          } else if (textOptions?.fontSize === "large") {
            printer.setTextQuadArea();
          } else if (textOptions?.fontSize === "xlarge") {
            printer.setTextQuadArea();
            printer.bold(true);
          }

          const lineSpacing = textOptions?.lineSpacing || 30;
          printer.raw(Buffer.from([0x1b, 0x33, lineSpacing]));

          const leftPadding = " ".repeat(leftMarginChars);
          const lines = textData.split("\n");
          for (const line of lines) {
            printer.println(leftPadding + line);
          }

          printer.setTextNormal();
          printer.bold(false);
          printer.underline(false);
          printer.alignLeft();
          printer.setTypeFontA();
          printer.raw(Buffer.from([0x1b, 0x32]));

          const bottomSpacing = textOptions?.bottomSpacing || 3;
          for (let i = 0; i < bottomSpacing; i++) {
            printer.newLine();
          }
        }

        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.cut();

        await printer.execute();

        console.log(`✅ Network ${ip}:${port} yazdırma başarılı!`);
        return {
          method: "Network (ThermalPrinter)",
          details: `${ip}:${port}`,
          success: true,
        };
      } catch (error: any) {
        console.log(`❌ Network ${ip}:${port} hatası: ${error.message}`);
        continue;
      }
    }
  }

  return {
    method: "Network",
    details: "Hiçbir network adresi çalışmadı",
    success: false,
    error: "Tüm network adresleri denendi",
  };
}

// ==========================================
// API ENDPOINT - Auto Print Handler
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const { imageData, textData, textOptions } = await request.json();

    console.log("========================================");
    console.log("🤖 OTOMATİK YAZDIRMA - KP-302 Yazıcı");
    console.log("Görsel:", !!imageData);
    console.log("Metin:", !!textData);
    if (textOptions) {
      console.log("Metin Formatı:", {
        fontSize: textOptions.fontSize || "normal",
        fontType: textOptions.fontType || "A",
        alignment: textOptions.alignment || "left",
        bold: textOptions.bold || false,
        underline: textOptions.underline || false,
        lineSpacing: textOptions.lineSpacing || 30,
        leftMargin: textOptions.leftMargin || 0,
        topSpacing: textOptions.topSpacing || 2,
        bottomSpacing: textOptions.bottomSpacing || 3,
      });
    }
    console.log("Öncelik: 1) COM Port  2) Ethernet");
    console.log("Kütüphane: node-thermal-printer (Güvenli ESC/POS)");
    console.log("========================================");

    const attempts: PrintAttempt[] = [];

    // ==========================================
    // ÖNCELİK 1: COM PORT (Serial) - TEK YÖNTEM
    // ==========================================
    console.log("\n🔌 ÖNCELİK 1: COM PORT BAĞLANTISI");
    console.log("========================================");

    const serialResult = await trySerialPorts(imageData, textData, textOptions);
    attempts.push(serialResult);
    if (serialResult.success) {
      console.log("✅ COM PORT BAĞLANTISI BAŞARILI!");
      console.log(`   Port: ${serialResult.details}`);
      return NextResponse.json({
        success: true,
        message: `✅ COM Port üzerinden yazdırıldı: ${serialResult.details}`,
        method: serialResult.method,
        details: serialResult.details,
        connectionType: "COM Port",
        priority: 1,
        attempts,
      });
    }

    console.log("\n❌ COM PORT MÜSAİT DEĞİL");

    // ==========================================
    // ÖNCELİK 2: ETHERNET BAĞLANTISI
    // ==========================================
    console.log("\n🌐 ÖNCELİK 2: ETHERNET BAĞLANTISI");
    console.log("========================================");

    const networkResult = await tryNetwork(imageData, textData, textOptions);
    attempts.push(networkResult);
    if (networkResult.success) {
      console.log("✅ ETHERNET BAĞLANTISI BAŞARILI!");
      console.log(`   Adres: ${networkResult.details}`);
      return NextResponse.json({
        success: true,
        message: `✅ Ethernet üzerinden yazdırıldı: ${networkResult.details}`,
        method: networkResult.method,
        details: networkResult.details,
        connectionType: "Ethernet",
        priority: 2,
        attempts,
      });
    }

    console.log("\n❌ ETHERNET BAĞLANTISI MÜSAİT DEĞİL");

    // ==========================================
    // YAZDIRMA BAŞARISIZ
    // ==========================================
    console.log("\n========================================");
    console.log("❌ YAZDIRMA BAŞARISIZ");
    console.log("========================================");
    console.log("\nDenenen Yöntemler:");
    attempts.forEach((attempt, index) => {
      const status = attempt.success ? "✅" : "❌";
      console.log(`  ${index + 1}. ${status} ${attempt.method}`);
      console.log(`     ${attempt.details}`);
      if (attempt.error) console.log(`     Hata: ${attempt.error}`);
    });

    return NextResponse.json({
      success: false,
      error: "Yazıcı bulunamadı - COM Port ve Ethernet bağlantısı müsait değil",
      attempts,
      troubleshooting: {
        comPort: "USB kablosu takılı mı? Cihaz Yöneticisi'nde COM portu görünüyor mu?",
        ethernet: "Network kablosu bağlı mı? IP adresi doğru mu? (192.168.2.211)",
      },
    });
  } catch (error: any) {
    console.error("========================================");
    console.error("❌ YAZDIRMA HATASI");
    console.error("Hata:", error.message);
    console.error("Stack:", error.stack);
    console.error("========================================");

    return NextResponse.json({
      success: false,
      error: error.message || "Bilinmeyen hata",
    });
  }
}
