/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // SerialPort ve native modüller için webpack ayarları
    if (isServer) {
      config.externals = [...config.externals, "serialport", "canvas"];
    }
    return config;
  },
};

module.exports = nextConfig;
