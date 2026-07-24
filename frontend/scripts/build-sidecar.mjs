import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(frontendDirectory, "..");
const backendDirectory = resolve(repositoryRoot, "backend");
const binaryDirectory = resolve(frontendDirectory, "src-tauri", "binaries");

function output(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8" }).trim();
  } catch {
    throw new Error(`${command} is required to build the desktop application`);
  }
}

const target = process.env.TAURI_ENV_TARGET_TRIPLE || output("rustc", ["--print", "host-tuple"]);
const extension = target.includes("windows") ? ".exe" : "";
const destination = resolve(binaryDirectory, `desktop-api-${target}${extension}`);
mkdirSync(binaryDirectory, { recursive: true });

execFileSync("go", ["build", "-trimpath", "-o", destination, "./cmd/desktop-api"], {
  cwd: backendDirectory,
  stdio: "inherit",
});
console.log(`Built Tauri sidecar: ${destination}`);

