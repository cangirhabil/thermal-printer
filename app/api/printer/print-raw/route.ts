import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { imageData, printerName } = await request.json();

    // Base64 görselini buffer'a çevir
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Geçici dosya oluştur
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `thermal-print-${Date.now()}.bin`);

    // ESC/POS komutlarını oluştur
    const escInit = Buffer.from([0x1b, 0x40]); // ESC @ - Initialize
    const escAlign = Buffer.from([0x1b, 0x61, 0x01]); // ESC a 1 - Center align

    // Sharp ile görsel işle
    const sharp = (await import("sharp")).default;
    const processedImage = await sharp(imageBuffer)
      .resize({ width: 576 })
      .grayscale()
      .normalise()
      .threshold(128)
      .png()
      .toBuffer();

    // ESC/POS bit image komutunu oluştur (basitleştirilmiş)
    const escCut = Buffer.from([0x1d, 0x56, 0x01]); // GS V 1 - Cut paper

    // Tüm komutları birleştir
    const printData = Buffer.concat([
      escInit,
      escAlign,
      // Not: Görsel yazdırma için karmaşık ESC/POS bitmap komutları gerekli
      // Şimdilik test metni
      Buffer.from("TEST YAZDIR\n\n"),
      escCut,
    ]);

    // Geçici dosyaya yaz
    await fs.writeFile(tempFile, printData);

    // PowerShell ile RAW modda yazdır
    const psCommand = `
      $printer = "${printerName || "KPOS_80"}"
      $file = "${tempFile.replace(/\\/g, "\\\\")}"
      
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName System.Printing
      
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
      [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
      
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class RawPrinter {
          [StructLayout(LayoutKind.Sequential)]
          public struct DOCINFO {
            [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
          }
          
          [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
          public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
          
          [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
          public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOCINFO pDocInfo);
          
          [DllImport("winspool.drv", SetLastError = true)]
          public static extern bool StartPagePrinter(IntPtr hPrinter);
          
          [DllImport("winspool.drv", SetLastError = true)]
          public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
          
          [DllImport("winspool.drv", SetLastError = true)]
          public static extern bool EndPagePrinter(IntPtr hPrinter);
          
          [DllImport("winspool.drv", SetLastError = true)]
          public static extern bool EndDocPrinter(IntPtr hPrinter);
          
          [DllImport("winspool.drv", SetLastError = true)]
          public static extern bool ClosePrinter(IntPtr hPrinter);
        }
"@
      
      $hPrinter = [IntPtr]::Zero
      if ([RawPrinter]::OpenPrinter($printer, [ref]$hPrinter, [IntPtr]::Zero)) {
        $docInfo = New-Object RawPrinter+DOCINFO
        $docInfo.pDocName = "Thermal Print"
        $docInfo.pDataType = "RAW"
        
        if ([RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$docInfo)) {
          if ([RawPrinter]::StartPagePrinter($hPrinter)) {
            $written = 0
            [RawPrinter]::WritePrinter($hPrinter, $ptr, $bytes.Length, [ref]$written)
            [RawPrinter]::EndPagePrinter($hPrinter)
          }
          [RawPrinter]::EndDocPrinter($hPrinter)
        }
        [RawPrinter]::ClosePrinter($hPrinter)
      }
      
      [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
      Write-Output "OK"
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psCommand.replace(/"/g, '\\"')}"`,
      { timeout: 10000 }
    );

    // Geçici dosyayı sil
    await fs.unlink(tempFile).catch(() => {});

    if (stderr && !stderr.includes("WARNING")) {
      throw new Error(stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Yazdırma başarılı!",
      output: stdout,
    });
  } catch (error: any) {
    console.error("RAW Print Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Yazdırma başarısız",
      },
      { status: 500 }
    );
  }
}
