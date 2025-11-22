import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get document version history
export async function GET(
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

    // Check if user has access to the document
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Check access (owner or workspace member)
    if (document.userId !== user.id) {
      if (document.workspaceId) {
        const member = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: document.workspaceId,
              userId: user.id,
            },
          },
        });

        if (!member) {
          return new NextResponse('Access denied', { status: 403 });
        }
      } else {
        return new NextResponse('Access denied', { status: 403 });
      }
    }

    // Get all versions
    const versions = await prisma.documentVersion.findMany({
      where: {
        documentId: params.id,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
