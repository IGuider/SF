import { mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), "sf-gh-pages-"));

function getSpawnSpec(command, args) {
  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    return {
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", [command, ...args].join(" ")],
    };
  }

  return { command, args };
}

function run(command, args, options = {}) {
  const spec = getSpawnSpec(command, args);
  const result = spawnSync(spec.command, spec.args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`,
    );
  }
}

function runOutput(command, args, options = {}) {
  const spec = getSpawnSpec(command, args);
  const result = spawnSync(spec.command, spec.args, {
    cwd: rootDir,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`,
    );
  }

  return result.stdout.trim();
}

function parseGitHubRemote(remoteUrl) {
  const normalized = remoteUrl.replace(/\.git$/, "");
  const match = normalized.match(/github\.com[:/](.+?)\/(.+)$/i);

  if (!match) {
    throw new Error(
      `Could not parse GitHub owner/repo from remote URL: ${remoteUrl}`,
    );
  }

  return {
    owner: match[1],
    repo: match[2],
    slug: `${match[1]}/${match[2]}`,
  };
}

const gitCommand = "git";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const remoteUrl = runOutput(gitCommand, [
  "config",
  "--get",
  "remote.origin.url",
]);
const { owner, slug } = parseGitHubRemote(remoteUrl);
const userName =
  runOutput(gitCommand, ["config", "--get", "user.name"], {
    stdio: "pipe",
  }).trim() || owner;
const userEmail =
  runOutput(gitCommand, ["config", "--get", "user.email"], {
    stdio: "pipe",
  }).trim() || `${owner}@users.noreply.github.com`;

try {
  run(npmCommand, ["run", "build"], {
    env: {
      ...process.env,
      GITHUB_REPOSITORY: slug,
      GITHUB_REPOSITORY_OWNER: owner,
      GITHUB_ACTIONS: "true",
    },
  });

  cpSync(resolve(rootDir, "dist"), tempDir, { recursive: true });

  run(gitCommand, ["init", "-b", "gh-pages"], { cwd: tempDir });
  run(gitCommand, ["config", "user.name", userName], { cwd: tempDir });
  run(gitCommand, ["config", "user.email", userEmail], { cwd: tempDir });
  run(gitCommand, ["add", "."], { cwd: tempDir });
  run(gitCommand, ["commit", "-m", "Deploy GitHub Pages"], { cwd: tempDir });
  run(gitCommand, ["remote", "add", "origin", remoteUrl], { cwd: tempDir });
  run(gitCommand, ["push", "--force", "origin", "gh-pages"], { cwd: tempDir });
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
