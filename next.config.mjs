/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pdfjs-dist',
    'canvas',
    'mammoth',
    'tesseract.js',
    'firebase-admin',
    '@google-cloud/firestore',
    '@opentelemetry/api',
    '@google-cloud/storage',
  ],
  turbopack: {},
};

export default nextConfig;
