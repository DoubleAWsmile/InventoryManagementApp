import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RELEASE_PRODUCT_NAME = "InventoryManagementApp";
export const STABLE_WINDOWS_FILENAME = `${RELEASE_PRODUCT_NAME}-Windows-Setup.exe`;
export const WINDOWS_TARGET = "x86_64-pc-windows-msvc";

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tauriDirectory = resolve(frontendDirectory, "src-tauri");

export function parseReleaseTag(tag) {
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?)$/.exec(tag);
  if (!match) {
    throw new Error(`Release tag "${tag}" must use v<semver>, for example v1.0.0 or v1.0.0-rc.1`);
  }
  return {
    tag,
    version: match[1],
    prerelease: match[1].includes("-"),
  };
}

export function configuredVersions(root = frontendDirectory) {
  const packageVersion = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version;
  const tauriVersion = JSON.parse(
    readFileSync(resolve(root, "src-tauri", "tauri.conf.json"), "utf8"),
  ).version;
  const cargo = readFileSync(resolve(root, "src-tauri", "Cargo.toml"), "utf8");
  const cargoVersion = /^\s*version\s*=\s*"([^"]+)"/m.exec(cargo)?.[1];
  if (!cargoVersion) throw new Error("Could not read the package version from src-tauri/Cargo.toml");
  return { packageVersion, tauriVersion, cargoVersion };
}

export function validateVersionConsistency(tag, root = frontendDirectory) {
  const release = parseReleaseTag(tag);
  const versions = configuredVersions(root);
  const mismatches = Object.entries(versions).filter(([, version]) => version !== release.version);
  if (mismatches.length) {
    throw new Error(
      `Tag ${tag} does not match configured versions: ${Object.entries(versions)
        .map(([name, version]) => `${name}=${version}`)
        .join(", ")}`,
    );
  }
  return { ...release, ...versions };
}

export function expectedSidecarPath(root = frontendDirectory) {
  return resolve(root, "src-tauri", "binaries", `desktop-api-${WINDOWS_TARGET}.exe`);
}

export function stableArtifactNames(version) {
  return {
    nsis: `${RELEASE_PRODUCT_NAME}-${version}-windows-x86_64-setup.exe`,
    msi: `${RELEASE_PRODUCT_NAME}-${version}-windows-x86_64.msi`,
    stableNsis: STABLE_WINDOWS_FILENAME,
  };
}

function findSingleInstaller(directory, extension) {
  if (!existsSync(directory)) throw new Error(`Installer directory does not exist: ${directory}`);
  const matches = selectInstallerNames(readdirSync(directory), extension).map((name) =>
    resolve(directory, name),
  );
  return matches[0];
}

export function selectInstallerNames(names, extension) {
  const matches = names.filter((name) => name.toLowerCase().endsWith(extension));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${extension} installer; found ${matches.length}`);
  }
  return matches;
}

export function prepareReleaseArtifacts(tag, outputDirectory, root = frontendDirectory) {
  const release = validateVersionConsistency(tag, root);
  const sidecar = expectedSidecarPath(root);
  if (!existsSync(sidecar)) {
    throw new Error(`Expected Windows sidecar is missing: ${sidecar}. Run npm run desktop:sidecar first.`);
  }

  const bundleRoot = resolve(root, "src-tauri", "target", "release", "bundle");
  const sourceNsis = findSingleInstaller(resolve(bundleRoot, "nsis"), ".exe");
  const sourceMsi = findSingleInstaller(resolve(bundleRoot, "msi"), ".msi");
  for (const installer of [sourceNsis, sourceMsi]) {
    if (!basename(installer).includes(`_${release.version}_`)) {
      throw new Error(`Installer version does not match ${release.version}: ${basename(installer)}`);
    }
  }
  const names = stableArtifactNames(release.version);
  const destination = resolve(outputDirectory);
  mkdirSync(destination, { recursive: true });

  const artifacts = [
    [sourceNsis, resolve(destination, names.nsis)],
    [sourceMsi, resolve(destination, names.msi)],
    [sourceNsis, resolve(destination, names.stableNsis)],
  ];
  for (const [source, target] of artifacts) copyFileSync(source, target);
  return { ...release, artifacts: artifacts.map(([, target]) => target) };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main() {
  const command = process.argv[2];
  const tag = argument("--tag");
  if (!tag) throw new Error("--tag is required");

  if (command === "validate") {
    console.log(JSON.stringify(validateVersionConsistency(tag), null, 2));
    return;
  }
  if (command === "prepare") {
    const output = argument("--output");
    if (!output) throw new Error("--output is required");
    console.log(JSON.stringify(prepareReleaseArtifacts(tag, output), null, 2));
    return;
  }
  throw new Error(`Unknown release command "${command ?? ""}"`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`release: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
