// `npm run dev`: starts `next dev`. When .env.development.local sets DEV_DB_TUNNEL, it first opens an SSH tunnel to
// MongoDB on the server (and reopens it if it drops), asks the server for the database login through the same key and
// hands it to Next.js, so no database password is ever stored on this computer. The tunnel closes with the dev server.
// Without DEV_DB_TUNNEL this is plain `next dev` with .env.local.
//
//   DEV_DB_TUNNEL=root@13.140.168.178                 who to connect as
//   DEV_DB_TUNNEL_KEY=~/.ssh/dirndlwear_dev_tunnel    optional, the tunnel-only key (npm run dev:key)
//   DEV_DB_PORT=27021                                 optional, the local end of the tunnel
//
// This is the LIVE database of dirndlwear.de: anything changed here changes on the live site.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const ENV_FILE = ".env.development.local";

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const vars = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return vars;
}

const portIsOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port }, () => { socket.destroy(); resolve(true); });
    socket.on("error", () => resolve(false));
    socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
  });

const env = readEnvFile(ENV_FILE);
const target = env.DEV_DB_TUNNEL;
// 27019 is rankkw's tunnel, 27020 sellpify's.
const localPort = Number(env.DEV_DB_PORT) || 27021;
const key = path.normalize((env.DEV_DB_TUNNEL_KEY || "~/.ssh/dirndlwear_dev_tunnel").replace(/^~(?=[\\/])/, os.homedir()));
const sshBase = ["-i", key, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new"];
const childEnv = { ...process.env };
let tunnel = null;
let stopping = false;
let everConnected = false;

function howToFix() {
  console.error("[db-tunnel] New on this computer? Run  npm run dev:key  and paste the command it prints in the server terminal.");
}

function openTunnel() {
  tunnel = spawn(
    "ssh",
    [...sshBase, "-o", "ExitOnForwardFailure=yes", "-o", "ServerAliveInterval=30", "-N", "-L", `${localPort}:127.0.0.1:27017`, target],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  tunnel.on("error", (err) => console.error(`[db-tunnel] Could not run ssh: ${err.message}`));
  tunnel.on("exit", () => {
    tunnel = null;
    if (stopping) return;
    if (!everConnected) {
      console.error("[db-tunnel] Could not connect to the database server (see the ssh message above).");
      howToFix();
      return;
    }
    console.error("[db-tunnel] Connection to the database server closed; reconnecting in 5 s…");
    setTimeout(() => { if (!stopping) openTunnel(); }, 5000);
  });
}

if (target && !existsSync(key)) {
  console.warn(`[db-tunnel] No SSH key at ${key}, so no connection to the database server.`);
  howToFix();
} else if (target) {
  // The key's forced command on the server prints the site's MONGODB_URI (and nothing else is allowed).
  let serverUri = "";
  try {
    const out = execFileSync("ssh", [...sshBase, "-T", "-o", "LogLevel=ERROR", "-o", "ConnectTimeout=15", target], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    serverUri = out.match(/^MONGODB_URI=(\S+)/m)?.[1] ?? "";
  } catch {
    // Reported below.
  }
  if (!serverUri.includes("@127.0.0.1:27017/")) {
    console.error("[db-tunnel] The server did not give the database login.");
    howToFix();
  } else {
    // directConnection: the server's MongoDB is a replica set that names itself 127.0.0.1:27017; without it the driver
    // would follow that name to this computer's port 27017 instead of staying on the tunnel.
    const local = new URL(serverUri.replace("@127.0.0.1:27017/", `@127.0.0.1:${localPort}/`));
    local.searchParams.set("directConnection", "true");
    childEnv.MONGODB_URI = local.toString();
    if (await portIsOpen(localPort)) {
      everConnected = true;
      console.log(`[db-tunnel] Port ${localPort} is already open (a tunnel is running); using it.`);
    } else {
      openTunnel();
      for (let i = 0; i < 20 && !everConnected; i++) {
        await new Promise((r) => setTimeout(r, 500));
        everConnected = await portIsOpen(localPort);
      }
      console.log(everConnected
        ? `[db-tunnel] Connected: 127.0.0.1:${localPort} → MongoDB on ${target.split("@").pop()} (LIVE data of dirndlwear.de)`
        : `[db-tunnel] Tunnel not up yet on port ${localPort}; pages that need the database will fail until it is.`);
    }
  }
}

const nextBin = path.join("node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], { stdio: "inherit", env: childEnv });

function stop() {
  stopping = true;
  tunnel?.kill();
}
// Ctrl+C reaches the dev server too; wait for it to exit, then close the tunnel.
process.on("SIGINT", () => {});
process.on("SIGTERM", () => server.kill("SIGTERM"));
server.on("exit", (code) => {
  stop();
  process.exit(code ?? 0);
});
