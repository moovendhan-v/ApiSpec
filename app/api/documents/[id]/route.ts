import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const documentId = params.id;

    if (!documentId) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Only allow access if:
    // 1. The document is public, OR
    // 2. The user is authenticated and is the owner of the document
    const isOwner = session?.user?.email && document.user.email === session.user.email;
    
    if (!document.isPublic && !isOwner) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
