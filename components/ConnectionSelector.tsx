"use client";

import { useState, useEffect } from "react";
import { ConnectionType, PrinterSettings, PortInfo } from "@/types/printer";

interface ConnectionSelectorProps {
  settings: PrinterSettings;
  onSettingsChange: (settings: PrinterSettings) => void;
}

export default function ConnectionSelector({
  settings,
  onSettingsChange,
}: ConnectionSelectorProps) {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Port listesini yükle
  const loadPorts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/printer/ports");
      const data = await response.json();
      if (data.success && data.data) {
        setPorts(data.data);
      }
    } catch (error) {
      console.error("Port listesi alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      settings.connectionType === "serial" ||
      settings.connectionType === "usb"
    ) {
      loadPorts();
    }
  }, [settings.connectionType]);

  const handleConnectionTypeChange = (type: ConnectionType) => {
    onSettingsChange({
      ...settings,
      connectionType: type,
    });
  };

  const handleSerialPortChange = (port: string) => {
    onSettingsChange({
      ...settings,
      serialPort: port,
    });
  };

  const handleNetworkChange = (
    field: "networkIp" | "networkPort",
    value: string
  ) => {
    onSettingsChange({
      ...settings,
      [field]: field === "networkPort" ? parseInt(value) || 9100 : value,
    });
  };

  const handleWindowsPrinterChange = (name: string) => {
    onSettingsChange({
      ...settings,
      windowsPrinterName: name,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        Bağlantı Ayarları
      </h2>

      {/* Bağlantı Tipi Seçimi */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Bağlantı Tipi
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleConnectionTypeChange("usb")}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              settings.connectionType === "usb"
                ? "bg-green-500 text-white shadow-lg scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              USB Port
            </div>
          </button>

          <button
            onClick={() => handleConnectionTypeChange("network")}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              settings.connectionType === "network"
                ? "bg-green-500 text-white shadow-lg scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Network (LAN)
            </div>
          </button>

          <button
            onClick={() => handleConnectionTypeChange("windows-printer")}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              settings.connectionType === "windows-printer"
                ? "bg-green-500 text-white shadow-lg scale-105"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Windows
            </div>
          </button>
        </div>
      </div>

      {/* USB Port Seçimi */}
      {settings.connectionType === "usb" && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Port Seçimi
            </label>
            <button
              onClick={loadPorts}
              disabled={loading}
              className="text-sm text-green-500 hover:text-green-600 disabled:text-gray-400"
            >
              {loading ? "Yükleniyor..." : "🔄 Yenile"}
            </button>
          </div>
          <select
            value={settings.serialPort || ""}
            onChange={(e) => handleSerialPortChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Port seçin...</option>
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path} {port.manufacturer && `- ${port.manufacturer}`}
              </option>
            ))}
          </select>
          {ports.length === 0 && !loading && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ Port bulunamadı. Yazıcının bağlı olduğundan emin olun.
            </p>
          )}
        </div>
      )}

      {/* Network Ayarları */}
      {settings.connectionType === "network" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IP Adresi
            </label>
            <input
              type="text"
              value={settings.networkIp || "192.168.2.211"}
              onChange={(e) => handleNetworkChange("networkIp", e.target.value)}
              placeholder="192.168.2.211"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={settings.networkPort || 9100}
              onChange={(e) =>
                handleNetworkChange("networkPort", e.target.value)
              }
              placeholder="9100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Windows Yazıcı Ayarları */}
      {settings.connectionType === "windows-printer" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Yazıcı Adı
          </label>
          <input
            type="text"
            value={settings.windowsPrinterName || "KPOS_80"}
            onChange={(e) => handleWindowsPrinterChange(e.target.value)}
            placeholder="KPOS_80"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Windows Ayarlar → Yazıcılar ve Tarayıcılar bölümündeki yazıcı adını
            girin
          </p>
        </div>
      )}
    </div>
  );
}
