module.exports = {
  compress: false,
  basePath: process.env.BASE_PATH || '',
  env: { NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '' },
  async rewrites() { return [{ source: '/api/:path*', destination: (process.env.API || 'http://127.0.0.1:4000') + '/api/:path*' }] },
}
