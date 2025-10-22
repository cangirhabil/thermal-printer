"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer, 
  FileText, 
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Trash2,
  Space,
  Move
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function TextPrintPanel() {
  const [textData, setTextData] = useState("");
  const [fontSize, setFontSize] = useState("normal");
  const [fontType, setFontType] = useState("A"); // Font A veya Font B
  const [alignment, setAlignment] = useState("left");
  const [bold, setBold] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(30); // 0-255 (default 30)
  const [leftMargin, setLeftMargin] = useState(0); // 0-65535 (piksel)
  const [topSpacing, setTopSpacing] = useState(2); // Üst boşluk (satır sayısı)
  const [bottomSpacing, setBottomSpacing] = useState(3); // Alt boşluk (satır sayısı)
  const [printing, setPrinting] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!textData.trim()) {
      toast({
        title: "Metin Gerekli",
        description: "Lütfen yazdırılacak metni girin.",
        variant: "destructive",
      });
      return;
    }

    setPrinting(true);
    toast({
      title: "Yazdırılıyor",
      description: "Metin yazıcıya gönderiliyor...",
    });

    try {
      const response = await fetch("/api/printer/auto-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          imageData: "", 
          textData,
          textOptions: {
            fontSize,
            fontType,
            alignment,
            bold,
            underline,
            lineSpacing,
            leftMargin,
            topSpacing,
            bottomSpacing
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Başarılı",
          description: data.message || "Metin başarıyla yazdırıldı!",
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

  const handleClear = () => {
    setTextData("");
    toast({
      title: "Temizlendi",
      description: "Metin alanı temizlendi.",
    });
  };

  const charCount = textData.length;
  const lineCount = textData.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Metin Alanı */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base">Yazdırılacak Metin</Label>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{lineCount} satır</span>
            <span>•</span>
            <span>{charCount} karakter</span>
          </div>
        </div>
        <Textarea
          value={textData}
          onChange={(e) => setTextData(e.target.value)}
          placeholder="Yazdırılacak metni buraya girin..."
          className="min-h-[200px] text-base font-mono resize-none"
          disabled={printing}
        />
      </div>

      {/* Metin Formatı Ayarları */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4" />
            <Label className="text-sm font-medium">Metin Formatı</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yazı Boyutu */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Yazı Boyutu</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Küçük (1x1)</SelectItem>
                  <SelectItem value="normal">Normal (2x2)</SelectItem>
                  <SelectItem value="large">Büyük (3x3)</SelectItem>
                  <SelectItem value="xlarge">Çok Büyük (4x4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Tipi */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Font Tipi</Label>
              <Select value={fontType} onValueChange={setFontType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Font A (Normal)</SelectItem>
                  <SelectItem value="B">Font B (Küçük)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hizalama */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Hizalama</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-4 h-4" />
                      <span>Sola</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="center">
                    <div className="flex items-center gap-2">
                      <AlignCenter className="w-4 h-4" />
                      <span>Ortala</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center gap-2">
                      <AlignRight className="w-4 h-4" />
                      <span>Sağa</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Satır Aralığı */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Satır Aralığı: {lineSpacing} dot
              </Label>
              <Slider
                value={[lineSpacing]}
                onValueChange={(value: number[]) => setLineSpacing(value[0])}
                min={0}
                max={255}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Boşluk Ayarları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Space className="w-4 h-4" />
              <Label className="text-sm font-medium">Boşluk Ayarları</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sol Kenar Boşluğu */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Sol Kenar: {leftMargin} piksel
                </Label>
                <Slider
                  value={[leftMargin]}
                  onValueChange={(value: number[]) => setLeftMargin(value[0])}
                  min={0}
                  max={200}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Üst Boşluk */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Üst Boşluk: {topSpacing} satır
                </Label>
                <Slider
                  value={[topSpacing]}
                  onValueChange={(value: number[]) => setTopSpacing(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Alt Boşluk */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm text-muted-foreground">
                  Alt Boşluk: {bottomSpacing} satır
                </Label>
                <Slider
                  value={[bottomSpacing]}
                  onValueChange={(value: number[]) => setBottomSpacing(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Metin Stilleri */}
          <div className="grid grid-cols-2 gap-4">
            {/* Kalın Yazı */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm text-muted-foreground cursor-pointer" htmlFor="bold-switch">
                Kalın Yazı
              </Label>
              <Switch
                id="bold-switch"
                checked={bold}
                onCheckedChange={setBold}
              />
            </div>

            {/* Altı Çizili */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm text-muted-foreground cursor-pointer" htmlFor="underline-switch">
                Altı Çizili
              </Label>
              <Switch
                id="underline-switch"
                checked={underline}
                onCheckedChange={setUnderline}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Butonlar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handlePrint}
          disabled={!textData.trim() || printing}
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

        <Button
          variant="outline"
          onClick={handleClear}
          disabled={!textData.trim() || printing}
          className="h-12"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Temizle
        </Button>
      </div>

      {/* Önizleme */}
      {textData && (
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Metin Önizleme
                </p>
                <div 
                  className={`text-sm bg-white dark:bg-gray-800 p-3 rounded border transition-all duration-200 ${
                    alignment === 'center' ? 'text-center' : 
                    alignment === 'right' ? 'text-right' : 'text-left'
                  } ${bold ? 'font-bold' : 'font-normal'} ${
                    underline ? 'underline' : ''
                  }`}
                  style={{
                    fontSize: fontSize === 'small' ? '12px' : 
                             fontSize === 'large' ? '18px' : 
                             fontSize === 'xlarge' ? '24px' : '14px',
                    fontFamily: fontType === 'B' ? 'monospace' : 'system-ui',
                    lineHeight: `${lineSpacing / 10}px`,
                    paddingLeft: `${leftMargin}px`,
                    paddingTop: `${topSpacing * 4}px`,
                    paddingBottom: `${bottomSpacing * 4}px`,
                  }}
                >
                  {textData.split('\n').map((line, i) => (
                    <div key={i}>{line || '\u00A0'}</div>
                  ))}
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Font: {fontType}, 
                  Boyut: {fontSize}, 
                  Hizalama: {alignment === "left" ? "Sol" : alignment === "center" ? "Orta" : "Sağ"}, 
                  Satır: {lineSpacing}dot, 
                  Sol Kenar: {leftMargin}px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
