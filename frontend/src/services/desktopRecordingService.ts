/**
 * Desktop Recording Service
 * Manages Recall.ai SDK Upload lifecycle
 *
 * This service communicates with the backend to create upload tokens
 * that are used by the Recall.ai Desktop SDK (Electron app).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface UploadToken {
  uploadId: string;
  uploadToken: string;
  region: string;
  webhookUrl?: string;
}

export interface CreateUploadOptions {
  userId: string;
  meetingTitle?: string;
}

export interface UploadStatus {
  uploadId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

/**
 * Create an SDK upload token
 * The Desktop SDK (Electron app) will use this token to authenticate uploads
 */
export async function createUploadToken(options: CreateUploadOptions): Promise<UploadToken> {
  const response = await fetch(`${API_BASE}/api/recall-desktop/create-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create SDK upload token');
  }

  const { upload } = await response.json();
  return upload;
}

/**
 * Get SDK upload status
 */
export async function getUploadStatus(uploadId: string): Promise<UploadStatus> {
  const response = await fetch(`${API_BASE}/api/recall-desktop/upload-status/${uploadId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload status');
  }

  const { upload } = await response.json();
  return upload;
}

/**
 * Cancel SDK upload
 */
export async function cancelUpload(uploadIdOrUserId: { uploadId?: string; userId?: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/api/recall-desktop/cancel-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(uploadIdOrUserId),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel SDK upload');
  }
}

/**
 * Get user's active upload
 */
export async function getUserActiveUpload(userId: string): Promise<UploadStatus | null> {
  const response = await fetch(`${API_BASE}/api/recall-desktop/my-upload/${userId}`);

  if (response.status === 404) {
    return null; // No active upload
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get user upload');
  }

  const { upload } = await response.json();
  return upload;
}
