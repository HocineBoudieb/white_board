import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "worker-src blob: 'self' https://cdnjs.cloudflare.com; child-src blob: 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/".replace(/\s{2,}/g, ' ').trim(),
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
