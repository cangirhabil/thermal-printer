"use client";

import { useState } from "react";
import PrinterPanel from "@/components/PrinterPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            KP-301H Termal Yazıcı
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Görsel Yazdırma Kontrol Paneli
          </p>
        </header>

        <PrinterPanel />
      </div>
    </main>
  );
}
