import { createShareToken, verifyShareToken } from '../share-token';

describe('HMAC Share Token', () => {
  const mockDocumentId = 'doc-123';
  const mockUserId = 'user-456';

  it('should create and verify a valid token', async () => {
    const token = await createShareToken(mockDocumentId, mockUserId, 24, {
      canView: true,
      canEdit: false,
      canDownload: true,
    });

    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(2); // payload.signature

    const payload = await verifyShareToken(token);
    expect(payload).toBeTruthy();
    expect(payload?.documentId).toBe(mockDocumentId);
    expect(payload?.userId).toBe(mockUserId);
    expect(payload?.permissions.canView).toBe(true);
    expect(payload?.permissions.canEdit).toBe(false);
    expect(payload?.permissions.canDownload).toBe(true);
  });

  it('should reject tampered tokens', async () => {
    const token = await createShareToken(mockDocumentId, mockUserId);
    
    // Tamper with the token
    const [payload, signature] = token.split('.');
    const tamperedToken = `${payload}.${signature}x`;

    const result = await verifyShareToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('should reject expired tokens', async () => {
    // Create token that expires immediately
    const token = await createShareToken(mockDocumentId, mockUserId, -1);

    const result = await verifyShareToken(token);
    expect(result).toBeNull();
  });

  it('should reject malformed tokens', async () => {
    const result = await verifyShareToken('invalid-token');
    expect(result).toBeNull();
  });
});
