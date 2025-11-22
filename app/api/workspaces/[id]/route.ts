import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get workspace details
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        WorkspaceMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        Document: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        WorkspacePolicy: {
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            Document: true,
            WorkspaceMember: true,
          },
        },
      },
    });

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 });
    }

    // Check if user has access
    const isMember = workspace.WorkspaceMember.some((m) => m.userId === user.id);
    const isCreator = workspace.createdById === user.id;

    if (!isMember && !isCreator && workspace.visibility !== 'PUBLIC') {
      return new NextResponse('Access denied', { status: 403 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH - Update workspace
export async function PATCH(
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

    // Check if user is owner or admin
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const { name, description, visibility, avatar } = await req.json();

    const workspace = await prisma.workspace.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility }),
        ...(avatar !== undefined && { avatar }),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        WorkspaceMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete workspace
export async function DELETE(
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

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
    });

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 });
    }

    if (workspace.createdById !== user.id) {
      return new NextResponse('Only workspace owner can delete', { status: 403 });
    }

    await prisma.workspace.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
