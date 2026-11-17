import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Starting SurakshaSathi Backend and Frontend...");

const backend = spawn(process.execPath, [path.join(__dirname, "backend", "server.js")], {
  cwd: __dirname,
  stdio: "inherit",
});

const viteBin = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");
const frontend = spawn(process.execPath, [viteBin, "--host", "0.0.0.0", "--port", "8443"], {
  cwd: __dirname,
  stdio: "inherit",
});

backend.on("exit", (code) => {
  if (code) console.log(`Backend exited with code ${code}`);
});

frontend.on("exit", (code) => {
  if (code) console.log(`Frontend exited with code ${code}`);
});

process.on("SIGINT", () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
