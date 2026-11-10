import { fail } from "./lib.mjs";

export const exits = {
  healthy: 0,
  checked: 0,
  no_changes: 0,
  validated_patch: 0,
  integrated_patch: 0,
  missing_dependencies: 2,
  blocked_baseline: 3,
  failed: 1,
  skipped_busy: 75,
  pending_patch: 4,
  blocked_network_sandbox: 5,
};

export function parseArgs(args) {
  const [action, ...rest] = args;
  if (!["doctor", "check", "heal"].includes(action))
    fail("Use doctor, check ou heal");
  const options = { action };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (
      !["--root", "--ref", "--config", "--state"].includes(key) ||
      !rest[i + 1] ||
      rest[i + 1].startsWith("--") ||
      options[key.slice(2)] !== undefined
    )
      fail("Argumento desconhecido, duplicado ou sem valor");
    options[key.slice(2)] = rest[i + 1];
  }
  if (!options.root || (action !== "doctor" && !options.ref))
    fail("--root obrigatório; --ref explícita obrigatória para check/heal");
  return options;
}

export function redact(output) {
  return output
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[JWT REDIGIDO]",
    )
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDIGIDO]")
    .replace(
      /\b(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]{12,}/g,
      "[TOKEN REDIGIDO]",
    )
    .replace(
      /\b([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*[=:]\s*)[^\s,;]+/g,
      "$1[REDIGIDO]",
    );
}
