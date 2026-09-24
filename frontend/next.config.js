module.exports = {
  compress: false, // keeps server-sent events unbuffered through the proxy
  async rewrites() { return [{ source: '/api/:path*', destination: (process.env.API || 'http://127.0.0.1:4000') + '/api/:path*' }] },
}
