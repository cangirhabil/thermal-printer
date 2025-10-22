"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  onTextChange?: (text: string) => void;
}

export default function ImageUploader({
  onImageSelect,
  onTextChange,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [text, setText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir görsel dosyası seçin!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Parent component'e görsel kaldırıldığını bildir
    onImageSelect("");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        Görsel Yükleme
      </h2>

      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Görsel yüklemek için tıklayın veya sürükleyin
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF desteklenir
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <img
              src={preview}
              alt="Önizleme"
              className="max-w-full h-auto mx-auto rounded"
              style={{ maxHeight: "400px" }}
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
              title="Görseli kaldır"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
            <svg
              className="w-5 h-5 mr-2 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Görsel yüklendi ve yazdırmaya hazır
          </div>
          <button
            onClick={handleButtonClick}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Farklı bir görsel seç
          </button>
        </div>
      )}

      {/* Metin Girişi */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📝 Metin Yazdır
        </label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTextChange?.(e.target.value);
          }}
          placeholder="Yazdırmak istediğiniz metni buraya yazın..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Metin ve görsel aynı anda yazdırılabilir
        </p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          💡 İpuçları
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Termal yazıcılar için siyah-beyaz görsel kullanın</li>
          <li>• Maksimum genişlik: 80mm (576 piksel)</li>
          <li>• Net ve yüksek kontrastlı görseller en iyi sonucu verir</li>
        </ul>
      </div>
    </div>
  );
}
