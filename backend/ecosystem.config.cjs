// pm2 start ecosystem.config.cjs
// Run from inside backend/ — cwd matters, since .env and node_modules are resolved relative to it.
module.exports = {
  apps: [{
    name: 'vote-backend',
    script: 'src/index.js',
    cwd: __dirname,
    node_args: '--env-file=.env', // requires backend/.env to exist (see .env.example); Node 20.6+
    exec_mode: 'fork',            // stays single-instance: in-memory feed/SSE state isn't shared across instances
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
  }],
}
