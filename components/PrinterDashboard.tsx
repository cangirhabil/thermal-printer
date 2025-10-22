"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Image as ImageIcon, FileText, Settings, Activity, Wifi, UsbIcon, Gauge } from "lucide-react";
import ImagePrintPanel from "./ImagePrintPanel";
import TextPrintPanel from "./TextPrintPanel";
import PrinterSettingsPanel from "./PrinterSettingsPanel";
import PrinterStatusCard from "./PrinterStatusCard";
import { useToast } from "@/hooks/use-toast";

export default function PrinterDashboard() {
  const [activeTab, setActiveTab] = useState("image");
  const [printerStatus, setPrinterStatus] = useState({
    connected: false,
    type: "unknown",
    loading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  const checkPrinterStatus = async () => {
    try {
      const response = await fetch("/api/printer/auto-detect");
      const data = await response.json();
      
      setPrinterStatus({
        connected: data.success,
        type: data.method || "unknown",
        loading: false
      });

      if (data.success) {
        toast({
          title: "Yazıcı Hazır",
          description: `${data.method} üzerinden bağlantı sağlandı.`,
          variant: "default",
        });
      }
    } catch (error) {
      setPrinterStatus({
        connected: false,
        type: "unknown",
        loading: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Printer className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Termal Yazıcı Kontrol Paneli
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    KP-301H Profesyonel Yazdırma Çözümü
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={printerStatus.connected ? "default" : "secondary"}
                className={`px-4 py-2 text-sm ${
                  printerStatus.connected 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-gray-400"
                }`}
              >
                <Activity className="w-4 h-4 mr-2" />
                {printerStatus.loading ? "Kontrol Ediliyor..." : printerStatus.connected ? "Aktif" : "Bağlantı Yok"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Durum Kartları */}
          <div className="lg:col-span-1 space-y-6">
            <PrinterStatusCard 
              status={printerStatus} 
              onRefresh={checkPrinterStatus}
            />
            
            {/* Hızlı İstatistikler */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Hızlı Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yazıcı Modeli</span>
                  <span className="text-sm font-medium">KP-301H</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kağıt Genişliği</span>
                  <span className="text-sm font-medium">80mm</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Çözünürlük</span>
                  <span className="text-sm font-medium">203 DPI</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bağlantı Tipi</span>
                  <Badge variant="outline" className="text-xs">
                    {printerStatus.type === "USB" && <UsbIcon className="w-3 h-3 mr-1" />}
                    {printerStatus.type === "Network" && <Wifi className="w-3 h-3 mr-1" />}
                    {printerStatus.type || "Otomatik"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Yardım Kartı */}
            <Alert>
              <AlertDescription className="text-sm">
                💡 <strong>İpucu:</strong> Yazıcınız otomatik olarak algılanır. Görsel veya metin ekleyip hemen yazdırabilirsiniz.
              </AlertDescription>
            </Alert>
          </div>

          {/* Sağ Panel - Ana İçerik */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Yazdırma İşlemleri</CardTitle>
                <CardDescription>
                  Görsel, metin yazdırın veya yazıcı ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Görsel</span>
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Metin</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Ayarlar</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="mt-0">
                    <ImagePrintPanel />
                  </TabsContent>

                  <TabsContent value="text" className="mt-0">
                    <TextPrintPanel />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <PrinterSettingsPanel onSettingsChange={checkPrinterStatus} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025  -  Yazıcı Kontrol Paneli
          </p>
        </div>
      </div>
    </div>
  );
}
