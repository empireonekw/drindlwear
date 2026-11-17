// PM2 app for dirndlwear.de on the server (scripts/server/setup.sh, scripts/deploy.sh).
// Next.js reads .env.local by itself. Listens on 127.0.0.1 only; nginx is in front.
module.exports = {
  apps: [
    {
      name: "dirndlwear",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 4820",
      env: { NODE_ENV: "production" },
      max_memory_restart: "700M",
    },
  ],
};
