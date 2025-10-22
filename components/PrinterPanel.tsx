"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

export default function PrinterPanel() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [textData, setTextData] = useState<string>("");
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePrint = async () => {
    if (!imageData && !textData) {
      showMessage("error", "✗ Lütfen görsel veya metin girin!");
      return;
    }

    setPrinting(true);
    showMessage("info", "🔍 Yazıcı aranıyor ve yazdırılıyor...");

    try {
      console.log("========================================");
      console.log("OTOMATIK YAZDIRMA - Tüm yollar denenecek");
      console.log("Görsel var mı:", !!imageData);
      console.log("Metin var mı:", !!textData);
      console.log("========================================");

      // Yeni otomatik endpoint'e gönder
      const response = await fetch("/api/printer/auto-print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData, textData }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        showMessage("success", `✓ ${data.message || "Yazdırma başarılı!"}`);
      } else {
        showMessage("error", `✗ ${data.error || "Yazdırma başarısız"}`);
      }
    } catch (error: any) {
      console.error("========================================");
      console.error("FRONTEND HATA:");
      console.error("Hata mesajı:", error.message);
      console.error("========================================");
      showMessage("error", `✗ Hata: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bildirim Mesajı */}
      {message && (
        <div
          className={`p-4 rounded-lg shadow-lg animate-pulse ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              : message.type === "error"
              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
          }`}
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Ana Bilgi Kartı */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">🤖 Akıllı Termal Yazıcı</h2>
          <p className="text-blue-100">
            Görsel veya metin yükleyin, sistem otomatik olarak yazıcıyı bulup
            yazdıracak
          </p>
          <p className="text-sm text-blue-200 mt-2">
            ✨ Hiçbir ayar gerekmez - tamamen otomatik!
          </p>
        </div>
      </div>

      {/* Görsel ve Metin Yükleme */}
      <ImageUploader onImageSelect={setImageData} onTextChange={setTextData} />

      {/* Yazdır Butonu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <button
          onClick={handlePrint}
          disabled={printing || (!imageData && !textData)}
          className="w-full flex items-center justify-center px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg shadow-lg transition-all disabled:cursor-not-allowed"
        >
          {printing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Yazdırılıyor...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Yazdır
            </>
          )}
        </button>

        {/* Durum Bilgisi */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📋 Durum
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="col-span-2">
              <span className="font-medium">İçerik:</span>{" "}
              <span
                className={
                  imageData || textData
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }
              >
                {imageData && textData
                  ? "✓ Görsel + Metin"
                  : imageData
                  ? "✓ Görsel Hazır"
                  : textData
                  ? "✓ Metin Hazır"
                  : "⚠ İçerik Bekleniyor"}
              </span>
            </div>
            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
              💡 Sistem otomatik olarak yazıcıyı bulacak (USB, Serial, Network,
              Windows)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
