import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: (
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com; " +
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https://lh3.googleusercontent.com; " +
              "connect-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ " +
              "https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://fraymwb.firebaseapp.com https://apis.google.com; " +
              "frame-src 'self' https://fraymwb.firebaseapp.com https://accounts.google.com https://www.google.com https://www.gstatic.com https://apis.google.com; " +
              "child-src 'self' blob: https://cdnjs.cloudflare.com https://fraymwb.firebaseapp.com https://accounts.google.com https://apis.google.com; " +
              "worker-src 'self' blob: https://cdnjs.cloudflare.com; " +
              "font-src 'self' data:; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self' https://accounts.google.com https://fraymwb.firebaseapp.com; "
            ).replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.output.webassemblyModuleFilename = (isServer ? '../' : '') + 'static/wasm/[modulehash].wasm';
    return config;
  },
};

export default nextConfig;
