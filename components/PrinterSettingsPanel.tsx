"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Wifi,
  UsbIcon,
  Monitor,
  RefreshCw,
  CheckCircle2,
  Info,
} from "lucide-react";

interface PrinterSettingsPanelProps {
  onSettingsChange?: () => void;
}

export default function PrinterSettingsPanel({
  onSettingsChange,
}: PrinterSettingsPanelProps) {
  const [connectionType, setConnectionType] = useState("auto");
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [networkIP, setNetworkIP] = useState("");
  const [networkPort, setNetworkPort] = useState("9100");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (connectionType === "serial" || connectionType === "usb") {
      fetchPorts();
    }
  }, [connectionType]);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/printer/ports");
      const data = await response.json();

      if (data.success && data.ports) {
        setAvailablePorts(data.ports.map((p: any) => p.path));
        toast({
          title: "Port Taraması Tamamlandı",
          description: `${data.ports.length} port bulundu.`,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Portlar listelenemedi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    toast({
      title: "Bağlantı Test Ediliyor",
      description: "Yazıcı bağlantısı kontrol ediliyor...",
    });

    try {
      const response = await fetch("/api/printer/auto-detect");
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Bağlantı Başarılı",
          description: `${data.method} üzerinden bağlantı kuruldu.`,
        });
        onSettingsChange?.();
      } else {
        toast({
          title: "Bağlantı Başarısız",
          description: "Yazıcı bulunamadı.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Hatası",
        description: "Bağlantı test edilemedi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bağlantı Tipi Seçimi */}
      <div>
        <Label className="text-base mb-3 block">Bağlantı Tipi</Label>
        <Select value={connectionType} onValueChange={setConnectionType}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Otomatik Algıla (Önerilen)</span>
              </div>
            </SelectItem>
            <SelectItem value="usb">
              <div className="flex items-center gap-2">
                <UsbIcon className="w-4 h-4" />
                <span>USB Bağlantı</span>
              </div>
            </SelectItem>
            <SelectItem value="serial">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Serial Port (COM)</span>
              </div>
            </SelectItem>
            <SelectItem value="network">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span>Ağ Bağlantısı</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Otomatik Mod Bilgisi */}
      {connectionType === "auto" && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Otomatik Algılama Aktif
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Sistem, yazıcıyı otomatik olarak USB, Serial, Network ve
                  Windows yazıcıları arasında arayacak ve ilk bulunanı
                  kullanacaktır. Çoğu kullanım için önerilir.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    USB
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Serial
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Network
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Windows
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Serial/USB Port Seçimi */}
      {(connectionType === "serial" || connectionType === "usb") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Mevcut Portlar</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPorts}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Yenile
            </Button>
          </div>

          <Select value={selectedPort} onValueChange={setSelectedPort}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Port seçin..." />
            </SelectTrigger>
            <SelectContent>
              {availablePorts.length === 0 ? (
                <SelectItem value="none" disabled>
                  Port bulunamadı
                </SelectItem>
              ) : (
                availablePorts.map((port) => (
                  <SelectItem key={port} value={port}>
                    {port}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {availablePorts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {availablePorts.length} port tespit edildi
            </p>
          )}
        </div>
      )}

      {/* Network Ayarları */}
      {connectionType === "network" && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">IP Adresi</Label>
            <Input
              type="text"
              placeholder="192.168.2.211"
              value={networkIP}
              onChange={(e) => setNetworkIP(e.target.value)}
              className="h-12"
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">Port</Label>
            <Input
              type="text"
              placeholder="9100"
              value={networkPort}
              onChange={(e) => setNetworkPort(e.target.value)}
              className="h-12"
            />
          </div>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                💡 Çoğu termal yazıcı 9100 portunu kullanır. Yazıcınızın ağ
                ayarlarından IP adresini ve portunu kontrol edin.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Yazıcı Özellikleri */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Yazıcı Özellikleri</Label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">KP-301H</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Kağıt</p>
              <p className="font-medium">80mm</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Çözünürlük</p>
              <p className="font-medium">203 DPI</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Genişlik</p>
              <p className="font-medium">576 piksel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Butonu */}
      <Button
        onClick={testConnection}
        variant="outline"
        className="w-full h-12 text-base"
        size="lg"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        Bağlantıyı Test Et
      </Button>

      {/* Yardım Kartı */}
      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-2 block">Yardım</Label>
          <ul className="text-xs text-muted-foreground space-y-2 ml-4 list-disc">
            <li>Otomatik mod çoğu durumda yazıcıyı bulacaktır</li>
            <li>USB bağlantı için sürücülerin yüklü olduğundan emin olun</li>
            <li>
              Network bağlantı için yazıcı ve bilgisayar aynı ağda olmalıdır
            </li>
            <li>Sorun yaşıyorsanız yazıcıyı yeniden başlatın</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
