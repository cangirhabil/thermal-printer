import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as net from "net";

const execAsync = promisify(exec);

interface DetectionResult {
  method: "usb" | "serial" | "network" | "windows";
  details: any;
  priority: number;
  available: boolean;
  testResult?: string;
}

// USB/Serial portları kontrol et
async function detectSerialPorts(): Promise<DetectionResult[]> {
  try {
    const { SerialPort } = await import("serialport");
    const ports = await SerialPort.list();

    const results: DetectionResult[] = [];

    for (const port of ports) {
      // USB cihazlarını önceliklendir
      const isUSB =
        port.vendorId ||
        port.productId ||
        (port.manufacturer && port.manufacturer.toLowerCase().includes("usb"));

      results.push({
        method: isUSB ? "usb" : "serial",
        details: {
          path: port.path,
          manufacturer: port.manufacturer,
          serialNumber: port.serialNumber,
          vendorId: port.vendorId,
          productId: port.productId,
        },
        priority: isUSB ? 1 : 2, // USB öncelikli
        available: true,
      });
    }

    return results;
  } catch (error) {
    console.error("Serial port detection error:", error);
    return [];
  }
}

// Network bağlantısını test et
async function detectNetwork(): Promise<DetectionResult | null> {
  const commonIPs = [
    "192.168.2.211", // Mevcut IP
    "192.168.1.100",
    "192.168.0.100",
  ];

  const commonPorts = [9100, 9101, 9102];

  for (const ip of commonIPs) {
    for (const port of commonPorts) {
      try {
        const isReachable = await testNetworkConnection(ip, port);
        if (isReachable) {
          return {
            method: "network",
            details: { ip, port },
            priority: 3, // Network düşük öncelik
            available: true,
            testResult: "Bağlantı başarılı",
          };
        }
      } catch (error) {
        continue;
      }
    }
  }

  return null;
}

// Network bağlantısını test et (timeout ile)
function testNetworkConnection(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000; // 2 saniye timeout

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

// Windows yazıcılarını kontrol et
async function detectWindowsPrinters(): Promise<DetectionResult[]> {
  try {
    // Windows yazıcı listesini al
    const { stdout } = await execAsync(
      'powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName | ConvertTo-Json"'
    );

    const printers = JSON.parse(stdout);
    const printerArray = Array.isArray(printers) ? printers : [printers];

    return printerArray
      .filter((p: any) => p.Name) // Geçerli yazıcılar
      .map((p: any) => ({
        method: "windows" as const,
        details: {
          name: p.Name,
          driver: p.DriverName,
          port: p.PortName,
        },
        priority: 4, // Windows yazıcı en düşük öncelik
        available: true,
      }));
  } catch (error) {
    console.error("Windows printer detection error:", error);
    return [];
  }
}

// Yazıcıyı test et (basit ESC/POS komutu gönder)
async function testPrinter(
  method: string,
  details: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Serial/USB için test
    if (method === "usb" || method === "serial") {
      const { SerialPort } = await import("serialport");

      try {
        const port = new SerialPort({
          path: details.path,
          baudRate: 9600,
          autoOpen: false,
        });

        await new Promise<void>((resolve, reject) => {
          port.open((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Basit status komutu gönder (DLE EOT n)
        await new Promise<void>((resolve, reject) => {
          port.write(Buffer.from([0x10, 0x04, 0x01]), (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        port.close();

        return {
          success: true,
          message: `${method.toUpperCase()} ${details.path} - Test başarılı`,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `${method.toUpperCase()} ${details.path} - ${error.message}`,
        };
      }
    }

    // Network için basit bağlantı testi
    if (method === "network") {
      const isConnected = await testNetworkConnection(details.ip, details.port);
      return {
        success: isConnected,
        message: isConnected
          ? `Network ${details.ip}:${details.port} - Bağlantı başarılı`
          : `Network ${details.ip}:${details.port} - Bağlantı başarısız`,
      };
    }

    // Windows yazıcı için
    if (method === "windows") {
      return {
        success: true,
        message: `Windows yazıcı "${details.name}" - Kullanılabilir`,
      };
    }

    return { success: false, message: "Bilinmeyen yöntem" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Otomatik yazıcı algılama başlatılıyor...");

    // Tüm yöntemleri paralel olarak kontrol et
    const [serialResults, networkResult, windowsResults] = await Promise.all([
      detectSerialPorts(),
      detectNetwork(),
      detectWindowsPrinters(),
    ]);

    // Tüm sonuçları birleştir
    let allResults: DetectionResult[] = [
      ...serialResults,
      ...(networkResult ? [networkResult] : []),
      ...windowsResults,
    ];

    console.log(`📋 ${allResults.length} yazıcı bağlantısı bulundu`);

    // Her yöntemi test et
    const testedResults = await Promise.all(
      allResults.map(async (result) => {
        console.log(
          `🧪 Test ediliyor: ${result.method} - ${JSON.stringify(
            result.details
          )}`
        );
        const testResult = await testPrinter(result.method, result.details);
        return {
          ...result,
          testResult: testResult.message,
          available: testResult.success,
        };
      })
    );

    // Başarılı olanları filtrele ve önceliğe göre sırala
    const workingResults = testedResults
      .filter((r) => r.available)
      .sort((a, b) => a.priority - b.priority);

    if (workingResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Hiçbir çalışan yazıcı bağlantısı bulunamadı",
        allResults: testedResults,
      });
    }

    const bestMethod = workingResults[0];

    console.log(`✅ En iyi yöntem seçildi: ${bestMethod.method}`);
    console.log(`   Detaylar: ${JSON.stringify(bestMethod.details)}`);

    return NextResponse.json({
      success: true,
      bestMethod: {
        connectionType: bestMethod.method,
        details: bestMethod.details,
        testResult: bestMethod.testResult,
      },
      allResults: testedResults,
      message: `En iyi bağlantı: ${bestMethod.method} - ${bestMethod.testResult}`,
    });
  } catch (error: any) {
    console.error("❌ Otomatik algılama hatası:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Otomatik algılama başarısız",
    });
  }
}
