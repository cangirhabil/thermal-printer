"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Printer,
  Image as ImageIcon,
  FileText,
  Settings,
} from "lucide-react";
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
    loading: true,
    message: "",
    details: null as any,
  });
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  const checkPrinterStatus = async () => {
    // Eğer zaten kontrol yapılıyorsa, yenisini başlatma
    if (isChecking) {
      console.log("⏭️ Zaten kontrol yapılıyor, atlanıyor...");
      return;
    }

    setIsChecking(true);
    setPrinterStatus(prev => ({
      ...prev,
      loading: true,
      message: "Yazıcı aranıyor...",
    }));

    try {
      const response = await fetch("/api/printer/auto-detect");
      const data = await response.json();

      console.log("Yazıcı durum yanıtı:", data);

      setPrinterStatus({
        connected: data.success,
        type: data.method || "unknown",
        loading: false,
        message: data.message || (data.success ? "Bağlantı başarılı" : "Yazıcı bulunamadı"),
        details: data.bestMethod?.details || null,
      });

      if (data.success) {
        // Sadece ilk bağlantıda toast göster, periyodik kontrollerde gösterme
        if (!printerStatus.connected) {
          toast({
            title: "✅ Yazıcı Hazır",
            description: data.message || `${data.method} üzerinden bağlantı sağlandı.`,
            variant: "default",
          });
        }
      } else {
        // Sadece bağlantı yeni koptuğunda toast göster
        if (printerStatus.connected) {
          toast({
            title: "⚠️ Bağlantı Kesildi",
            description: "Yazıcı bağlantısı koptu. Yeniden bağlanılıyor...",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Yazıcı durum kontrolü hatası:", error);
      
      setPrinterStatus({
        connected: false,
        type: "unknown",
        loading: false,
        message: "Bağlantı hatası",
        details: null,
      });

      // Sadece önceden bağlıysa hata toast'u göster
      if (printerStatus.connected) {
        toast({
          title: "❌ Bağlantı Hatası",
          description: error.message || "Yazıcı durumu kontrol edilemedi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-green-950/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Header - Sadeleştirilmiş */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Termal Yazıcı Kontrol Paneli
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sol Panel - Sadece Durum */}
          <div className="lg:col-span-1">
            <PrinterStatusCard
              status={printerStatus}
              onRefresh={checkPrinterStatus}
            />
          </div>

          {/* Sağ Panel - Ana İçerik */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-green-100 dark:border-green-900/30">
              <CardHeader className="pb-4 border-b border-green-100 dark:border-green-900/30">
                <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                  Yazdırma İşlemleri
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Görsel, metin yazdırın veya yazıcı ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-green-100 dark:bg-green-900/30">
                    <TabsTrigger
                      value="image"
                      className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Görsel</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Metin</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
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
                    <PrinterSettingsPanel
                      onSettingsChange={checkPrinterStatus}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
