import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KP-301H Termal Yazıcı Kontrol Paneli",
  description: "Termal yazıcı için görsel yazdırma paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
