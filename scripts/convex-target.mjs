import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [, , target, ...rawArgs] = process.argv;

const envFiles = {
  local: ".env.convex.local",
  prod: ".env.convex.prod",
};

const envFile = envFiles[target];

if (!envFile) {
  console.error("Unknown Convex target. Use `local` or `prod`.");
  process.exit(1);
}

if (!existsSync(envFile)) {
  console.error(`Missing env file: ${envFile}`);
  process.exit(1);
}

const args = rawArgs.filter((arg) => arg !== "--");

if (args.length === 0) {
  console.error("Missing Convex command. Example: `pnpm convex:local -- deploy`");
  process.exit(1);
}

if (args.includes("--env-file")) {
  console.error("Do not pass --env-file manually when using convex:local/convex:prod.");
  process.exit(1);
}

const [command, ...rest] = args;

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "convex", command, "--env-file", envFile, ...rest],
  {
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
