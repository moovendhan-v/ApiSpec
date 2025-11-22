import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// PATCH - Update member role
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
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
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const { role } = await req.json();

    if (!role) {
      return new NextResponse('Role is required', { status: 400 });
    }

    // Prevent changing owner role
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: params.memberId },
    });

    if (targetMember?.role === 'OWNER' && currentMember.role !== 'OWNER') {
      return new NextResponse('Cannot change owner role', { status: 403 });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: params.memberId },
      data: { role },
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
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Remove member from workspace
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
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

    // Check if user has permission to remove members
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
      include: {
        Workspace: {
          include: {
            WorkspacePolicy: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!currentMember) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const canRemove = ['OWNER', 'ADMIN'].includes(currentMember.role) ||
      currentMember.Workspace.WorkspacePolicy.some(
        (p: any) => p.appliesTo.includes(currentMember.role) && p.canRemoveMembers
      );

    if (!canRemove) {
      return new NextResponse('No permission to remove members', { status: 403 });
    }

    // Prevent removing owner
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: params.memberId },
    });

    if (targetMember?.role === 'OWNER') {
      return new NextResponse('Cannot remove workspace owner', { status: 403 });
    }

    await prisma.workspaceMember.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
