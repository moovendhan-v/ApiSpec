import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized - Please sign in', { status: 401 });
    }

    const { title, content, isPublic = false, password, description, status = 'draft', tags = [], workspaceId } = await req.json();

    if (!title || !content) {
      return new NextResponse('Title and content are required', { status: 400 });
    }

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found in database. Please sign out and sign in again to recreate your account.',
          code: 'USER_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    // If workspaceId is provided, verify user has access
    if (workspaceId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id,
          },
        },
        include: {
          workspace: {
            include: {
              policies: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!member) {
        return new NextResponse('Access denied to workspace', { status: 403 });
      }

      // Check if user has permission to create documents
      const canCreate = ['OWNER', 'ADMIN', 'EDITOR'].includes(member.role) ||
        member.workspace.policies.some(
          (p) => p.appliesTo.includes(member.role) && p.canCreateDocuments
        );

      if (!canCreate) {
        return new NextResponse('No permission to create documents in this workspace', { status: 403 });
      }
    }

    // Create the document
    const document = await prisma.document.create({
      data: {
        title,
        content,
        description: description || null,
        isPublic,
        password: isPublic ? null : password || null,
        status,
        tags,
        version: 1,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isPublic: true,
        status: true,
        tags: true,
        version: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      ...document,
    });
  } catch (error) {
    console.error('Error saving document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination - only user's own documents
    const totalCount = await prisma.document.count({
      where: {
        userId: user.id,
      },
    });

    // Fetch only the user's own documents with pagination
    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isPublic: true,
        status: true,
        tags: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}