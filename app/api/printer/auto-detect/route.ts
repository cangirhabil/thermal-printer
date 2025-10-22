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
        priority: isUSB ? 2 : 3, // USB ikinci öncelik
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
    "192.168.2.211", // Ana yazıcı IP (LAN)
  ];

  const commonPorts = [9100]; // Port 9100

  for (const ip of commonIPs) {
    for (const port of commonPorts) {
      try {
        const isReachable = await testNetworkConnection(ip, port);
        if (isReachable) {
          return {
            method: "network",
            details: { ip, port },
            priority: 1, // Network EN YÜKSEK öncelik
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
    console.log("📋 Öncelik: 1) Network (LAN) 2) USB 3) Serial 4) Windows");

    // ÖNCELİK 1: Network kontrol et (İLK ÖNCE!)
    console.log("\n🌐 Öncelik 1: Network (192.168.2.211:9100) kontrol ediliyor...");
    const networkResult = await detectNetwork();

    if (networkResult && networkResult.available) {
      console.log(`✅ Network bağlantı bulundu: ${networkResult.details.ip}:${networkResult.details.port}`);
      return NextResponse.json({
        success: true,
        method: "network",
        bestMethod: {
          connectionType: "network",
          details: networkResult.details,
          testResult: networkResult.testResult,
        },
        allResults: networkResult ? [networkResult] : [],
        message: `Network bağlantı başarılı: ${networkResult.details.ip}:${networkResult.details.port}`,
      });
    }

    console.log("❌ Network bağlantı bulunamadı, COM/Serial portlar deneniyor...");

    // ÖNCELİK 2: Serial/COM portları kontrol et (Network yoksa)
    console.log("\n🔌 Öncelik 2: COM/Serial portlar kontrol ediliyor...");
    const serialResults = await detectSerialPorts();

    // Serial portları test et
    const testedSerialResults = await Promise.all(
      serialResults.map(async (result) => {
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

    // Başarılı serial port varsa hemen dön
    const workingSerial = testedSerialResults.find((r) => r.available);
    if (workingSerial) {
      console.log(`✅ COM/Serial bağlantı bulundu: ${workingSerial.method}`);
      return NextResponse.json({
        success: true,
        method: workingSerial.method,
        bestMethod: {
          connectionType: workingSerial.method,
          details: workingSerial.details,
          testResult: workingSerial.testResult,
        },
        allResults: testedSerialResults,
        message: `Bağlantı başarılı: ${workingSerial.method} - ${workingSerial.testResult}`,
      });
    }

    console.log(
      "❌ COM/Serial port bulunamadı, Windows yazıcılar kontrol ediliyor..."
    );

    // ÖNCELİK 3: Windows yazıcıları kontrol et (en son)
    console.log("\n🖨️ Öncelik 3: Windows yazıcılar kontrol ediliyor...");
    const windowsResults = await detectWindowsPrinters();

    const testedWindowsResults = await Promise.all(
      windowsResults.map(async (result) => {
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

    const workingWindows = testedWindowsResults.find((r) => r.available);
    if (workingWindows) {
      console.log(`✅ Windows yazıcı bulundu: ${workingWindows.details.name}`);
      return NextResponse.json({
        success: true,
        method: "windows",
        bestMethod: {
          connectionType: "windows",
          details: workingWindows.details,
          testResult: workingWindows.testResult,
        },
        allResults: testedWindowsResults,
        message: `Windows yazıcı bağlantı başarılı: ${workingWindows.details.name}`,
      });
    }

    // Tüm sonuçları birleştir (başarısız durumlar için)
    let allResults: DetectionResult[] = [
      ...testedSerialResults,
      ...(networkResult ? [networkResult] : []),
      ...testedWindowsResults,
    ];

    console.log(
      `📋 ${allResults.length} toplam bağlantı denendi, hiçbiri çalışmadı`
    );

    // Başarılı olanları filtrele ve önceliğe göre sırala
    const workingResults = allResults
      .filter((r) => r.available)
      .sort((a, b) => a.priority - b.priority);

    if (workingResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Hiçbir çalışan yazıcı bağlantısı bulunamadı",
        allResults: allResults,
      });
    }

    const bestMethod = workingResults[0];

    console.log(`✅ En iyi yöntem seçildi: ${bestMethod.method}`);
    console.log(`   Detaylar: ${JSON.stringify(bestMethod.details)}`);

    return NextResponse.json({
      success: true,
      method: bestMethod.method,
      bestMethod: {
        connectionType: bestMethod.method,
        details: bestMethod.details,
        testResult: bestMethod.testResult,
      },
      allResults: allResults,
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
