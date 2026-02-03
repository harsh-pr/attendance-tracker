/* global process */
import { spawn } from "child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const processes = [];

function startProcess(label, args) {
  const child = spawn(npmCommand, args, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
  });

  processes.push(child);
}

function shutdown() {
  processes.forEach((child) => {
    if (!child.killed) {
      child.kill();
    }
  });
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startProcess("server", ["run", "dev:server"]);
startProcess("client", ["run", "dev:client"]);