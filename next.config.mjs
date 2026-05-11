/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pdf-parse',
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
