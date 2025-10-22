"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Wifi,
  WifiOff,
  UsbIcon,
  Monitor,
  AlertCircle
} from "lucide-react";

interface PrinterStatusCardProps {
  status: {
    connected: boolean;
    type: string;
    loading: boolean;
  };
  onRefresh: () => void;
}

export default function PrinterStatusCard({ status, onRefresh }: PrinterStatusCardProps) {
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [lastConnectionType, setLastConnectionType] = useState<string | null>(null);

  // Bağlantı koptuğunda otomatik yeniden bağlanma
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;

    if (!status.connected && !status.loading && autoRetryCount < 3) {
      console.log(`🔄 Bağlantı koptu, yeniden deneniyor... (${autoRetryCount + 1}/3)`);
      
      retryTimer = setTimeout(() => {
        setAutoRetryCount(prev => prev + 1);
        onRefresh();
      }, 5000); // 5 saniye sonra tekrar dene
    } else if (status.connected) {
      // Bağlantı başarılı olduğunda retry sayacını sıfırla
      setAutoRetryCount(0);
      if (status.type) {
        setLastConnectionType(status.type);
      }
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [status.connected, status.loading, autoRetryCount, onRefresh, status.type]);

  const getStatusIcon = () => {
    if (status.loading) {
      return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
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
      return "Lütfen bekleyin";
    }
    if (status.connected) {
      return "Yazdırma için hazır";
    }
    if (autoRetryCount > 0) {
      return "Otomatik yeniden bağlanma denemesi";
    }
    return "Yazıcı algılanamadı";
  };

  const getConnectionIcon = () => {
    const type = (status.type || lastConnectionType || "").toLowerCase();
    if (type.includes('usb') || type.includes('serial') || type.includes('com')) {
      return <UsbIcon className="w-5 h-5" />;
    }
    if (type.includes('network') || type.includes('ethernet')) {
      return <Wifi className="w-5 h-5" />;
    }
    if (type.includes('windows')) {
      return <Monitor className="w-5 h-5" />;
    }
    return <WifiOff className="w-5 h-5" />;
  };

  return (
    <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Yazıcı Durumu</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setAutoRetryCount(0); // Retry sayacını sıfırla
              onRefresh();
            }}
            disabled={status.loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${status.loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Durum İkonu */}
        <div className="flex flex-col items-center justify-center py-6">
          {getStatusIcon()}
          <p className="mt-4 text-lg font-semibold">
            {getStatusText()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {getStatusDescription()}
          </p>
        </div>

        {/* Bağlantı Bilgisi */}
        {status.connected && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Bağlantı Yöntemi
              </span>
              <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                {getConnectionIcon()}
                {status.type || lastConnectionType || "Bilinmiyor"}
              </Badge>
            </div>
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
              Deneme {autoRetryCount}/3 - Önce COM, sonra LAN kontrol ediliyor...
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
              <li>LAN kablosunu kontrol edin (alternatif bağlantı)</li>
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
              <li>Önce COM port kontrol edildi</li>
              <li>Sonra LAN bağlantısı denendi</li>
              <li>Her ikisi de başarısız</li>
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
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className={`text-center p-3 rounded-lg ${
            status.type?.toLowerCase().includes('com') || 
            status.type?.toLowerCase().includes('usb') || 
            status.type?.toLowerCase().includes('serial')
              ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500' 
              : 'bg-blue-50 dark:bg-blue-950/20'
          }`}>
            <UsbIcon className={`w-5 h-5 mx-auto mb-1 ${
              status.type?.toLowerCase().includes('com') || 
              status.type?.toLowerCase().includes('usb') || 
              status.type?.toLowerCase().includes('serial')
                ? 'text-green-600 dark:text-green-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`} />
            <p className="text-xs font-medium">COM Port</p>
            <p className="text-xs text-muted-foreground">Öncelik 1</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            status.type?.toLowerCase().includes('network') || 
            status.type?.toLowerCase().includes('ethernet')
              ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500' 
              : 'bg-purple-50 dark:bg-purple-950/20'
          }`}>
            <Wifi className={`w-5 h-5 mx-auto mb-1 ${
              status.type?.toLowerCase().includes('network') || 
              status.type?.toLowerCase().includes('ethernet')
                ? 'text-green-600 dark:text-green-400' 
                : 'text-purple-600 dark:text-purple-400'
            }`} />
            <p className="text-xs font-medium">LAN</p>
            <p className="text-xs text-muted-foreground">Öncelik 2</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
