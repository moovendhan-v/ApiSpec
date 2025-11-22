import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyShareToken } from '@/lib/share-token';

// GET - Access shared document via HMAC-signed token
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Verify HMAC token
    const payload = await verifyShareToken(params.token);

    if (!payload) {
      return new NextResponse('Invalid or expired share link', { status: 401 });
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: payload.documentId },
      select: {
        id: true,
        title: true,
        content: true,
        description: true,
        status: true,
        version: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Return document with permissions
    return NextResponse.json({
      ...document,
      permissions: payload.permissions,
      expiresAt: new Date(payload.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error('Error accessing shared document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
