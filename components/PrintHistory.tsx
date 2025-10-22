"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";

interface PrintHistoryItem {
  id: string;
  type: "image" | "text";
  timestamp: Date;
  status: "success" | "error";
  preview?: string;
}

export default function PrintHistory() {
  // Mock data - gerçek uygulamada localStorage veya state'den gelecek
  const history: PrintHistoryItem[] = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "image" ? (
      <ImageIcon className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Yazdırma Geçmişi
          </span>
          {history.length > 0 && (
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Temizle
            </Button>
          )}
        </CardTitle>
        <CardDescription>Son yazdırma işlemleriniz</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Henüz yazdırma işlemi yapılmadı
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.type === "image"
                          ? "Görsel Yazdırma"
                          : "Metin Yazdırma"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleString("tr-TR")}
                      </p>
                    </div>
                    {getStatusIcon(item.status)}
                  </div>
                </div>
                {index < history.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
