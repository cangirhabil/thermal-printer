import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, PrintRequest } from "@/types/printer";

// API Route yapılandırması
export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
import os from "os";

// Dinamik import fonksiyonları
async function getThermalPrinter() {
  try {
    const { ThermalPrinter, PrinterTypes } = await import(
      "node-thermal-printer"
    );
    return { ThermalPrinter, PrinterTypes };
  } catch (error) {
    console.error("ThermalPrinter yüklenemedi:", error);
    return null;
  }
}

async function getSharp() {
  try {
    const sharp = (await import("sharp")).default;
    return sharp;
  } catch (error) {
    console.error("Sharp yüklenemedi:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PrintRequest = await request.json();
    const { imageData, settings } = body;

    // Kütüphaneleri yükle
    const printerLib = await getThermalPrinter();
    const sharp = await getSharp();

    if (!printerLib) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Yazıcı kütüphanesi yüklenemedi. npm install çalıştırın.",
      });
    }

    if (!sharp) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Görsel işleme kütüphanesi yüklenemedi.",
      });
    }

    const { ThermalPrinter, PrinterTypes } = printerLib;

    // KP-302H Yazıcı yapılandırması
    // KP-302H: 80mm termal yazıcı, ESC/POS protokolü
    // Paper width: 80mm ±0.5mm
    // Printing width: 72mm (576 dots)
    // Resolution: 203 DPI (8 dots/mm)
    let printerConfig: any = {
      type: PrinterTypes.EPSON, // KP-302H ESC/POS uyumlu
      interface: "",
      width: 48, // 80mm = 576 dots ÷ 12 = 48 karakter/satır
      characterSet: "PC857_TURKISH", // Türkçe karakter desteği (Code Page 857)
      removeSpecialCharacters: false,
      lineCharacter: "=",
      breakLine: true,
      options: {
        timeout: 10000,
      },
    };

    // Bağlantı tipine göre yapılandırma
    switch (settings.connectionType) {
      case "serial":
      case "usb":
        if (!settings.serialPort) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: "Serial/USB port seçilmedi",
          });
        }
        printerConfig.interface = formatInterface(settings.serialPort);
        printerConfig.options = {
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: "none",
          rtscts: true, // Hardware Flow Control AKTIF
          xon: false,
          xoff: false,
          xany: false,
        };
        break;

      case "network":
        if (!settings.networkIp) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: "IP adresi girilmedi",
          });
        }
        printerConfig.interface = `tcp://${settings.networkIp}:${
          settings.networkPort || 9100
        }`;
        printerConfig.options = {
          timeout: 10000, // 10 saniye timeout
        };
        break;

      case "windows-printer":
        if (!settings.windowsPrinterName) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: "Windows yazıcı adı girilmedi",
          });
        }
        printerConfig.interface = `printer:${settings.windowsPrinterName}`;
        break;

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: "Geçersiz bağlantı tipi",
        });
    }

    // Yazıcı örneği oluştur
    const printer = new ThermalPrinter(printerConfig);

    // Base64 görselini buffer'a çevir
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // KP-302H için görsel işleme
    // Çözünürlük: 203 DPI (8 dots/mm)
    // Yazdırma genişliği: 72mm = 576 dots
    // Optimal görsel: 576x[yükseklik] piksel, siyah-beyaz
    console.log("Görsel işleniyor...");
    const processedImage = await sharp(imageBuffer)
      .resize(576, null, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3, // Daha yumuşak, kaliteli kenarlar
      })
      .grayscale() // Gri tonlama
      .normalise() // Kontrast artırma ve normalleştirme
      .threshold(128, { greyscale: false }) // Siyah-beyaz dönüşüm (termal yazıcı için önemli)
      .png({
        // PNG formatında kaydet
        compressionLevel: 0, // Sıkıştırma yok (hız için)
        palette: true, // Palet kullan
      })
      .toBuffer();

    console.log("✓ Görsel işlendi, boyut:", processedImage.length, "bytes");

    // Yazdırma işlemi
    try {
      console.log("========================================");
      console.log("YAZDIRMA İŞLEMİ BAŞLADI");
      console.log("========================================");
      console.log("Yazıcı tipi:", printerConfig.type);
      console.log("Bağlantı interface:", printerConfig.interface);
      console.log("Bağlantı tipi:", settings.connectionType);
      console.log("Görsel boyutu:", processedImage.length, "bytes");
      console.log("----------------------------------------");

      printer.alignCenter();
      console.log("✓ Hizalama ayarlandı");

      // printImageBuffer kullan (buffer'ı direkt kabul eder)
      await printer.printImageBuffer(processedImage);
      console.log("✓ Görsel buffer'a yazıldı");

      printer.cut();
      console.log("✓ Kesme komutu eklendi");

      console.log("Yazıcıya gönderiliyor...");
      await printer.execute();
      console.log("✓ Komutlar yazıcıya gönderildi");

      console.log("========================================");
      console.log("YAZDIRMA BAŞARILI");
      console.log("========================================");

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "Yazdırma başarılı" },
      });
    } catch (printError: any) {
      console.error("========================================");
      console.error("YAZDIRMA HATASI - DETAYLI LOG");
      console.error("========================================");
      console.error("Hata mesajı:", printError.message);
      console.error("Hata stack:", printError.stack);
      console.error("Hata kodu:", printError.code);
      console.error("Hata errno:", printError.errno);
      console.error("Hata syscall:", printError.syscall);
      console.error("Yazıcı interface:", printerConfig.interface);
      console.error("Bağlantı tipi:", settings.connectionType);
      console.error(
        "Tam hata objesi:",
        JSON.stringify(printError, Object.getOwnPropertyNames(printError), 2)
      );
      console.error("========================================");
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Yazdırma hatası: ${printError.message}`,
      });
    }
  } catch (error: any) {
    console.error("========================================");
    console.error("API HATASI - DETAYLI LOG");
    console.error("========================================");
    console.error("Hata mesajı:", error.message);
    console.error("Hata stack:", error.stack);
    console.error("Hata tipi:", error.constructor.name);
    console.error(
      "Tam hata objesi:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("Tam hata objesi:", safeStringifyError(error));
    console.error("========================================");
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || "Bilinmeyen bir hata oluştu",
    });
  }
}

function formatInterface(port: string): string {
  let cleanedPort = port.trim();

  if (!cleanedPort) {
    return port;
  }

  const platform = os.platform();

  if (cleanedPort.startsWith("tcp://") || cleanedPort.startsWith("printer:")) {
    return cleanedPort;
  }

  if (platform === "win32") {
    const serialMatch = cleanedPort.match(/^COM\d+$/i);
    if (serialMatch) {
      cleanedPort = `\\\\.\\${cleanedPort}`;
    }
  }

  return cleanedPort;
}

function safeStringifyError(error: any): string {
  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
  } catch (stringifyError) {
    return `Hata string'e dönüştürülemedi: ${String(stringifyError)}`;
  }
}
