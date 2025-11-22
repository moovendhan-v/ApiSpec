import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - List workspace policies
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

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    const policies = await prisma.workspacePolicy.findMany({
      where: {
        workspaceId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create workspace policy
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

    const {
      name,
      description,
      canCreateDocuments,
      canEditDocuments,
      canDeleteDocuments,
      canPublishDocuments,
      canInviteMembers,
      canRemoveMembers,
      canManageSettings,
      requireApproval,
      allowedDomains,
      blockedDomains,
      appliesTo,
    } = await req.json();

    if (!name) {
      return new NextResponse('Policy name is required', { status: 400 });
    }

    const policy = await prisma.workspacePolicy.create({
      data: {
        id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: params.id,
        name,
        description,
        canCreateDocuments: canCreateDocuments ?? true,
        canEditDocuments: canEditDocuments ?? true,
        canDeleteDocuments: canDeleteDocuments ?? false,
        canPublishDocuments: canPublishDocuments ?? false,
        canInviteMembers: canInviteMembers ?? false,
        canRemoveMembers: canRemoveMembers ?? false,
        canManageSettings: canManageSettings ?? false,
        requireApproval: requireApproval ?? false,
        allowedDomains: allowedDomains ?? [],
        blockedDomains: blockedDomains ?? [],
        appliesTo: appliesTo ?? ['MEMBER'],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error creating policy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
