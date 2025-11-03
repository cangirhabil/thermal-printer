import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as net from "net";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import sharp from "sharp";

const execAsync = promisify(exec);

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
// Floyd-Steinberg Dithering Algorithm
// Gri tonları siyah-beyaz nokta patternlerine dönüştürür
// ==========================================
function applyFloydSteinbergDithering(
  imageData: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const data = new Uint8Array(imageData);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = data[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      data[idx] = newPixel;

      const quantError = oldPixel - newPixel;

      // Hatayı komşu pixellere dağıt
      if (x + 1 < width) {
        data[idx + 1] += (quantError * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          data[idx + width - 1] += (quantError * 3) / 16;
        }
        data[idx + width] += (quantError * 5) / 16;
        if (x + 1 < width) {
          data[idx + width + 1] += (quantError * 1) / 16;
        }
      }
    }
  }

  return data;
}

// ==========================================
// COM PORT - Serial Communication (Priority 1)
// PowerShell ile güvenli yazdırma
// ==========================================
async function trySerialPorts(
  imageData: string | null,
  textData: string,
  textOptions?: TextOptions
): Promise<PrintAttempt> {
  try {
    const { SerialPort } = await import("serialport");
    const ports = await SerialPort.list();

    console.log(`🔍 ${ports.length} serial port bulundu`);

    // COM1'i filtrele (genellikle mouse/klavye)
    const validPorts = ports.filter(p => p.path.toLowerCase() !== 'com1');
    console.log(`✅ ${validPorts.length} geçerli port (COM1 atlandı)`);

    // COM3'ü önceliklendir
    const sortedPorts = validPorts.sort((a, b) => {
      if (a.path.toLowerCase() === 'com3') return -1;
      if (b.path.toLowerCase() === 'com3') return 1;
      return 0;
    });

    // Her portu dene
    for (const portInfo of sortedPorts) {
      const portPath = portInfo.path;
      console.log(`🔌 Port deneniyor: ${portPath}${portPath.toLowerCase() === 'com3' ? ' (Öncelikli)' : ''}`);

      try {
        // Görsel işleme
        let bitmapBuffer: Buffer | null = null;
        let imageWidth = 0;
        let imageHeight = 0;

        if (imageData) {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");

          // Önce grayscale ve resize
          const processedImage = await sharp(imageBuffer)
            .resize(576, null, {
              fit: "inside",
              withoutEnlargement: false,
              kernel: sharp.kernel.lanczos3,
            })
            .grayscale()
            .normalise()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const { data: rawData, info } = processedImage;
          const width = Math.min(info.width, 576);
          const height = info.height;

          // Floyd-Steinberg dithering uygula
          const ditheredData = applyFloydSteinbergDithering(
            new Uint8Array(rawData),
            width,
            height
          );

          const bytesPerLine = Math.ceil(width / 8);
          bitmapBuffer = Buffer.alloc(bytesPerLine * height);
          bitmapBuffer.fill(0);

          // Dithered veriyi bitmap'e dönüştür
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const pixelValue = ditheredData[idx];

              if (pixelValue < 128) {
                const byteIndex = y * bytesPerLine + Math.floor(x / 8);
                const bitIndex = 7 - (x % 8);
                bitmapBuffer[byteIndex] |= 1 << bitIndex;
              }
            }
          }

          imageWidth = width;
          imageHeight = height;
        }

        // PowerShell script oluştur
        const bitmapPath = path.join(os.tmpdir(), `thermal-${Date.now()}.bin`);
        const scriptPath = path.join(os.tmpdir(), `thermal-${Date.now()}.ps1`);

        if (bitmapBuffer) {
          fs.writeFileSync(bitmapPath, Uint8Array.from(bitmapBuffer));
        }

        const escInit = "1B 40"; // ESC @
        const cutPaper = "1D 56 00"; // GS V 0

        let imageCommands = "";
        if (bitmapBuffer && imageWidth > 0 && imageHeight > 0) {
          const widthBytes = Math.ceil(imageWidth / 8);
          const xL = widthBytes & 0xff;
          const xH = (widthBytes >> 8) & 0xff;
          const yL = imageHeight & 0xff;
          const yH = (imageHeight >> 8) & 0xff;

          imageCommands = `
  # Görsel yazdır
  Write-Host "Gorsel yazdiriliyor: ${imageWidth}x${imageHeight}"
  $imageCommand = [byte[]](0x1D, 0x76, 0x30, 0x00, ${xL}, ${xH}, ${yL}, ${yH})
  $port.Write($imageCommand, 0, $imageCommand.Length)
  Start-Sleep -Milliseconds 100
  
  $bitmapData = [System.IO.File]::ReadAllBytes("${bitmapPath.replace(/\\/g, "\\\\")}")
  $port.Write($bitmapData, 0, $bitmapData.Length)
  Start-Sleep -Milliseconds 200
`;
        }

        let textCommands = "";
        if (textData && textData.trim().length > 0) {
          const escapedText = textData.replace(/"/g, '`"').replace(/\$/g, "`$").replace(/\r/g, "");

          // Font tipi (ESC M n)
          const fontCode = textOptions?.fontType === "B" ? "0x01" : "0x00";

          // Yazı boyutu (GS ! n)
          let sizeCode = "0x11"; // Default: 2x2
          if (textOptions?.fontSize === "small") sizeCode = "0x00";
          else if (textOptions?.fontSize === "normal") sizeCode = "0x11";
          else if (textOptions?.fontSize === "large") sizeCode = "0x22";
          else if (textOptions?.fontSize === "xlarge") sizeCode = "0x33";

          // Hizalama (ESC a n)
          let alignCode = "0x00";
          if (textOptions?.alignment === "center") alignCode = "0x01";
          else if (textOptions?.alignment === "right") alignCode = "0x02";

          // Kalın yazı (ESC E n)
          const boldCode = textOptions?.bold ? "0x01" : "0x00";

          // Altı çizili (ESC - n)
          const underlineCode = textOptions?.underline ? "0x01" : "0x00";

          // Satır aralığı (ESC 3 n)
          const lineSpacing = textOptions?.lineSpacing || 30;
          const lineSpacingHex = `0x${lineSpacing.toString(16).padStart(2, "0")}`;

          // Sol kenar (GS L nL nH)
          const leftMargin = textOptions?.leftMargin || 0;
          const leftMarginL = `0x${(leftMargin & 0xff).toString(16).padStart(2, "0")}`;
          const leftMarginH = `0x${((leftMargin >> 8) & 0xff).toString(16).padStart(2, "0")}`;

          // Üst boşluk
          const topSpacing = textOptions?.topSpacing || 2;

          // Alt boşluk
          const bottomSpacing = textOptions?.bottomSpacing || 3;

          textCommands = `
  # Metin yazdır
  # Üst boşluk
  $topSpaceBytes = [byte[]](0x1B, 0x64, ${topSpacing})
  $port.Write($topSpaceBytes, 0, $topSpaceBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Sol kenar
  $leftMarginBytes = [byte[]](0x1D, 0x4C, ${leftMarginL}, ${leftMarginH})
  $port.Write($leftMarginBytes, 0, $leftMarginBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Satır aralığı
  $lineSpacingBytes = [byte[]](0x1B, 0x33, ${lineSpacingHex})
  $port.Write($lineSpacingBytes, 0, $lineSpacingBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Font tipi
  $fontBytes = [byte[]](0x1B, 0x4D, ${fontCode})
  $port.Write($fontBytes, 0, $fontBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Hizalama
  $alignBytes = [byte[]](0x1B, 0x61, ${alignCode})
  $port.Write($alignBytes, 0, $alignBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Kalın yazı
  $boldBytes = [byte[]](0x1B, 0x45, ${boldCode})
  $port.Write($boldBytes, 0, $boldBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Altı çizili
  $underlineBytes = [byte[]](0x1B, 0x2D, ${underlineCode})
  $port.Write($underlineBytes, 0, $underlineBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Metin boyutu
  $textSizeBytes = [byte[]](0x1D, 0x21, ${sizeCode})
  $port.Write($textSizeBytes, 0, $textSizeBytes.Length)
  Start-Sleep -Milliseconds 50
  
  # Metni yazdır
  $textBytes = [System.Text.Encoding]::GetEncoding(857).GetBytes("${escapedText}\n")
  $port.Write($textBytes, 0, $textBytes.Length)
  Start-Sleep -Milliseconds 100
  
  # Ayarları sıfırla
  $port.Write([byte[]](0x1D, 0x21, 0x00), 0, 3)
  $port.Write([byte[]](0x1B, 0x45, 0x00), 0, 3)
  $port.Write([byte[]](0x1B, 0x2D, 0x00), 0, 3)
  $port.Write([byte[]](0x1B, 0x61, 0x00), 0, 3)
  $port.Write([byte[]](0x1B, 0x4D, 0x00), 0, 3)
  $port.Write([byte[]](0x1B, 0x32), 0, 2)
  $port.Write([byte[]](0x1D, 0x4C, 0x00, 0x00), 0, 4)
  Start-Sleep -Milliseconds 50
  
  # Alt boşluk
  $bottomSpaceBytes = [byte[]](0x1B, 0x64, ${bottomSpacing})
  $port.Write($bottomSpaceBytes, 0, $bottomSpaceBytes.Length)
  Start-Sleep -Milliseconds 100
`;
        }

        const psScript = `
$ErrorActionPreference = "Stop"

try {
    $port = New-Object System.IO.Ports.SerialPort("${portPath}", 9600, "None", 8, "One")
    $port.Handshake = [System.IO.Ports.Handshake]::RequestToSend
    $port.ReadTimeout = 1000
    $port.WriteTimeout = 1000
    
    $port.Open()
    
    if (-not $port.IsOpen) {
        Write-Error "Port açılamadı"
        exit 1
    }
    
    # Initialize
    $initBytes = [byte[]](${escInit.split(" ").map(b => `0x${b}`).join(", ")})
    $port.Write($initBytes, 0, $initBytes.Length)
    Start-Sleep -Milliseconds 50
    ${imageCommands}${textCommands}
    # Kağıt ilerletme
    $feedBytes = [byte[]](0x1B, 0x64, 0x05)
    $port.Write($feedBytes, 0, $feedBytes.Length)
    Start-Sleep -Milliseconds 200
    
    # Cut paper
    $cutBytes = [byte[]](${cutPaper.split(" ").map(b => `0x${b}`).join(", ")})
    $port.Write($cutBytes, 0, $cutBytes.Length)
    Start-Sleep -Milliseconds 300
    
    # Ekstra feed
    $finalFeedBytes = [byte[]](0x1B, 0x64, 0x03)
    $port.Write($finalFeedBytes, 0, $finalFeedBytes.Length)
    Start-Sleep -Milliseconds 200
    
    $port.Close()
    Write-Output "SUCCESS"
    exit 0
} catch {
    Write-Error $_.Exception.Message
    if ($port -and $port.IsOpen) {
        $port.Close()
    }
    exit 1
}
`;

        fs.writeFileSync(scriptPath, psScript, "utf8");

        const { stdout } = await execAsync(
          `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
          { timeout: 10000 }
        );

        // Cleanup
        try { fs.unlinkSync(bitmapPath); } catch {}
        try { fs.unlinkSync(scriptPath); } catch {}

        if (stdout.includes("SUCCESS")) {
          console.log(`✅ ${portPath} başarılı!`);
          return {
            method: "Serial/USB (PowerShell)",
            details: portPath,
            success: true,
          };
        }
      } catch (error: any) {
        console.log(`❌ ${portPath} başarısız: ${error.message}`);
        continue;
      }
    }

    return {
      method: "Serial/USB",
      details: "Hiçbir port çalışmadı",
      success: false,
      error: "Tüm portlar denendi",
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
// Raw TCP socket ile yazdırma
// ==========================================
async function tryNetwork(
  imageData: string | null,
  textData: string,
  textOptions?: TextOptions
): Promise<PrintAttempt> {
  const ips = ["192.168.2.211", "192.168.1.100", "192.168.0.100"];
  const ports = [9100, 9101, 9102];

  for (const ip of ips) {
    for (const port of ports) {
      try {
        console.log(`🌐 Network deneniyor: ${ip}:${port}`);

        const socket = new net.Socket();
        await new Promise<void>((resolve, reject) => {
          socket.setTimeout(2000);
          socket.on("connect", () => resolve());
          socket.on("timeout", () => reject(new Error("Timeout")));
          socket.on("error", (err) => reject(err));
          socket.connect(port, ip);
        });

        // Bağlantı başarılı, yazdır
        const escInit = new Uint8Array([0x1b, 0x40]); // ESC @
        socket.write(escInit);

        // Görsel
        if (imageData) {
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");

          // Önce grayscale ve resize
          const processedImage = await sharp(imageBuffer)
            .resize(576, null, {
              fit: "inside",
              withoutEnlargement: false,
              kernel: sharp.kernel.lanczos3,
            })
            .grayscale()
            .normalise()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const { data: rawData, info } = processedImage;
          const width = Math.min(info.width, 576);
          const height = info.height;

          // Floyd-Steinberg dithering uygula
          const ditheredData = applyFloydSteinbergDithering(
            new Uint8Array(rawData),
            width,
            height
          );

          const bytesPerLine = Math.ceil(width / 8);
          const bitmapBuffer = Buffer.alloc(bytesPerLine * height);
          bitmapBuffer.fill(0);

          // Dithered veriyi bitmap'e dönüştür
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const pixelValue = ditheredData[idx];

              if (pixelValue < 128) {
                const byteIndex = y * bytesPerLine + Math.floor(x / 8);
                const bitIndex = 7 - (x % 8);
                bitmapBuffer[byteIndex] |= 1 << bitIndex;
              }
            }
          }

          const widthBytes = Math.ceil(width / 8);
          const xL = widthBytes & 0xff;
          const xH = (widthBytes >> 8) & 0xff;
          const yL = height & 0xff;
          const yH = (height >> 8) & 0xff;

          const imageCommand = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
          socket.write(imageCommand);
          socket.write(Uint8Array.from(bitmapBuffer));
        }

        // Metin
        if (textData && textData.trim().length > 0) {
          // Üst boşluk
          const topSpacing = textOptions?.topSpacing || 2;
          socket.write(new Uint8Array([0x1b, 0x64, topSpacing]));

          // Sol kenar
          const leftMargin = textOptions?.leftMargin || 0;
          const leftMarginL = leftMargin & 0xff;
          const leftMarginH = (leftMargin >> 8) & 0xff;
          socket.write(new Uint8Array([0x1d, 0x4c, leftMarginL, leftMarginH]));

          // Satır aralığı
          const lineSpacing = textOptions?.lineSpacing || 30;
          socket.write(new Uint8Array([0x1b, 0x33, lineSpacing]));

          // Font tipi
          const fontCode = textOptions?.fontType === "B" ? 0x01 : 0x00;
          socket.write(new Uint8Array([0x1b, 0x4d, fontCode]));

          // Hizalama
          let alignCode = 0x00;
          if (textOptions?.alignment === "center") alignCode = 0x01;
          else if (textOptions?.alignment === "right") alignCode = 0x02;
          socket.write(new Uint8Array([0x1b, 0x61, alignCode]));

          // Kalın
          const boldCode = textOptions?.bold ? 0x01 : 0x00;
          socket.write(new Uint8Array([0x1b, 0x45, boldCode]));

          // Altı çizili
          const underlineCode = textOptions?.underline ? 0x01 : 0x00;
          socket.write(new Uint8Array([0x1b, 0x2d, underlineCode]));

          // Boyut
          let sizeCode = 0x11;
          if (textOptions?.fontSize === "small") sizeCode = 0x00;
          else if (textOptions?.fontSize === "normal") sizeCode = 0x11;
          else if (textOptions?.fontSize === "large") sizeCode = 0x22;
          else if (textOptions?.fontSize === "xlarge") sizeCode = 0x33;
          socket.write(new Uint8Array([0x1d, 0x21, sizeCode]));

          // Metin
          const textEncoder = new TextEncoder();
          socket.write(textEncoder.encode(textData + "\n"));

          // Sıfırla
          socket.write(new Uint8Array([0x1d, 0x21, 0x00]));
          socket.write(new Uint8Array([0x1b, 0x45, 0x00]));
          socket.write(new Uint8Array([0x1b, 0x2d, 0x00]));
          socket.write(new Uint8Array([0x1b, 0x61, 0x00]));
          socket.write(new Uint8Array([0x1b, 0x4d, 0x00]));
          socket.write(new Uint8Array([0x1b, 0x32]));
          socket.write(new Uint8Array([0x1d, 0x4c, 0x00, 0x00]));

          // Alt boşluk
          const bottomSpacing = textOptions?.bottomSpacing || 3;
          socket.write(new Uint8Array([0x1b, 0x64, bottomSpacing]));
        }

        // Kağıt ilerlet ve kes
        socket.write(new Uint8Array([0x1b, 0x64, 0x05]));
        socket.write(new Uint8Array([0x1d, 0x56, 0x00]));
        socket.write(new Uint8Array([0x1b, 0x64, 0x03]));

        socket.end();

        console.log(`✅ Network ${ip}:${port} başarılı!`);
        return {
          method: "Network (TCP Socket)",
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
    console.log("Öncelik: 1) COM Port (COM3)  2) Serial (Diğer)  3) Network (LAN)");
    console.log("Kütüphane: PowerShell + Raw ESC/POS + TCP Socket");
    console.log("========================================");

    const attempts: PrintAttempt[] = [];

    // ==========================================
    // ÖNCELİK 1: COM PORT (Serial) - COM3 ÖNCELİKLİ
    // ==========================================
    console.log("\n🔌 ÖNCELİK 1: COM PORT BAĞLANTISI (COM3 öncelikli)");
    console.log("========================================");

    const serialResult = await trySerialPorts(imageData, textData, textOptions);
    attempts.push(serialResult);
    if (serialResult.success) {
      console.log("✅ COM/SERIAL PORT BAĞLANTISI BAŞARILI!");
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

    console.log("\n❌ COM/SERIAL PORT MÜSAİT DEĞİL - Network (LAN) deneniyor...");

    // ==========================================
    // ÖNCELİK 2: NETWORK (LAN) BAĞLANTISI
    // ==========================================
    console.log("\n🌐 ÖNCELİK 2: NETWORK (LAN) BAĞLANTISI");
    console.log("========================================");
    // ==========================================
    console.log("\n🌐 ÖNCELİK 2: ETHERNET BAĞLANTISI");
    console.log("========================================");

    const networkResult = await tryNetwork(imageData, textData, textOptions);
    attempts.push(networkResult);
    if (networkResult.success) {
      console.log("✅ NETWORK (LAN) BAĞLANTISI BAŞARILI!");
      console.log(`   Adres: ${networkResult.details}`);
      return NextResponse.json({
        success: true,
        message: `✅ Network (LAN) üzerinden yazdırıldı: ${networkResult.details}`,
        method: networkResult.method,
        details: networkResult.details,
        connectionType: "Network",
        priority: 2,
        attempts,
      });
    }

    console.log("\n❌ NETWORK (LAN) BAĞLANTISI MÜSAİT DEĞİL");

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
      error: "Yazıcı bulunamadı - COM Port ve Network (LAN) bağlantısı müsait değil",
      attempts,
      troubleshooting: {
        comPort:
          "USB kablosu takılı mı? Cihaz Yöneticisi'nde COM portu görünüyor mu?",
        network:
          "Network kablosu bağlı mı? IP adresi doğru mu?",
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
