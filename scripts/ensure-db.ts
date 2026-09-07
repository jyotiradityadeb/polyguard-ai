import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
// Prisma's Windows schema engine requires the SQLite file to exist first.
const envFile = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const value =
  process.env.DATABASE_URL ??
  envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)/m)?.[1];
if (!value?.startsWith("file:"))
  throw new Error("Set DATABASE_URL to a SQLite file URL in .env.");
const path = resolve("prisma", value.slice(5));
if (!existsSync(path)) {
  mkdirSync(dirname(path), { recursive: true });
  closeSync(openSync(path, "wx"));
}
