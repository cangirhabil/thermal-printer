import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, PortInfo } from "@/types/printer";

// SerialPort'u dinamik olarak import et (sadece server-side)
async function getSerialPort() {
  try {
    const { SerialPort } = await import("serialport");
    return SerialPort;
  } catch (error) {
    console.error("SerialPort yüklenemedi:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const SerialPort = await getSerialPort();

    if (!SerialPort) {
      return NextResponse.json<ApiResponse<PortInfo[]>>({
        success: false,
        error: "SerialPort kütüphanesi yüklenemedi. npm install çalıştırın.",
        data: [],
      });
    }

    // Kullanılabilir serial portları listele
    const ports = await SerialPort.list();

    const portInfos: PortInfo[] = ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      pnpId: port.pnpId,
      vendorId: port.vendorId,
      productId: port.productId,
    }));

    return NextResponse.json<ApiResponse<PortInfo[]>>({
      success: true,
      data: portInfos,
    });
  } catch (error: any) {
    console.error("Port listesi alınırken hata:", error);
    return NextResponse.json<ApiResponse<PortInfo[]>>({
      success: false,
      error: error.message || "Port listesi alınamadı",
      data: [],
    });
  }
}
