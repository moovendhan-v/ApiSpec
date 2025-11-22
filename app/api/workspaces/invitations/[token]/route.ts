import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get invitation details
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        Workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
          },
        },
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

    if (!invitation) {
      return new NextResponse('Invitation not found', { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return new NextResponse('Invitation already processed', { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return new NextResponse('Invitation expired', { status: 400 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Accept invitation
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
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

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
    });

    if (!invitation) {
      return new NextResponse('Invitation not found', { status: 404 });
    }

    if (invitation.email !== user.email) {
      return new NextResponse('Invitation not for this user', { status: 403 });
    }

    if (invitation.status !== 'PENDING') {
      return new NextResponse('Invitation already processed', { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return new NextResponse('Invitation expired', { status: 400 });
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
      return new NextResponse('Already a member', { status: 400 });
    }

    // Add user to workspace
    const member = await prisma.workspaceMember.create({
      data: {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
        updatedAt: new Date(),
      },
      include: {
        Workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    // Update invitation status
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Decline invitation
export async function DELETE(
  req: Request,
  { params }: { params: { token: string } }
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

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
    });

    if (!invitation) {
      return new NextResponse('Invitation not found', { status: 404 });
    }

    if (invitation.email !== user.email) {
      return new NextResponse('Invitation not for this user', { status: 403 });
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
