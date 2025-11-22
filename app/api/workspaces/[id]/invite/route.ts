import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST - Invite user to workspace
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

    const { email, role = 'MEMBER' } = await req.json();

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    // Check if user has permission to invite
    const member = await prisma.workspaceMember.findUnique({
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

    if (!member) {
      return new NextResponse('Access denied', { status: 403 });
    }

    // Check permissions
    const canInvite = ['OWNER', 'ADMIN'].includes(member.role) ||
      member.Workspace.WorkspacePolicy.some(
        (p) => p.appliesTo.includes(member.role) && p.canInviteMembers
      );

    if (!canInvite) {
      return new NextResponse('No permission to invite members', { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: params.id,
        User: {
          email: email,
        },
      },
    });

    if (existingMember) {
      return new NextResponse('User is already a member', { status: 400 });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: params.id,
        email: email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return new NextResponse('Invitation already sent', { status: 400 });
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: params.id,
        email,
        role,
        token,
        invitedById: user.id,
        expiresAt,
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
          },
        },
      },
    });

    // TODO: Send email notification
    // await sendInvitationEmail(invitation);

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET - List pending invitations
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

    // Check if user is member
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: params.id,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
