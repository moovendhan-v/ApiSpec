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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const documentId = params.id;

    if (!documentId) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if document exists and belongs to the user
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return new NextResponse('Document not found', { status: 404 });
    }

    if (existingDocument.userId !== user.id) {
      return new NextResponse('Forbidden - You can only update your own documents', { status: 403 });
    }

    const { title, content, isPublic = false, password, description, status, tags } = await request.json();

    if (!title || !content) {
      return new NextResponse('Title and content are required', { status: 400 });
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        title,
        content,
        description: description || null,
        isPublic,
        password: isPublic ? null : password || null,
        status: status || existingDocument.status,
        tags: tags || existingDocument.tags,
      },
    });

    return NextResponse.json(document); 
  } catch (error) {
    console.error('Error updating document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const documentId = params.id;

    if (!documentId) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if document exists and belongs to the user
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return new NextResponse('Document not found', { status: 404 });
    }

    if (existingDocument.userId !== user.id) {
      return new NextResponse('Forbidden - You can only delete your own documents', { status: 403 });
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
