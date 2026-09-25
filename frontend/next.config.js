const { execSync } = require('node:child_process')
// Read at build time (this file runs once, during `next build`/`next dev`), not baked in separately —
// so it's whatever commit was actually checked out when this build was produced. Null if not a git checkout.
const git = cmd => { try { return execSync(cmd, { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null } catch { return null } }
 
module.exports = {
  compress: false, // keeps server-sent events unbuffered through the proxy
  basePath: process.env.BASE_PATH || '', // set BASE_PATH=/vote when served under a subpath, e.g. behind nginx
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '', // exposes it to the browser for manual fetch()/EventSource() calls below
    NEXT_PUBLIC_GIT_COMMIT: git('git rev-parse HEAD') || '',
  },
  // Frontend code still calls /api/v1/*; strip the /api so it lands on the backend's bare /v1/* routes.
  async rewrites() { return [{ source: '/api/:path*', destination: (process.env.API || 'http://127.0.0.1:3349') + '/:path*' }] },
}
 
