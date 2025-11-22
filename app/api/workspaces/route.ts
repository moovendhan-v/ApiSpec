import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - List all workspaces for the current user
export async function GET(req: Request) {
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

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { createdById: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            documents: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create a new workspace
export async function POST(req: Request) {
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

    const { name, description, visibility = 'PRIVATE' } = await req.json();

    if (!name) {
      return new NextResponse('Workspace name is required', { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8);

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        visibility,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
        policies: {
          create: {
            name: 'Default Policy',
            description: 'Default workspace policy',
            canCreateDocuments: true,
            canEditDocuments: true,
            canDeleteDocuments: false,
            canPublishDocuments: false,
            canInviteMembers: false,
            canRemoveMembers: false,
            canManageSettings: false,
            appliesTo: ['MEMBER'],
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            documents: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
