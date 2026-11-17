// `npm run dev:key`: creates this computer's own SSH key for the database tunnel that `npm run dev` opens (only if it
// doesn't exist yet) and prints the one command to paste in the server terminal (aaPanel > Terminal) to allow it.
// The key can only reach MongoDB on the server and read the site's MONGODB_URI line: no shell, no other commands.
// Each developer has their own key, so one can be removed alone (delete its line in /root/.ssh/authorized_keys).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const key = path.join(os.homedir(), ".ssh", "dirndlwear_dev_tunnel");

if (existsSync(key)) {
  console.log(`Using your existing key ${key}`);
} else {
  mkdirSync(path.dirname(key), { recursive: true });
  const label = `dirndlwear-dev-${os.userInfo().username}@${os.hostname()}`.replace(/\s+/g, "-");
  execFileSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", label, "-f", key], { stdio: "inherit" });
  console.log(`Created your key ${key} (keep it private, never send this file)`);
}

const pub = readFileSync(`${key}.pub`, "utf8").trim();
const options = 'restrict,port-forwarding,permitopen="127.0.0.1:27017",command="grep ^MONGODB_URI= /www/wwwroot/dirndlwear/.env.local"';
const keyBody = pub.split(/\s+/)[1];
// Safe to run twice: the key is only added if it isn't there yet.
const serverCommand =
  `mkdir -p /root/.ssh && touch /root/.ssh/authorized_keys && ` +
  `(grep -qF '${keyBody}' /root/.ssh/authorized_keys || echo '${options} ${pub}' >> /root/.ssh/authorized_keys) && ` +
  `chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys && echo OK`;

console.log(`
Paste the command below in the server terminal (aaPanel > Terminal) once. It contains only your PUBLIC key,
so it is safe to send. After that, npm run dev connects to the server's database by itself.

${serverCommand}
`);
