"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  X,
  Printer,
  Image as ImageIcon,
  Loader2,
  FileImage,
  ZoomIn,
  Download,
} from "lucide-react";

export default function ImagePrintPanel() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [printing, setPrinting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    toast({
      title: "Yazdırılıyor",
      description: "Yazıcı algılanıyor ve görsel yazdırılıyor...",
    });

    try {
      const response = await fetch("/api/printer/auto-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData, textData: "" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Başarılı",
          description: data.message || "Görsel başarıyla yazdırıldı!",
        });
      } else {
        throw new Error(data.error || "Yazdırma başarısız");
      }
    } catch (error: any) {
      toast({
        title: "Yazdırma Hatası",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
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
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
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
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    <Label className="text-sm font-medium">Önizleme</Label>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={imageData}
                      alt="Preview"
                      className="max-w-full max-h-64 object-contain rounded shadow-md"
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
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Görsel Hazır
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Görsel otomatik olarak termal yazıcı formatına dönüştürülecek
                  ve yazdırılacaktır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
