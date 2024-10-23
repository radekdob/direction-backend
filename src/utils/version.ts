import { readFileSync } from "fs";
import { join } from "path";

export const getVersion = (): string => {
  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
};
