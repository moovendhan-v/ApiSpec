import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { createShareToken, generateShareUrl } from '@/lib/share-token';

// POST - Create shareable link
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Check if user owns the document or is workspace member
    let hasAccess = document.userId === user.id;

    if (!hasAccess && document.workspaceId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: document.workspaceId,
            userId: user.id,
          },
        },
      });
      hasAccess = !!member;
    }

    if (!hasAccess) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const { expiryHours = 24, canEdit = false, canDownload = true } = await req.json();

    // Create JWT token
    const token = await createShareToken(
      document.id,
      user.id,
      expiryHours,
      {
        canView: true,
        canEdit,
        canDownload,
      }
    );

    // Generate shareable URL
    const shareUrl = generateShareUrl(token, process.env.NEXT_PUBLIC_APP_URL);

    return NextResponse.json({
      token,
      shareUrl,
      expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
      expiryHours,
      permissions: {
        canView: true,
        canEdit,
        canDownload,
      },
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
