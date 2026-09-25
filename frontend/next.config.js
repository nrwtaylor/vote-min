module.exports = {
  compress: false, // keeps server-sent events unbuffered through the proxy
  basePath: process.env.BASE_PATH || '', // set BASE_PATH=/vote when served under a subpath, e.g. behind nginx
  env: { NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '' }, // exposes it to the browser for manual fetch()/EventSource() calls below
  // Frontend code still calls /api/v1/*; strip the /api so it lands on the backend's bare /v1/* routes.
  async rewrites() { return [{ source: '/api/:path*', destination: (process.env.API || 'http://127.0.0.1:3043') + '/:path*' }] },
}
