// Yazıcı bağlantı tipleri
export type ConnectionType = "serial" | "usb" | "network" | "windows-printer";

// Yazıcı durumu
export interface PrinterStatus {
  connected: boolean;
  type: ConnectionType;
  port?: string;
  ip?: string;
  error?: string;
}

// Yazıcı ayarları
export interface PrinterSettings {
  connectionType: ConnectionType;
  serialPort?: string;
  usbVendorId?: string;
  usbProductId?: string;
  networkIp?: string;
  networkPort?: number;
  windowsPrinterName?: string;
}

// Yazdırma isteği
export interface PrintRequest {
  imageData: string; // Base64 encoded image
  settings: PrinterSettings;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Port bilgisi
export interface PortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  vendorId?: string;
  productId?: string;
}
