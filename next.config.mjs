/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  swcMinify: true,
  
  // Reduce bundle size
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
  
  // Reduce page size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize React
  reactStrictMode: true,

  output: 'export',  // Enable static exports
  distDir: 'out',
  basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '',
};

export default nextConfig; 