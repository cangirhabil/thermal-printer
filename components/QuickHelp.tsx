"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  FileQuestion,
  Wrench,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function QuickHelp() {
  const helpItems = [
    {
      icon: <FileQuestion className="w-5 h-5" />,
      title: "Yazıcı Algılanmıyor",
      description:
        "USB kablosunu kontrol edin ve yazıcının açık olduğundan emin olun.",
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      title: "Bozuk Çıktı",
      description:
        "Kağıt genişliğini 80mm olarak ayarlayın ve görseli 576px genişliğe ölçeklendirin.",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Desteklenen Formatlar",
      description: "PNG, JPG, GIF görselleri ve düz metin yazdırılabilir.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Hızlı Yardım
        </CardTitle>
        <CardDescription>
          Sık karşılaşılan sorunlar ve çözümleri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {helpItems.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-4">
          <ExternalLink className="w-4 h-4 mr-2" />
          Detaylı Dokümantasyon
        </Button>
      </CardContent>
    </Card>
  );
}
