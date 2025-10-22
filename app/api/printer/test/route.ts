import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, PrinterSettings } from "@/types/printer";
import os from "os";

async function getThermalPrinter() {
  try {
    const { ThermalPrinter, PrinterTypes } = await import(
      "node-thermal-printer"
    );
    return { ThermalPrinter, PrinterTypes };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: PrinterSettings = await request.json();

    const printerLib = await getThermalPrinter();
    if (!printerLib) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Yazıcı kütüphanesi yüklenemedi",
      });
    }

    const { ThermalPrinter, PrinterTypes } = printerLib;

    let printerConfig: any = {
      type: PrinterTypes.EPSON,
      interface: "",
      width: 48,
      characterSet: "PC857_TURKISH",
      removeSpecialCharacters: false,
    };

    switch (settings.connectionType) {
      case "serial":
      case "usb":
        if (!settings.serialPort) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: "Serial/USB port seçilmedi",
          });
        }
        // Windows için doğrudan port erişimi
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
    }

    try {
      console.log("========================================");
      console.log("YAZICI BAĞLANTI TESTİ BAŞLADI");
      console.log("========================================");
      console.log("Bağlantı tipi:", settings.connectionType);
      console.log("Interface:", printerConfig.interface);
      console.log("Port/IP:", settings.serialPort || settings.networkIp);
      console.log("Config:", JSON.stringify(printerConfig, null, 2));
      console.log("----------------------------------------");

      const printer = new ThermalPrinter(printerConfig);
      console.log("✓ Printer nesnesi oluşturuldu");

      console.log(
        "Yazıcı bağlantısı test ediliyor (direkt yazdırma denemesi)..."
      );

      // Basit test yazdırması
      printer.println("=========================");
      printer.println("TEST YAZDIRMA");
      printer.println("=========================");
      printer.println(`Tarih: ${new Date().toLocaleString("tr-TR")}`);
      printer.println(`Tip: ${settings.connectionType.toUpperCase()}`);
      printer.println(`Port: ${settings.serialPort || settings.networkIp}`);
      printer.println("=========================");
      printer.println("Yazici calisiyoR!");
      printer.println("=========================");
      printer.newLine();
      printer.newLine();
      printer.cut();

      console.log("Test yazdırma komutu gönderiliyor...");
      await printer.execute();
      console.log("✓ Test yazdırma başarılı");

      console.log("========================================");
      console.log("TEST BAŞARILI!");
      console.log("========================================");

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "✓ Bağlantı ve test yazdırma başarılı!" },
      });
    } catch (error: any) {
      console.error("========================================");
      console.error("TEST HATASI:");
      console.error("========================================");
      console.error("Hata mesajı:", error.message);
      console.error("Hata kodu:", error.code);
      console.error("Hata tipi:", error.constructor.name);
      console.error("Stack:", error.stack);
      console.error("========================================");

      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Bağlantı hatası: ${error.message}`,
      });
    }
  } catch (error: any) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error.message || "Test başarısız",
    });
  }
}

function formatInterface(port: string): string {
  let cleanedPort = port.trim();

  if (!cleanedPort) {
    return port;
  }

  if (cleanedPort.startsWith("tcp://") || cleanedPort.startsWith("printer:")) {
    return cleanedPort;
  }

  const platform = os.platform();

  if (platform === "win32") {
    const serialMatch = cleanedPort.match(/^COM\d+$/i);
    if (serialMatch && !cleanedPort.startsWith("\\\\.\\")) {
      cleanedPort = `\\\\.\\${cleanedPort}`;
    }
  }

  return cleanedPort;
}
