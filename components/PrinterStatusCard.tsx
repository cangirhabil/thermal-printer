"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  UsbIcon,
  Monitor,
  AlertCircle,
} from "lucide-react";

interface PrinterStatusCardProps {
  status: {
    connected: boolean;
    type: string;
    loading: boolean;
    message?: string;
    details?: any;
  };
  onRefresh: () => void;
}

export default function PrinterStatusCard({
  status,
  onRefresh,
}: PrinterStatusCardProps) {
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [lastConnectionType, setLastConnectionType] = useState<string | null>(
    null
  );
  const [nextCheckIn, setNextCheckIn] = useState(10);
  const { toast } = useToast();

  // Periyodik durum kontrolü (her 10 saniyede bir) - sadece bağlı değilse
  useEffect(() => {
    const checkInterval = 10000; // 10 saniye
    
    const intervalId = setInterval(() => {
      // Eğer yazıcı zaten bağlıysa, sadece hafif bir ping yap
      if (status.connected) {
        console.log("✅ Yazıcı bağlı - tam tarama atlanıyor");
        setNextCheckIn(10); // Sadece countdown'u sıfırla
      } else {
        // Bağlı değilse, yeni bağlantı aramak için tam tarama yap
        console.log("🔄 Yazıcı bağlı değil - yeni bağlantı aranıyor...");
        onRefresh();
      }
    }, checkInterval);

    // Geri sayım timer'ı
    const countdownId = setInterval(() => {
      setNextCheckIn((prev) => {
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);

    // Yazdırma sonrası tetiklenen event'i dinle
    const handlePrintRefresh = () => {
      console.log("🖨️ Yazdırma sonrası durum kontrolü tetiklendi");
      setNextCheckIn(10); // Geri sayımı sıfırla
      onRefresh();
    };

    window.addEventListener('printer-status-refresh', handlePrintRefresh);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
      window.removeEventListener('printer-status-refresh', handlePrintRefresh);
    };
  }, [onRefresh, status.connected]);

  // Bağlantı koptuğunda otomatik yeniden bağlanma
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;

    if (!status.connected && !status.loading && autoRetryCount < 3) {
      console.log(
        `🔄 Bağlantı koptu, yeniden deneniyor... (${autoRetryCount + 1}/3)`
      );

      retryTimer = setTimeout(() => {
        setAutoRetryCount((prev) => prev + 1);
        onRefresh();
      }, 5000); // 5 saniye sonra tekrar dene
    } else if (status.connected) {
      // Bağlantı başarılı olduğunda retry sayacını sıfırla
      setAutoRetryCount(0);
      
      // Bağlantı tipi değişti mi kontrol et
      if (lastConnectionType && lastConnectionType !== status.type) {
        // Bağlantı değişti! Kullanıcıyı bilgilendir
        const fromConnection = lastConnectionType.toUpperCase();
        const toConnection = status.type.toUpperCase();
        
        toast({
          title: "🔄 Bağlantı Değişti!",
          description: `${fromConnection} bağlantısı kesildi. ${toConnection} bağlantısına geçildi.`,
          variant: "default",
          duration: 5000,
        });
        
        console.log(`🔄 Bağlantı geçişi: ${fromConnection} → ${toConnection}`);
      }
      
      if (status.type) {
        setLastConnectionType(status.type);
      }
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    status.connected,
    status.loading,
    autoRetryCount,
    onRefresh,
    status.type,
    lastConnectionType,
    toast,
  ]);

  const getStatusIcon = () => {
    if (status.loading) {
      return <Loader2 className="w-12 h-12 text-green-500 animate-spin" />;
    }
    if (status.connected) {
      return <CheckCircle2 className="w-12 h-12 text-green-500" />;
    }
    if (autoRetryCount > 0) {
      return <AlertCircle className="w-12 h-12 text-amber-500 animate-pulse" />;
    }
    return <XCircle className="w-12 h-12 text-gray-400" />;
  };

  const getStatusText = () => {
    if (status.loading) {
      return "Kontrol Ediliyor...";
    }
    if (status.connected) {
      return "Yazıcı Hazır";
    }
    if (autoRetryCount > 0) {
      return `Yeniden Bağlanıyor (${autoRetryCount}/3)`;
    }
    return "Bağlantı Yok";
  };

  const getStatusDescription = () => {
    if (status.loading) {
      return status.message || "Lütfen bekleyin";
    }
    if (status.connected) {
      return status.message || "Yazdırma için hazır";
    }
    if (autoRetryCount > 0) {
      return "Otomatik yeniden bağlanma denemesi";
    }
    return status.message || "Yazıcı algılanamadı";
  };

  const getConnectionIcon = () => {
    const type = (status.type || lastConnectionType || "").toLowerCase();
    if (
      type.includes("usb") ||
      type.includes("serial") ||
      type.includes("com")
    ) {
      return <UsbIcon className="w-5 h-5" />;
    }
    if (type.includes("network") || type.includes("ethernet")) {
      return <Wifi className="w-5 h-5" />;
    }
    if (type.includes("windows")) {
      return <Monitor className="w-5 h-5" />;
    }
    return <WifiOff className="w-5 h-5" />;
  };

  return (
    <Card className="shadow-lg border-2 border-green-100 dark:border-green-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Yazıcı Durumu</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoRetryCount(0); // Retry sayacını sıfırla
              setNextCheckIn(10); // Geri sayımı sıfırla
              onRefresh();
            }}
            disabled={status.loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${status.loading ? "animate-spin" : ""}`}
            />
            Yenile
          </Button>
        </CardTitle>
       
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Durum İkonu */}
        <div className="flex flex-col items-center justify-center py-6">
          {getStatusIcon()}
          <p className="mt-4 text-lg font-semibold">{getStatusText()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {getStatusDescription()}
          </p>
        </div>

        {/* Bağlantı Bilgisi */}
        {status.connected && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Bağlantı Yöntemi
              </span>
              <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 animate-in zoom-in duration-200">
                {getConnectionIcon()}
                {status.type || lastConnectionType || "Bilinmiyor"}
              </Badge>
            </div>
            
            {/* Network detayları */}
            {status.details && (status.type === "network" || status.type === "ethernet") && (
              <div className="space-y-1 text-xs text-green-700 dark:text-green-300 animate-in fade-in duration-300">
                {status.details.ip && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">IP Adresi:</span>
                    <span className="font-mono">{status.details.ip}:{status.details.port || 9100}</span>
                  </div>
                )}
                {status.details.model && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Model:</span>
                    <span className="font-mono">{status.details.model}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Serial/USB detayları */}
            {status.details && (status.type === "serial" || status.type === "usb") && (
              <div className="space-y-1 text-xs text-green-700 dark:text-green-300 animate-in fade-in duration-300">
                {status.details.path && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Port:</span>
                    <span className="font-mono">{status.details.path}</span>
                  </div>
                )}
                {status.details.manufacturer && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Üretici:</span>
                    <span>{status.details.manufacturer}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Bağlantı başarılı - Yazdırmaya hazır</span>
            </div>
          </div>
        )}

        {/* Yeniden Bağlanma Uyarısı */}
        {!status.connected && autoRetryCount > 0 && !status.loading && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Otomatik Yeniden Bağlanıyor
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {lastConnectionType && `Son bağlantı: ${lastConnectionType}`}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Deneme {autoRetryCount}/3 - COM port ve LAN kontrol ediliyor...
            </p>
          </div>
        )}

        {/* Bağlantı Yok Uyarısı */}
        {!status.connected && !status.loading && autoRetryCount === 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Yazıcı Bulunamadı
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
              <li>COM/USB kablosunun bağlı olduğundan emin olun</li>
              <li>Yazıcının açık olduğunu kontrol edin</li>
              <li>Alternatif: LAN kablosu ile bağlayın</li>
            </ul>
          </div>
        )}

        {/* Başarısız Denemeler Sonrası */}
        {!status.connected && !status.loading && autoRetryCount >= 3 && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Bağlantı Kurulamadı
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              3 deneme başarısız oldu. Manuel olarak kontrol edin:
            </p>
            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4 list-disc">
              <li>Önce COM port kontrol edildi ❌</li>
              <li>Sonra LAN bağlantısı denendi ❌</li>
              <li>Her ikisi de bulunamadı</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAutoRetryCount(0);
                onRefresh();
              }}
              className="w-full mt-2"
            >
              Tekrar Dene
            </Button>
          </div>
        )}

        {/* Bağlantı Seçenekleri */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div
            className={`text-center p-3 rounded-lg ${
              status.type?.toLowerCase().includes("com") ||
              status.type?.toLowerCase().includes("usb") ||
              status.type?.toLowerCase().includes("serial")
                ? "bg-green-50 dark:bg-green-950/20 border-2 border-green-500"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <UsbIcon
              className={`w-5 h-5 mx-auto mb-1 ${
                status.type?.toLowerCase().includes("com") ||
                status.type?.toLowerCase().includes("usb") ||
                status.type?.toLowerCase().includes("serial")
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            />
            <p className="text-xs font-medium">COM3</p>
            <p className="text-xs text-muted-foreground">🥇 Öncelik 1</p>
          </div>
          <div
            className={`text-center p-3 rounded-lg ${
              status.type?.toLowerCase().includes("serial") &&
              !status.details?.path?.toLowerCase().includes("com3")
                ? "bg-green-50 dark:bg-green-950/20 border-2 border-green-500"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <UsbIcon
              className={`w-5 h-5 mx-auto mb-1 ${
                status.type?.toLowerCase().includes("serial") &&
                !status.details?.path?.toLowerCase().includes("com3")
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            />
            <p className="text-xs font-medium">Serial</p>
            <p className="text-xs text-muted-foreground">� Öncelik 2</p>
          </div>
          <div
            className={`text-center p-3 rounded-lg ${
              status.type?.toLowerCase().includes("network") ||
              status.type?.toLowerCase().includes("ethernet")
                ? "bg-green-50 dark:bg-green-950/20 border-2 border-green-500"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <Wifi
              className={`w-5 h-5 mx-auto mb-1 ${
                status.type?.toLowerCase().includes("network") ||
                status.type?.toLowerCase().includes("ethernet")
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            />
            <p className="text-xs font-medium">LAN</p>
            <p className="text-xs text-muted-foreground">� Öncelik 3</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
