"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  X,
  Printer,
  Image as ImageIcon,
  Loader2,
  FileImage,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Palette,
  Move,
  Maximize2,
} from "lucide-react";

interface ImageFilters {
  brightness: number;
  contrast: number;
  grayscale: number;
  invert: number;
}

interface Position {
  x: number;
  y: number;
}

export default function ImagePrintPanel() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [printing, setPrinting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    invert: 0,
  });
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [paperHeight, setPaperHeight] = useState(800); // Kağıt yüksekliği (px)
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Geçersiz Dosya",
        description: "Lütfen bir görsel dosyası seçin.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      toast({
        title: "Görsel Yüklendi",
        description: `${file.name} başarıyla yüklendi.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageFile(null);
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setShowPreview(false);
    setPaperHeight(800);
    setFilters({
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      invert: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleResetFilters = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setPaperHeight(800);
    setFilters({
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      invert: 0,
    });
    toast({
      title: "Filtreler Sıfırlandı",
      description: "Tüm ayarlar varsayılan değerlere döndürüldü.",
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showPreview) return;
    setIsDraggingImage(true);
    setDragStart({
      x: e.nativeEvent.offsetX - position.x,
      y: e.nativeEvent.offsetY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingImage || !showPreview) return;
    setPosition({
      x: e.nativeEvent.offsetX - dragStart.x,
      y: e.nativeEvent.offsetY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleCenterImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageData) return;

    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const zoomRatio = zoom / 100;
      const MAX_PRINTER_WIDTH = 576;
      
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      if (targetWidth > MAX_PRINTER_WIDTH) {
        const ratio = MAX_PRINTER_WIDTH / targetWidth;
        targetWidth = MAX_PRINTER_WIDTH;
        targetHeight = Math.round(targetHeight * ratio);
      }
      
      const finalWidth = Math.round(targetWidth * zoomRatio);
      const finalHeight = Math.round(targetHeight * zoomRatio);
      
      setPosition({
        x: (canvas.width - finalWidth) / 2,
        y: 50, // Üstten biraz boşluk
      });
    };
  };

  const getImageStyle = () => {
    return {
      transform: `scale(${zoom / 100})`,
      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) invert(${filters.invert}%)`,
      transition: "all 0.3s ease",
    };
  };

  // Kağıt önizlemesini çiz
  useEffect(() => {
    if (!showPreview || !previewCanvasRef.current || !imageData) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Kağıt boyutlarını ayarla (58mm genişlik, kullanıcı tanımlı yükseklik)
    // 1mm ≈ 8 pixels (72mm kağıt için 576px)
    const PAPER_WIDTH = 576;

    canvas.width = PAPER_WIDTH;
    canvas.height = paperHeight;

    // Kağıt arka planı (beyaz)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAPER_WIDTH, paperHeight);

    // Kağıt kenarlıkları
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, PAPER_WIDTH, paperHeight);

    // Grid çiz (yardımcı çizgiler)
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    for (let i = 0; i < PAPER_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, paperHeight);
      ctx.stroke();
    }
    for (let i = 0; i < paperHeight; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(PAPER_WIDTH, i);
      ctx.stroke();
    }

    // Görseli yükle ve çiz
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const zoomRatio = zoom / 100;
      const MAX_PRINTER_WIDTH = 576;
      
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      if (targetWidth > MAX_PRINTER_WIDTH) {
        const ratio = MAX_PRINTER_WIDTH / targetWidth;
        targetWidth = MAX_PRINTER_WIDTH;
        targetHeight = Math.round(targetHeight * ratio);
      }
      
      const finalWidth = Math.round(targetWidth * zoomRatio);
      const finalHeight = Math.round(targetHeight * zoomRatio);

      // Filtreleri uygula
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) invert(${filters.invert}%)`;
      
      // Görseli konumda çiz
      ctx.drawImage(img, position.x, position.y, finalWidth, finalHeight);
      
      // Görselin etrafına seçim çerçevesi
      ctx.filter = "none";
      ctx.strokeStyle = isDraggingImage ? "#10b981" : "#6b7280";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(position.x, position.y, finalWidth, finalHeight);
      ctx.setLineDash([]);
    };
  }, [showPreview, imageData, zoom, filters, position, isDraggingImage, paperHeight]);

  const applyFiltersToImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Zoom oranını hesapla
        const zoomRatio = zoom / 100;
        
        // Maksimum yazıcı genişliği (termal yazıcı için)
        const MAX_PRINTER_WIDTH = 576;
        
        // Orijinal boyutları al
        let targetWidth = img.width;
        let targetHeight = img.height;
        
        // Eğer görsel yazıcı genişliğinden büyükse, önce onu sığdır
        if (targetWidth > MAX_PRINTER_WIDTH) {
          const ratio = MAX_PRINTER_WIDTH / targetWidth;
          targetWidth = MAX_PRINTER_WIDTH;
          targetHeight = Math.round(targetHeight * ratio);
        }
        
        // Şimdi zoom'u uygula
        const finalWidth = Math.round(targetWidth * zoomRatio);
        const finalHeight = Math.round(targetHeight * zoomRatio);
        
        // Canvas oluştur - kağıt boyutunda
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Canvas context oluşturulamadı"));
          return;
        }

        // Canvas boyutunu kağıt boyutunda ayarla
        canvas.width = MAX_PRINTER_WIDTH;
        canvas.height = paperHeight;

        // Beyaz arka plan
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Filtreleri uygula
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) invert(${filters.invert}%)`;
        
        // Görseli belirlenen konumda çiz
        ctx.drawImage(img, position.x, position.y, finalWidth, finalHeight);

        // Canvas'ı base64'e çevir
        const filteredImageData = canvas.toDataURL("image/png");
        resolve(filteredImageData);
      };

      img.onerror = () => {
        reject(new Error("Görsel yüklenemedi"));
      };

      img.src = imageData!;
    });
  };

  const handlePrint = async () => {
    if (!imageData) {
      toast({
        title: "Görsel Gerekli",
        description: "Lütfen önce bir görsel yükleyin.",
        variant: "destructive",
      });
      return;
    }

    setPrinting(true);
    
    const printingToast = toast({
      title: "🔍 Yazıcı Aranıyor",
      description: "Yazıcı algılanıyor, lütfen bekleyin...",
      duration: 60000, // 60 saniye
    });

    try {
      console.log("🖨️ Görsel yazdırma başlatılıyor...");
      
      // Filtreleri görsele uygula
      const processedImageData = await applyFiltersToImage();
      console.log("✅ Filtreler uygulandı");
      
      const response = await fetch("/api/printer/auto-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          imageData: processedImageData, 
          textData: "",
          skipResize: true // API'ye yeniden boyutlandırma yapmamasını söyle
        }),
      });

      const data = await response.json();
      
      console.log("Yazdırma yanıtı:", data);

      if (data.success) {
        toast({
          title: "✅ Başarılı",
          description: data.message || "Görsel başarıyla yazdırıldı!",
        });
        
        // Yazdırma sonrası durum kontrolü tetikle (yeni bağlantı tipini algılamak için)
        window.dispatchEvent(new CustomEvent('printer-status-refresh'));
      } else {
        throw new Error(data.error || "Yazdırma başarısız");
      }
    } catch (error: any) {
      console.error("Yazdırma hatası:", error);
      
      toast({
        title: "❌ Yazdırma Hatası",
        description: error.message || "Bilinmeyen bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
      printingToast.dismiss?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Yükleme Alanı */}
      <div>
        <Label className="text-base mb-3 block">Görsel Yükle</Label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
            dragActive
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
          />

          {!imageData ? (
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <Upload className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                Görsel yüklemek için tıklayın veya sürükleyin
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF - Maksimum boyut önerilir: 576px genişlik
              </p>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <FileImage className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{imageFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {imageFile && (imageFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Önizleme */}
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <Label className="text-sm font-medium">Önizleme</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {zoom}%
                      </Badge>
                      <Button
                        variant={showPreview ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setShowPreview(!showPreview);
                          if (!showPreview) {
                            setTimeout(handleCenterImage, 100);
                          }
                        }}
                      >
                        <Maximize2 className="w-4 h-4 mr-1" />
                        {showPreview ? "Basit" : "Kağıt"}
                      </Button>
                    </div>
                  </div>

                  {/* Zoom Kontrolleri */}
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <Slider
                        value={[zoom]}
                        onValueChange={(value) => setZoom(value[0])}
                        min={50}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 200}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      title="Sıfırla"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Görsel Önizleme */}
                  {!showPreview ? (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={imageData}
                        alt="Preview"
                        className="max-w-full max-h-64 object-contain rounded shadow-md"
                        style={getImageStyle()}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Kağıt Önizleme Canvas */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center overflow-auto max-h-[500px]">
                        <canvas
                          ref={previewCanvasRef}
                          className="border border-gray-300 shadow-lg cursor-move"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        />
                      </div>

                      {/* Konum Kontrolleri */}
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <Move className="w-4 h-4 text-blue-600" />
                            <Label className="text-sm font-medium">Kağıt ve Konum Ayarları</Label>
                          </div>

                          {/* Kağıt Yüksekliği */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">
                                Kağıt Uzunluğu: {paperHeight}px ({Math.round(paperHeight / 8)}mm)
                              </Label>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPaperHeight(400)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Kısa
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPaperHeight(800)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Normal
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPaperHeight(1200)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Uzun
                                </Button>
                              </div>
                            </div>
                            <Slider
                              value={[paperHeight]}
                              onValueChange={(value) => setPaperHeight(value[0])}
                              min={200}
                              max={2000}
                              step={50}
                              className="w-full"
                            />
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-3">
                            {/* X Konumu */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Yatay (X): {position.x}px
                              </Label>
                              <Input
                                type="number"
                                value={position.x}
                                onChange={(e) =>
                                  setPosition((prev) => ({
                                    ...prev,
                                    x: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="h-8 text-sm"
                              />
                            </div>

                            {/* Y Konumu */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                Dikey (Y): {position.y}px
                              </Label>
                              <Input
                                type="number"
                                value={position.y}
                                onChange={(e) =>
                                  setPosition((prev) => ({
                                    ...prev,
                                    y: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCenterImage}
                            className="w-full"
                          >
                            <Move className="w-4 h-4 mr-2" />
                            Ortala
                          </Button>

                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            💡 Görseli mouse ile sürükleyebilir veya koordinat girebilirsiniz
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Filtre Kontrolleri */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sliders className="w-4 h-4" />
                    <Label className="text-sm font-medium">Filtreler</Label>
                  </div>

                  {/* Parlaklık */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Parlaklık
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {filters.brightness}%
                      </Badge>
                    </div>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, brightness: value[0] }))
                      }
                      min={0}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Kontrast */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Kontrast
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {filters.contrast}%
                      </Badge>
                    </div>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, contrast: value[0] }))
                      }
                      min={0}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Gri Tonlama */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Gri Tonlama
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {filters.grayscale}%
                      </Badge>
                    </div>
                    <Slider
                      value={[filters.grayscale]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, grayscale: value[0] }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Renk Ters Çevirme */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Renk Ters Çevirme
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {filters.invert}%
                      </Badge>
                    </div>
                    <Slider
                      value={[filters.invert]}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, invert: value[0] }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Yazdırma Butonu */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handlePrint}
          disabled={!imageData || printing}
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          size="lg"
        >
          {printing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Yazdırılıyor...
            </>
          ) : (
            <>
              <Printer className="w-5 h-5 mr-2" />
              Yazdır
            </>
          )}
        </Button>

        {imageData && (
          <Button
            variant="outline"
            onClick={handleRemoveImage}
            disabled={printing}
            className="h-12"
          >
            <X className="w-5 h-5 mr-2" />
            Temizle
          </Button>
        )}
      </div>

      {/* Bilgilendirme */}
      {imageData && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Görsel Hazır
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Boyut: {zoom}% | Konum: X:{position.x}px, Y:{position.y}px | Kağıt: {paperHeight}px ({Math.round(paperHeight / 8)}mm)
                  <br />
                  {showPreview 
                    ? "Kağıt önizlemesinde görseli sürükleyerek konumlandırın ve kağıt uzunluğunu ayarlayın."
                    : "Kağıt önizlemesini açarak görseli konumlandırabilir ve kağıt boyutunu ayarlayabilirsiniz."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
