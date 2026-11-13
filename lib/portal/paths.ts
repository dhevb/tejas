import path from "node:path";
import { dataDir } from "@/lib/registration/paths";

export function portalDataDir(): string {
  return process.env.TEJAS_PORTAL_DATA_DIR || path.join(dataDir(), "portal");
}
