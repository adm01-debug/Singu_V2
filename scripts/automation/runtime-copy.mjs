import { readdirSync, readFileSync, mkdirSync, lstatSync } from "node:fs";
import { dirname, join } from "node:path";
import { atomic, fail } from "./common.mjs";
export function cacheRuntime(script, base) {
  const directory = join(dirname(script), "automation");
  const destination = join(base, "runtime/automation");
  if (lstatSync(directory).isSymbolicLink())
    throw fail("módulos da ponte não podem ser symlink");
  if (existsDirectory(destination) && lstatSync(destination).isSymbolicLink())
    throw fail("cache de módulos da ponte não pode ser symlink");
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const files = [];
  for (const name of readdirSync(directory)) {
    const source = join(directory, name);
    if (
      !name.endsWith(".mjs") ||
      !lstatSync(source).isFile() ||
      lstatSync(source).isSymbolicLink()
    )
      throw fail("módulo da ponte inválido");
    const relative = "runtime/automation/" + name;
    atomic(join(base, relative), readFileSync(source));
    files.push(relative);
  }
  return files;
}
function existsDirectory(directory) {
  try {
    lstatSync(directory);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
