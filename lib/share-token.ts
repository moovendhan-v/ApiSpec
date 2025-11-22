import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET || 'your-secret-key-change-this-in-production';

export interface ShareTokenPayload {
  documentId: string;
  userId: string;
  expiresAt: number;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
  };
}

// Create HMAC signature for the payload
function createHmacSignature(payload: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('base64url');
}

// Create a shareable HMAC-signed token
export async function createShareToken(
  documentId: string,
  userId: string,
  expiryHours: number = 24,
  permissions: ShareTokenPayload['permissions'] = {
    canView: true,
    canEdit: false,
    canDownload: true,
  }
): Promise<string> {
  const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000;

  const payload: ShareTokenPayload = {
    documentId,
    userId,
    expiresAt,
    permissions,
  };

  // Encode payload as base64url
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString('base64url');

  // Create HMAC signature
  const signature = createHmacSignature(payloadBase64);

  // Combine payload and signature
  return `${payloadBase64}.${signature}`;
}

// Verify and decode share token
export async function verifyShareToken(token: string): Promise<ShareTokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null; // Invalid token format
    }

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmacSignature(payloadBase64);
    if (signature !== expectedSignature) {
      return null; // Invalid signature
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: ShareTokenPayload = JSON.parse(payloadJson);

    // Check if token is expired
    if (Date.now() > payload.expiresAt) {
      return null; // Token expired
    }

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Generate shareable URL
export function generateShareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${token}`;
}

// Parse expiry time to human-readable format
export function getExpiryLabel(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}
