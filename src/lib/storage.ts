import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const STORAGE_PATH = process.env.STORAGE_PATH || "./storage";

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export async function uploadFile(
  buffer: Buffer,
  filePath: string
): Promise<string> {
  const fullPath = path.join(STORAGE_PATH, filePath);
  ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);
  return filePath;
}

export async function getFilePath(filePath: string): Promise<string> {
  return path.join(STORAGE_PATH, filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(STORAGE_PATH, filePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File doesn't exist, that's fine
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  const fullPath = path.join(STORAGE_PATH, filePath);
  return existsSync(fullPath);
}

export function getStorageUrl(filePath: string): string {
  return `/api/files/${filePath}`;
}

ensureDir(path.join(STORAGE_PATH, "videos"));
ensureDir(path.join(STORAGE_PATH, "recordings"));
ensureDir(path.join(STORAGE_PATH, "resources"));
ensureDir(path.join(STORAGE_PATH, "thumbnails"));
