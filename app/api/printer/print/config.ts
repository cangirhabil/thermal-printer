/**
 * API Route segment config
 * https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */

// API route'larında body parser limitini artır
export const runtime = "nodejs"; // Node.js runtime kullan
export const maxDuration = 30; // Maksimum 30 saniye
export const dynamic = "force-dynamic"; // Her zaman dinamik render

// Body size limitini artır (büyük görseller için)
export const bodyParser = {
  sizeLimit: "10mb",
};
