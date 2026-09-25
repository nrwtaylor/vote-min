// pm2 start ecosystem.config.cjs
// Run `npm run build` first — this only serves the already-built .next output, it doesn't build it.
// basePath and NEXT_PUBLIC_BASE_PATH are baked in at build time from .env.local, not read at runtime,
// so re-run `npm run build` (not just a pm2 restart) whenever .env.local changes.
module.exports = {
  apps: [{
    name: 'vote-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3049',
    cwd: __dirname,
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
  }],
}
