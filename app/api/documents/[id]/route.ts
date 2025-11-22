import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// GET - Get single document
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

    const document = await prisma.document.findUnique({
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
      },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Check access
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
      } else if (!document.isPublic) {
        return new NextResponse('Access denied', { status: 403 });
      }
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH - Update document
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Check if user has permission to edit
    let canEdit = document.userId === user.id;

    if (!canEdit && document.workspaceId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: document.workspaceId,
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

      if (member) {
        canEdit = ['OWNER', 'ADMIN', 'EDITOR'].includes(member.role) ||
          member.workspace.policies.some(
            (p) => p.appliesTo.includes(member.role) && p.canEditDocuments
          );
      }
    }

    if (!canEdit) {
      return new NextResponse('No permission to edit this document', { status: 403 });
    }

    const { title, content, description, isPublic, status, tags, workspaceId, changeLog } = await req.json();

    // Create a new version if content changed
    if (content && content !== document.content) {
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: document.version,
          title: document.title,
          content: document.content,
          description: document.description,
          changeLog: changeLog || 'Updated document',
        },
      });
    }

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags }),
        ...(workspaceId !== undefined && { workspaceId: workspaceId || null }),
        ...(content && content !== document.content && { version: document.version + 1 }),
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
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete document
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Check if user has permission to delete
    let canDelete = document.userId === user.id;

    if (!canDelete && document.workspaceId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: document.workspaceId,
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

      if (member) {
        canDelete = ['OWNER', 'ADMIN'].includes(member.role) ||
          member.workspace.policies.some(
            (p) => p.appliesTo.includes(member.role) && p.canDeleteDocuments
          );
      }
    }

    if (!canDelete) {
      return new NextResponse('No permission to delete this document', { status: 403 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
