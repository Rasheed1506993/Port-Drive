import { IStorageDriver } from './types';
import { LocalStorageDriver } from './local-driver';
import { S3StorageDriver } from './s3-driver';

let activeDriver: IStorageDriver | null = null;

export function getStorageDriver(): IStorageDriver {
  if (activeDriver) return activeDriver;

  const driverConfig = (process.env.STORAGE_DRIVER || 'local').toLowerCase();

  if (driverConfig === 's3') {
    const s3 = new S3StorageDriver();
    if (s3.isConfigured) {
      console.log('☁️ [Storage] Active driver: S3 / Cloudflare R2 Cloud Storage');
      activeDriver = s3;
      return s3;
    } else {
      console.warn(
        '⚠️ [Storage] S3 keys are placeholders or incomplete. Falling back safely to Local Storage Driver.'
      );
      activeDriver = new LocalStorageDriver();
      return activeDriver;
    }
  }

  // Default to local storage
  activeDriver = new LocalStorageDriver();
  return activeDriver;
}

export * from './types';
export * from './local-driver';
export * from './s3-driver';
