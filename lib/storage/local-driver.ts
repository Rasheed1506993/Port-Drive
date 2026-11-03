import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { IStorageDriver, StorageDownloadResult, StorageUploadResult } from './types';

export class LocalStorageDriver implements IStorageDriver {
  public readonly name = 'local' as const;
  public readonly isConfigured = true;
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Sanitize key by removing leading slashes and any ..
    const cleanKey = key.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');
    const fullPath = path.resolve(this.baseDir, cleanKey);

    // Verify it doesn't escape baseDir
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal detected outside storage root.');
    }
    return fullPath;
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StorageUploadResult> {
    const fullPath = this.resolveSafePath(key);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);

    return {
      key,
      size: buffer.length,
      mimeType: mimeType || (mime.lookup(fullPath) as string) || 'application/octet-stream',
      driver: 'local',
    };
  }

  async getDownloadStream(key: string): Promise<StorageDownloadResult> {
    const fullPath = this.resolveSafePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${key}`);
    }

    const stat = await fs.promises.stat(fullPath);
    const stream = fs.createReadStream(fullPath);
    const detectedMime = mime.lookup(fullPath) || 'application/octet-stream';

    return {
      stream,
      mimeType: detectedMime as string,
      size: stat.size,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete local file ${key}:`, err);
      return false;
    }
  }

  async deletePrefix(prefix: string): Promise<number> {
    try {
      const fullPath = this.resolveSafePath(prefix);
      if (fs.existsSync(fullPath)) {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          await fs.promises.rm(fullPath, { recursive: true, force: true });
          return 1;
        } else {
          await fs.promises.unlink(fullPath);
          return 1;
        }
      }
      return 0;
    } catch (err) {
      console.error(`Failed to delete local prefix ${prefix}:`, err);
      return 0;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Local file storage is active and ready at ${this.baseDir}`,
    };
  }
}
