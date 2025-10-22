import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { imageData, textData, port } = await request.json();

    console.log("========================================");
    console.log("POWERSHELL COM PORT YAZDIRMA");
    console.log("========================================");
    console.log("Port:", port);
    console.log("Görsel var:", !!imageData);
    console.log("Metin var:", !!textData);

    let bitmapFile = "";
    let bytesPerLine = 0;
    let height = 0;
    const tempDir = os.tmpdir();

    // Görsel varsa işle
    if (imageData) {
      // Base64 görselini buffer'a çevir
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

      // Sharp ile görsel işle
      const sharp = (await import("sharp")).default;
      const processedImage = await sharp(Buffer.from(base64Data, "base64"))
        .resize({ width: 576 })
        .grayscale()
        .normalise()
        .raw()
        .toBuffer({ resolveWithObject: true });

      console.log("✓ Görsel işlendi");

      // Floyd-Steinberg dithering uygula
      const { data: rawData, info } = processedImage;
      const width = info.width;
      height = info.height;

      console.log(`✓ Bitmap oluşturuluyor: ${width}x${height}`);

      // 1-bit bitmap oluştur (GS v 0 için)
      const bytesPerLine = 72; // 576 pixels / 8 = 72 bytes
      const bitmapData: Buffer[] = [];

      for (let y = 0; y < height; y++) {
        const lineBuffer = Buffer.alloc(bytesPerLine);
        for (let x = 0; x < bytesPerLine; x++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const pixelX = x * 8 + bit;
            if (pixelX < width) {
              const idx = y * width + pixelX;
              const pixelValue = rawData[idx];
              // Basit threshold: 128'den küçükse siyah bas
              // Termal yazıcı: bit=1 = siyah, bit=0 = beyaz
              if (pixelValue < 128) {
                byte |= 1 << (7 - bit);
              }
            }
          }
          lineBuffer[x] = byte;
        }
        bitmapData.push(lineBuffer);
      }

      console.log(`✓ ${bitmapData.length} satır bitmap hazırlandı`);

      // Bitmap verisini geçici dosyaya yaz
      bitmapFile = path.join(tempDir, `thermal-bitmap-${Date.now()}.bin`);

      // Tüm satırları birleştir ve dosyaya yaz
      const fullBitmap = Buffer.concat(bitmapData);
      await fs.writeFile(bitmapFile, fullBitmap);

      console.log(`✓ Bitmap dosyaya yazıldı: ${bitmapFile}`);
    }

    // PowerShell script dosyası oluştur
    const psScriptFile = path.join(tempDir, `thermal-print-${Date.now()}.ps1`);

    // PowerShell scripti ile COM portuna yaz
    const psScript = `
$port = New-Object System.IO.Ports.SerialPort "${port}", 9600, None, 8, One
$port.Handshake = [System.IO.Ports.Handshake]::RequestToSend
$port.WriteTimeout = 5000
$port.ReadTimeout = 5000
$port.Open()

if ($port.IsOpen) {
  # ESC/POS Init
  $port.Write([byte[]]@(0x1B, 0x40), 0, 2)
  Start-Sleep -Milliseconds 200
  
  # Center align
  $port.Write([byte[]]@(0x1B, 0x61, 0x01), 0, 3)
  Start-Sleep -Milliseconds 100
  
  ${
    textData
      ? `
  # Metin yazdirma
  $text = @"
${textData}
"@
  Write-Host "Metin yazdiriliyor..."
  $port.WriteLine($text)
  $port.WriteLine("")
  $port.WriteLine("")
  Start-Sleep -Milliseconds 200
  `
      : ""
  }
  
  ${
    imageData
      ? `
  # Bitmap dosyasini oku
  $bitmapBytes = [System.IO.File]::ReadAllBytes("${bitmapFile.replace(
    /\\/g,
    "\\\\"
  )}")
  $widthBytes = ${bytesPerLine}
  $height = ${height}
  
  # GS v 0 komutu icin parametreler
  # m = 0 (normal), xL xH (genislik byte), yL yH (yukseklik)
  $xL = $widthBytes -band 0xFF
  $xH = ($widthBytes -shr 8) -band 0xFF
  $yL = $height -band 0xFF
  $yH = ($height -shr 8) -band 0xFF
  
  Write-Host "Gorsel yazdiriliyor: $widthBytes bytes x $height pixels"
  
  # GS v 0 - Print raster bit image
  $port.Write([byte[]]@(0x1D, 0x76, 0x30, 0x00, $xL, $xH, $yL, $yH), 0, 8)
  Start-Sleep -Milliseconds 100
  
  # Bitmap verisini gonder
  $port.Write($bitmapBytes, 0, $bitmapBytes.Length)
  Start-Sleep -Milliseconds 200
  `
      : ""
  }
  
  $port.WriteLine("")
  $port.WriteLine("")
  
  # Cut paper
  $port.Write([byte[]]@(0x1D, 0x56, 0x01), 0, 3)
  
  $port.Close()
  Write-Output "SUCCESS"
} else {
  Write-Error "Port acilamadi"
}
`;

    // Script'i dosyaya yaz
    await fs.writeFile(psScriptFile, psScript, "utf-8");
    console.log(`✓ PowerShell script yazıldı: ${psScriptFile}`);

    const { stdout, stderr } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`,
      { timeout: 30000 }
    );

    console.log("PowerShell stdout:", stdout);
    if (stderr) {
      console.log("PowerShell stderr:", stderr);
    }

    // Geçici dosyaları sil
    await fs.unlink(bitmapFile).catch(() => {});
    await fs.unlink(psScriptFile).catch(() => {});

    if (stderr && !stdout.includes("SUCCESS")) {
      throw new Error(stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Yazdırma başarılı! Yazıcıdan kağıt çıkmalı.",
    });
  } catch (error: any) {
    console.error("PowerShell Print Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Yazdırma başarısız",
      },
      { status: 500 }
    );
  }
}
