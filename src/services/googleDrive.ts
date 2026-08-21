import { getAccessToken } from './firebaseAuth';
import { Purchase, AppSettings, PresetItem, DailyCheckIn } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
  description?: string;
}

export interface DriveQuotaInfo {
  limit?: string; // in bytes
  usage?: string; // in bytes
  usageInDrive?: string;
  usageInDriveTrash?: string;
  userDisplayName?: string;
  userEmail?: string;
  userPhotoLink?: string;
}

export interface SpotOnBackupPayload {
  version: string;
  exportedAt: string;
  appName: string;
  totalPurchases: number;
  purchases: Purchase[];
  settings: Partial<AppSettings>;
  presets: PresetItem[];
  checkIns?: DailyCheckIn[];
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Check if the user is authenticated with a valid Google Drive access token
 */
export async function getValidDriveToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NOT_AUTHENTICATED: Please sign in with Google to access Google Drive.');
  }
  return token;
}

/**
 * Fetch Google Drive storage quota and user profile info
 */
export async function fetchDriveQuota(): Promise<DriveQuotaInfo> {
  const token = await getValidDriveToken();
  const res = await fetch(
    `${DRIVE_API_BASE}/about?fields=user(displayName,emailAddress,photoLink),storageQuota`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Drive quota: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    limit: data.storageQuota?.limit,
    usage: data.storageQuota?.usage,
    usageInDrive: data.storageQuota?.usageInDrive,
    usageInDriveTrash: data.storageQuota?.usageInDriveTrash,
    userDisplayName: data.user?.displayName,
    userEmail: data.user?.emailAddress,
    userPhotoLink: data.user?.photoLink,
  };
}

/**
 * Search or list files stored in Google Drive
 */
export async function listSpotOnDriveFiles(folderName?: string): Promise<DriveFileItem[]> {
  const token = await getValidDriveToken();
  // Filter for SpotOn backup JSON files or CSV files
  const query = "(name contains 'spoton_' or description contains 'SpotOn') and trashed = false";
  const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink,description)&orderBy=modifiedTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list files from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Upload a complete JSON backup to Google Drive using multipart upload
 */
export async function uploadBackupToDrive(
  purchases: Purchase[],
  settings: AppSettings,
  presets: PresetItem[],
  customNote?: string,
  checkIns?: DailyCheckIn[]
): Promise<DriveFileItem> {
  const token = await getValidDriveToken();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `spoton_backup_${dateStr}.json`;

  const backupData: SpotOnBackupPayload = {
    version: '1.0',
    appName: 'SpotOn Spending Tracker',
    exportedAt: new Date().toISOString(),
    totalPurchases: purchases.length,
    purchases,
    settings: {
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      monthlyBudget: settings.monthlyBudget,
      alcoholBudget: settings.alcoholBudget,
      tobaccoBudget: settings.tobaccoBudget,
      showBudgetOnHome: settings.showBudgetOnHome,
      theme: settings.theme,
    },
    presets,
    checkIns: checkIns || [],
  };

  const fileContent = JSON.stringify(backupData, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: customNote || `SpotOn Spending Tracker Backup with ${purchases.length} records.`,
  };

  // Build multipart/related request body
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,description`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload backup to Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Upload a CSV report directly to Google Drive
 */
export async function uploadCsvToDrive(
  csvContent: string,
  filename: string,
  description?: string
): Promise<DriveFileItem> {
  const token = await getValidDriveToken();
  const metadata = {
    name: filename,
    mimeType: 'text/csv',
    description: description || 'SpotOn Spending Tracker CSV Export',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload CSV to Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Download a file's content from Google Drive
 */
export async function downloadDriveFileContent(fileId: string): Promise<string> {
  const token = await getValidDriveToken();
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to download file from Google Drive: ${res.statusText}`);
  }

  return await res.text();
}

/**
 * Delete a file from Google Drive (Requires user confirmation in UI before calling)
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getValidDriveToken();
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive: ${res.statusText}`);
  }

  return true;
}
